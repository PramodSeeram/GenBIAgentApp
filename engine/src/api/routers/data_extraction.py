"""
Data extraction API for Chat4BA
This module provides endpoints for:
1. Extracting data from uploaded files
2. Storing thread history
3. Getting recommendations based on uploaded data
4. Deleting files from Qdrant
"""

import os
import json
import uuid
from typing import List, Dict, Any, Optional
from datetime import datetime
from fastapi import APIRouter, HTTPException, Request, Response, BackgroundTasks, UploadFile, File, Depends
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import pandas as pd
import tempfile
import logging
from io import BytesIO
from src.database.vector_db.qdrant_client import get_qdrant_client
from src.llm.providers.azure_openai import generate_query_embedding, ask_llm_with_context
from src.processing.file_processor import FileProcessor
from src.utils.security import validate_file

# Initialize router
router = APIRouter()
logger = logging.getLogger(__name__)

# Constants
THREAD_COLLECTION = "chat4ba_threads"

# Models
class ThreadMessage(BaseModel):
    role: str
    content: str
    timestamp: Optional[datetime] = None

class Thread(BaseModel):
    id: str
    title: str
    messages: List[ThreadMessage]
    created_at: datetime
    updated_at: datetime
    associated_files: List[str] = []
    
class RecommendedQuestion(BaseModel):
    question: str
    context: str

# Helper functions
def extract_file_data(file_path: str, filename: str) -> Dict[str, Any]:
    """Extract data from a file for preview"""
    try:
        ext = os.path.splitext(file_path)[1].lower()
        
        # For CSV and Excel files
        if ext in ['.csv', '.xlsx', '.xls']:
            try:
                df = pd.read_excel(file_path) if ext in ['.xlsx', '.xls'] else pd.read_csv(file_path)
                records = df.head(10).to_dict('records')
                return {
                    "success": True,
                    "filename": filename,
                    "content": records,
                    "metadata": {
                        "rows": len(df),
                        "columns": len(df.columns)
                    }
                }
            except Exception as e:
                logger.error(f"Error extracting data from {filename}: {e}")
        
        # For other file types, return basic info
        return {
            "success": True,
            "filename": filename,
            "content": [{"text": f"File preview for {filename}"}],
            "metadata": {
                "type": ext.replace('.', '')
            }
        }
    except Exception as e:
        logger.error(f"Error in extract_file_data: {e}")
        return {
            "success": False,
            "filename": filename,
            "error": str(e)
        }

async def generate_recommended_questions(files: List[str], count: int = 5) -> List[RecommendedQuestion]:
    """Generate recommended questions based on uploaded files"""
    if not files:
        return []
    
    try:
        # Create a prompt for OpenAI/Azure OpenAI
        prompt = f"""Based on the following files: {', '.join(files)}, 
        generate {count} relevant questions that a user might want to ask about this data. 
        The questions should be diverse and cover different aspects of the data. 
        Format your response as a JSON array of objects with 'question' and 'context' fields."""
        
        context = "Generate recommended questions for the user based on their uploaded files."
        system_prompt = """You are a helpful AI assistant that generates relevant questions for data analysis.
        Always respond with valid JSON in the format: [{"question": "...", "context": "..."}]"""
        
        # Get response from LLM
        response_text = await ask_llm_with_context(prompt, context, system_prompt)
        
        # Extract JSON from response
        import re
        json_match = re.search(r'\[.*\]', response_text, re.DOTALL)
        if json_match:
            questions_json = json.loads(json_match.group())
            return [RecommendedQuestion(**q) for q in questions_json]
        
        # Fallback if JSON extraction fails
        return [
            RecommendedQuestion(
                question=f"What insights can I gain from the {file}?",
                context=f"General analysis of {file}"
            )
            for file in files[:count]
        ]
    except Exception as e:
        logger.error(f"Error generating recommended questions: {e}")
        return [
            RecommendedQuestion(
                question=f"What does the {file} file contain?",
                context=f"Examining {file}"
            )
            for file in files[:count]
        ]

async def generate_followup_suggestions(question: str, answer: str) -> List[str]:
    """Generate follow-up question suggestions based on the current Q&A"""
    try:
        # Create a prompt for the LLM
        prompt = f"""Based on this question: "{question}" 
        and this answer: "{answer[:500]}..." (truncated),
        suggest 3 relevant follow-up questions the user might want to ask next.
        Format as a JSON array of strings."""
        
        context = "Generate follow-up questions for the user based on the conversation."
        system_prompt = """You are a helpful AI assistant that suggests relevant follow-up questions.
        Always respond with valid JSON as an array of strings: ["question 1", "question 2", "question 3"]"""
        
        # Get response from LLM
        response_text = await ask_llm_with_context(prompt, context, system_prompt)
        
        # Extract JSON from response
        import re
        json_match = re.search(r'\[.*\]', response_text, re.DOTALL)
        if json_match:
            return json.loads(json_match.group())
        
        # Fallback
        return [
            "Can you explain more about this topic?",
            "How does this relate to the rest of my data?",
            "What actions should I take based on this information?"
        ]
    except Exception as e:
        logger.error(f"Error generating follow-up questions: {e}")
        return [
            "Can you elaborate on that?",
            "What else can you tell me about this?",
            "How can I use this information?"
        ]

# Dependency for Qdrant Client
async def get_db_client():
    return get_qdrant_client()

# Ensure thread collection exists
@router.on_event("startup")
async def ensure_thread_collection():
    client = get_qdrant_client()
    try:
        collections = client.get_collections()
        if THREAD_COLLECTION not in [c.name for c in collections.collections]:
            client.create_collection(
                collection_name=THREAD_COLLECTION,
                vectors_config={
                    "size": 1536,  # OpenAI embedding dimension
                    "distance": "Cosine"
                }
            )
    except Exception as e:
        logger.error(f"Failed to create thread collection: {e}")

# Endpoints
@router.get("/data/extracted")
async def get_extracted_data(client = Depends(get_db_client)):
    """Get all extracted data from the database"""
    try:
        # Get all collection names
        collections_response = client.get_collections()
        all_collections = [c.name for c in collections_response.collections]
        
        extracted_data = []
        for collection_name in all_collections:
            try:
                # Get points from the collection
                points = client.scroll(
                    collection_name=collection_name,
                    limit=100,
                    with_payload=True
                )
                
                # Extract relevant data
                for point in points[0]:
                    if point.payload:
                        extracted_data.append({
                            "filename": collection_name,
                            "content": point.payload.get("content", ""),
                            "metadata": point.payload.get("metadata", {})
                        })
            except Exception as e:
                logger.error(f"Error getting data from collection {collection_name}: {e}")
                continue
        
        return JSONResponse(content={"success": True, "data": extracted_data})
    except Exception as e:
        logger.error(f"Error in get_extracted_data: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/data/delete")
async def delete_file(filename: str, client = Depends(get_db_client)):
    """Delete a file from the vector database"""
    try:
        # Get all collection names
        collections_response = client.get_collections()
        collection_names = [c.name for c in collections_response.collections]
        
        # First, try to find a collection that matches the filename
        collection_to_delete = None
        for collection_name in collection_names:
            if collection_name == filename or collection_name.startswith(f"{filename}_"):
                collection_to_delete = collection_name
                break
        
        # If found, delete the entire collection
        if collection_to_delete:
            client.delete_collection(collection_name=collection_to_delete)
            return JSONResponse(
                content={"success": True, "message": f"Collection {collection_to_delete} deleted successfully"},
                status_code=200
            )
        
        # Otherwise, find and delete points with this filename
        deleted_points = 0
        for collection_name in collection_names:
            try:
                if collection_name.startswith("chat4ba_"):
                    continue  # Skip system collections
                    
                # Find points with this filename in metadata
                filter_condition = {
                    "should": [
                        {"key": "metadata.filename", "match": {"value": filename}},
                        {"key": "metadata.source", "match": {"value": filename}}
                    ]
                }
                
                # Get points to delete
                points = client.scroll(
                    collection_name=collection_name,
                    filter=filter_condition,
                    limit=1000,  # Get a large batch
                    with_payload=False,
                    with_vectors=False
                )[0]
                
                if points:
                    # Delete the points
                    point_ids = [p.id for p in points]
                    client.delete(
                        collection_name=collection_name,
                        points_selector={"points": point_ids}
                    )
                    deleted_points += len(point_ids)
            except Exception as e:
                logger.error(f"Error deleting points from {collection_name}: {e}")
        
        if deleted_points > 0:
            return JSONResponse(
                content={"success": True, "message": f"Deleted {deleted_points} points related to {filename}"},
                status_code=200
            )
        
        return JSONResponse(
            content={"success": False, "message": f"File {filename} not found in any collection"},
            status_code=404
        )
    except Exception as e:
        logger.error(f"Error in delete_file: {e}")
        return JSONResponse(
            content={"success": False, "error": str(e)},
            status_code=500
        )

@router.get("/data/preview/{filename}")
async def preview_file(filename: str, client = Depends(get_db_client)):
    """Get a preview of file contents"""
    try:
        # Get all collection names
        collections_response = client.get_collections()
        collection_names = [c.name for c in collections_response.collections]
        
        # Find collections that might contain this file
        found_points = []
        for collection_name in collection_names:
            if collection_name.startswith("chat4ba_"):
                continue  # Skip system collections
                
            # Find points with this filename in metadata
            filter_condition = {
                "should": [
                    {"key": "metadata.filename", "match": {"value": filename}},
                    {"key": "metadata.source", "match": {"value": filename}}
                ]
            }
            
            # Get points
            points = client.scroll(
                collection_name=collection_name,
                filter=filter_condition,
                limit=5,  # Just get a few for preview
                with_payload=True,
                with_vectors=False
            )[0]
            
            found_points.extend(points)
            if len(found_points) >= 5:
                break  # We have enough for a preview
        
        if not found_points:
            return {
                "files": [{
                    "filename": filename,
                    "preview": [],
                    "status": "error",
                    "error": "File not found in database"
                }]
            }
        
        # Extract preview data
        preview_data = []
        for point in found_points:
            text = point.payload.get("content", point.payload.get("page_content", ""))
            metadata = point.payload.get("metadata", {})
            
            preview_data.append({
                "content": text,
                "metadata": metadata
            })
        
        return {
            "files": [{
                "filename": filename,
                "preview": preview_data,
                "status": "success",
                "error": None
            }]
        }
    except Exception as e:
        logger.error(f"Error in preview_file: {e}")
        return JSONResponse(
            content={
                "files": [{
                    "filename": filename,
                    "preview": [],
                    "status": "error",
                    "error": str(e)
                }]
            },
            status_code=500
        )

@router.post("/api/threads")
async def create_thread(thread: Thread, client = Depends(get_db_client)):
    """Create a new thread"""
    try:
        # Generate embedding for thread title for semantic search
        title_embedding = await generate_query_embedding(thread.title)
        
        # Store thread in Qdrant
        client.upsert(
            collection_name=THREAD_COLLECTION,
            points=[{
                "id": thread.id,
                "vector": title_embedding,
                "payload": {
                    "title": thread.title,
                    "messages": [msg.dict() for msg in thread.messages],
                    "created_at": thread.created_at.isoformat(),
                    "updated_at": thread.updated_at.isoformat(),
                    "associated_files": thread.associated_files
                }
            }]
        )
        
        return JSONResponse(
            content={"success": True, "thread_id": thread.id},
            status_code=201
        )
    except Exception as e:
        logger.error(f"Error in create_thread: {e}")
        return JSONResponse(
            content={"success": False, "error": str(e)},
            status_code=500
        )

@router.get("/api/threads")
async def get_threads(client = Depends(get_db_client)):
    """Get all threads"""
    try:
        # Get threads from Qdrant
        threads = client.scroll(
            collection_name=THREAD_COLLECTION,
            limit=100,
            with_payload=True,
            with_vectors=False
        )[0]
        
        return JSONResponse(
            content={"success": True, "threads": [t.payload for t in threads]},
            status_code=200
        )
    except Exception as e:
        logger.error(f"Error in get_threads: {e}")
        return JSONResponse(
            content={"success": False, "error": str(e)},
            status_code=500
        )

@router.get("/api/threads/{thread_id}")
async def get_thread(thread_id: str, client = Depends(get_db_client)):
    """Get a thread by ID"""
    try:
        # Get thread from Qdrant
        thread = client.retrieve(
            collection_name=THREAD_COLLECTION,
            ids=[thread_id]
        )
        
        if not thread:
            return JSONResponse(
                content={"success": False, "error": "Thread not found"},
                status_code=404
            )
        
        return JSONResponse(
            content={"success": True, "thread": thread[0].payload},
            status_code=200
        )
    except Exception as e:
        logger.error(f"Error in get_thread: {e}")
        return JSONResponse(
            content={"success": False, "error": str(e)},
            status_code=500
        )

@router.put("/api/threads/{thread_id}")
async def update_thread(thread_id: str, thread: Thread, client = Depends(get_db_client)):
    """Update a thread"""
    try:
        # Check if thread exists
        existing_thread = client.retrieve(
            collection_name=THREAD_COLLECTION,
            ids=[thread_id]
        )
        
        if not existing_thread:
            return JSONResponse(
                content={"success": False, "error": "Thread not found"},
                status_code=404
            )
        
        # Generate new embedding for thread title
        title_embedding = await generate_query_embedding(thread.title)
        
        # Update thread in Qdrant
        client.upsert(
            collection_name=THREAD_COLLECTION,
            points=[{
                "id": thread_id,
                "vector": title_embedding,
                "payload": {
                    "title": thread.title,
                    "messages": [msg.dict() for msg in thread.messages],
                    "created_at": thread.created_at.isoformat(),
                    "updated_at": thread.updated_at.isoformat(),
                    "associated_files": thread.associated_files
                }
            }]
        )
        
        return JSONResponse(
            content={"success": True, "thread_id": thread_id},
            status_code=200
        )
    except Exception as e:
        logger.error(f"Error in update_thread: {e}")
        return JSONResponse(
            content={"success": False, "error": str(e)},
            status_code=500
        )

@router.get("/api/recommended-questions")
async def get_recommended_questions(count: int = 5, client = Depends(get_db_client)):
    """Get recommended questions based on uploaded files"""
    try:
        # Get all collection names
        collections_response = client.get_collections()
        collection_names = [c.name for c in collections_response.collections if not c.name.startswith("chat4ba_")]
        
        if not collection_names:
            return JSONResponse(
                content={"success": True, "recommendations": []},
                status_code=200
            )
        
        # Get filenames from collections
        filenames = []
        for collection_name in collection_names:
            try:
                # Get a sample point to extract filename
                points = client.scroll(
                    collection_name=collection_name,
                    limit=1,
                    with_payload=True,
                    with_vectors=False
                )[0]
                
                if points:
                    # Extract filename from metadata
                    filename = (
                        points[0].payload.get("metadata", {}).get("source") or 
                        points[0].payload.get("metadata", {}).get("filename") or 
                        collection_name
                    )
                    filenames.append(filename)
            except Exception as e:
                logger.error(f"Error getting data from collection {collection_name}: {e}")
        
        # Generate recommendations
        recommendations = await generate_recommended_questions(filenames, count)
        
        return JSONResponse(
            content={
                "success": True, 
                "recommendations": [{"question": r.question, "context": r.context} for r in recommendations]
            },
            status_code=200
        )
    except Exception as e:
        logger.error(f"Error in get_recommended_questions: {e}")
        return JSONResponse(
            content={"success": False, "error": str(e)},
            status_code=500
        )

@router.post("/api/suggest-followups")
async def suggest_followup_questions(request: Dict[str, str]):
    """Suggest follow-up questions based on the current Q&A"""
    try:
        question = request.get("question", "")
        answer = request.get("answer", "")
        
        if not question or not answer:
            return JSONResponse(
                content={"success": False, "error": "Question and answer are required"},
                status_code=400
            )
        
        suggestions = await generate_followup_suggestions(question, answer)
        
        return JSONResponse(
            content={"success": True, "suggestions": suggestions},
            status_code=200
        )
    except Exception as e:
        logger.error(f"Error in suggest_followup_questions: {e}")
        return JSONResponse(
            content={"success": False, "error": str(e)},
            status_code=500
        ) 