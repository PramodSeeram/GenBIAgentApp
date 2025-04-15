from fastapi import APIRouter, HTTPException
from src.llm.providers.azure_openai import get_llm, get_embeddings
from src.database.vector_db.qdrant_client import get_qdrant_client
from src.prompts.system.system_prompt import SYSTEM_PROMPT
from typing import List, Dict
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

def build_context(results: List) -> str:
    return "\n".join(
        f"Source: {res.payload['metadata']['source']}\nContent: {res.payload['content']}"
        for res in results
    )

@router.post("/ask")
async def process_query(query: str, collection_name: str):
    try:
        qdrant = get_qdrant_client()
        embeddings = get_embeddings()
        
        if not query.strip():
            raise HTTPException(400, "Empty query")
        
        results = qdrant.search(
            collection_name=collection_name,
            query_vector=embeddings.embed_query(query),
            limit=5,
            with_payload=True
        )
        
        if not results:
            return {"answer": "No relevant data found", "sources": []}
        
        llm = get_llm()
        context = build_context(results)
        prompt = f"""{SYSTEM_PROMPT}
        
        Context:
        {context}
        
        Question: {query}
        Answer (markdown supported):
        """
        
        response = await llm.ainvoke(prompt)
        
        return {
            "answer": response.content,
            "sources": [res.payload["metadata"] for res in results]
        }
        
    except Exception as e:
        logger.error(f"Query processing error: {str(e)}")
        raise HTTPException(500, f"Query processing error: {str(e)}")

@router.post("/ask/multi-collection")
async def cross_collection_query(query: str, collections: List[str]):
    try:
        qdrant = get_qdrant_client()
        embeddings = get_embeddings()
        
        if not query.strip():
            raise HTTPException(400, "Empty query")
            
        query_vector = embeddings.embed_query(query)
        
        # Search all specified collections
        all_results = []
        for collection in collections:
            results = qdrant.search(
                collection_name=collection,
                query_vector=query_vector,
                limit=5,
                with_payload=True
            )
            all_results.extend(results)
        
        if not all_results:
            return {"answer": "No relevant data found", "sources": []}
        
        # Merge results from different collections
        context = "\n".join([
            f"Source: {res.payload['metadata']['source']}\nContent: {res.payload['content']}"
            for res in all_results
        ])
        
        prompt = f"""{SYSTEM_PROMPT}
        
        Context:
        {context}
        
        Question: {query}
        Answer (markdown supported):
        """
        
        llm = get_llm()
        response = await llm.ainvoke(prompt)
        
        return {
            "answer": response.content,
            "sources": list(set(res.payload['metadata']['source'] for res in all_results))
        }
        
    except Exception as e:
        logger.error(f"Cross-collection query failed: {str(e)}")
        raise HTTPException(500, f"Cross-collection query failed: {str(e)}")

@router.post("/ask/all-collections")
async def query_all_collections(query: str):
    try:
        qdrant = get_qdrant_client()
        embeddings = get_embeddings()
        
        if not query.strip():
            raise HTTPException(400, "Empty query")
            
        query_vector = embeddings.embed_query(query)
        
        # Retrieve all collections
        collections = qdrant.get_collections().collections
        collection_names = [collection.name for collection in collections]
        
        # Search all collections
        all_results = []
        for collection in collection_names:
            results = qdrant.search(
                collection_name=collection,
                query_vector=query_vector,
                limit=5,
                with_payload=True
            )
            all_results.extend(results)
        
        if not all_results:
            return {"answer": "No relevant data found", "sources": []}
        
        # Merge results from different collections
        context = "\n".join([
            f"Source: {res.payload['metadata']['source']}\nContent: {res.payload['content']}"
            for res in all_results
        ])
        
        prompt = f"""{SYSTEM_PROMPT}
        
        Context:
        {context}
        
        Question: {query}
        Answer (markdown supported):
        """
        
        llm = get_llm()
        response = await llm.ainvoke(prompt)
        
        return {
            "answer": response.content,
            "sources": list(set(res.payload['metadata']['source'] for res in all_results))
        }
        
    except Exception as e:
        logger.error(f"Query across all collections failed: {str(e)}")
        raise HTTPException(500, f"Query across all collections failed: {str(e)}")
