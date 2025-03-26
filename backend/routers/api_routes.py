# routers/api_routes.py
from fastapi import APIRouter, File, UploadFile, HTTPException, Depends
from typing import List, Dict, Any
import os
from models.data_model import QueryRequest, QueryResponse, FileUploadResponse
from services.file_ingestor import process_excel_file
from services.vectorizer import generate_embeddings
from services.vector_db_manager import store_embeddings, query_vector_db

router = APIRouter()

# Create upload directory if it doesn't exist
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload", response_model=FileUploadResponse)
async def upload_file(file: UploadFile = File(...)):
    """Handle Excel file uploads and extract data"""
    # Check if file is an Excel or CSV file
    if not file.filename.endswith(('.xlsx', '.xls', '.csv')):
        raise HTTPException(400, "Only Excel or CSV files are supported")
    
    # Save the uploaded file
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as f:
        f.write(await file.read())
    
    try:
        # Process the file and extract data
        extracted_data = process_excel_file(file_path)
        
        # Generate embeddings for the extracted data
        # In a production environment, this might be done asynchronously
        embeddings = generate_embeddings(extracted_data)
        
        # Store embeddings in vector database
        store_embeddings(embeddings, extracted_data, file.filename)
        
        return {
            "message": "File uploaded and processed successfully",
            "filename": file.filename,
            "data_preview": extracted_data[:5]  # Return first 5 rows as preview
        }
    except Exception as e:
        raise HTTPException(500, f"Error processing file: {str(e)}")

@router.post("/query", response_model=QueryResponse)
async def process_query(query_data: QueryRequest):
    """Process natural language queries"""
    if not query_data.query:
        raise HTTPException(400, "Query is required")
    
    # Retrieve relevant context from vector database
    context = query_vector_db(query_data.query)
    
    # In a real implementation, you would use Azure OpenAI to generate a response
    # based on the retrieved context
    # For now, return a mock response
    return {
        "query": query_data.query,
        "response": f"You asked: {query_data.query}. This is a mock response as the backend is still being developed.",
        "context": [item["content"] for item in context]
    }
