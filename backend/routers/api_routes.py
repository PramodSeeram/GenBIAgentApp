# routers/api_routes.py
from fastapi import APIRouter, File, UploadFile, HTTPException
from typing import List, Dict, Any
import os
from models.data_model import QueryRequest, QueryResponse, FileUploadResponse
from services.file_ingestor import process_excel_file
from services.vector_db_manager import store_embeddings
from services.query_processor import process_query

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
        records, text_data = process_excel_file(file_path)
        
        # Store embeddings in vector database
        store_embeddings(text_data, file.filename)
        
        return {
            "message": "File uploaded and processed successfully",
            "filename": file.filename,
            "data_preview": records[:5]  # Return first 5 rows as preview
        }
    except Exception as e:
        raise HTTPException(500, f"Error processing file: {str(e)}")

@router.post("/query", response_model=QueryResponse)
async def process_user_query(query_data: QueryRequest):
    """Process natural language queries using RAG"""
    if not query_data.query:
        raise HTTPException(400, "Query is required")
    
    # Use the RAG system to process the query
    result = process_query(query_data.query)
    
    return result
