from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from fastapi.responses import JSONResponse
from src.processing.file_processor import FileProcessor
from src.llm.providers.azure_openai import get_azure_provider, AzureOpenAIProvider  # Add this import
from src.utils.security import validate_file
import tempfile
import os
import logging
from typing import List

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/process")
async def process_files(
    files: List[UploadFile] = File(...),
    azure_provider: AzureOpenAIProvider = Depends(get_azure_provider)  # Add dependency injection
):
    """
    Process the uploaded files, convert to embeddings, and store in Qdrant.
    Returns the collection names and processing information.
    """
    results = []
    for file in files:
        temp_path = None  # Initialize temp_path outside try block
        try:
            # Validate first
            validate_file(file)
            
            # Save with original extension
            ext = os.path.splitext(file.filename)[1]
            with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as temp:
                content = await file.read()
                temp.write(content)
                temp_path = temp.name

            # Process and store in vector database
            processor = FileProcessor()
            # Add await and azure_provider parameter
            processing_result = await processor.process_and_store(temp_path, file.filename, azure_provider)
            
            results.append({
                "filename": file.filename,
                "collection_name": processing_result["collection_name"],
                "chunks_processed": processing_result["chunks_processed"],
                "status": "success"
            })
        except Exception as e:
            results.append({
                "filename": file.filename,
                "status": "error", 
                "error": str(e)
            })
        finally:
            if temp_path and os.path.exists(temp_path):
                os.unlink(temp_path)
    
    return JSONResponse(content={"files": results})
