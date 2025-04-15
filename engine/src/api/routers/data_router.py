from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from src.processing.file_processor import FileProcessor
from src.utils.security import validate_file
import tempfile
import os

router = APIRouter()

@router.post("/preview")
async def preview_files(files: list[UploadFile] = File(...)):
    """Full content preview endpoint using [4] patterns"""
    results = []
    
    for file in files:
        try:
            # Validate first
            validate_file(file)
            
            # Save with original extension
            ext = os.path.splitext(file.filename)[1]
            with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as temp:
                content = await file.read()
                temp.write(content)
                temp_path = temp.name
            
            # Process file
            chunks = FileProcessor.process_file(temp_path)
            
            results.append({
                "filename": file.filename,
                "preview": [{
                    "content": chunk.page_content,
                    "metadata": dict(chunk.metadata)
                } for chunk in chunks],
                "status": "success"
            })
            
        except Exception as e:
            results.append({
                "filename": file.filename,
                "status": "error", 
                "error": str(e)
            })
        finally:
            if os.path.exists(temp_path):
                os.unlink(temp_path)
    
    return JSONResponse(content={"files": results})

@router.post("/process")
async def process_files(files: list[UploadFile] = File(...)):
    """
    Process the uploaded files, convert to embeddings, and store in Qdrant.
    Returns the collection names and processing information.
    """
    results = []
    for file in files:
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
            processing_result = processor.process_and_store(temp_path, file.filename)
            
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
            if 'temp_path' in locals() and os.path.exists(temp_path):
                os.unlink(temp_path)
    
    return JSONResponse(content={"files": results})
