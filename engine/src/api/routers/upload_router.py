import os
import shutil
import uuid # For unique temp filenames
from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks, Depends
from typing import List
import logging
from src.processing.file_processor import FileProcessor
# Import the dependency getter for AzureOpenAIProvider
from src.llm.providers.azure_openai import AzureOpenAIProvider, get_azure_provider

UPLOAD_DIR = "./uploaded_files_temp" # Temporary storage directory
os.makedirs(UPLOAD_DIR, exist_ok=True)

router = APIRouter()
logger = logging.getLogger(__name__)
file_processor = FileProcessor() # Instantiate the processor

# --- Background Task ---
async def process_file_background(file_path: str, file_name: str, provider: AzureOpenAIProvider):
    """Processes a single file in the background."""
    logger.info(f"Background task started for {file_name} at path {file_path}")
    try:
        result = await file_processor.process_and_store(file_path, file_name, provider)
        logger.info(f"Background task finished for {file_name}. Result: {result}")
    except Exception as e:
        logger.error(f"Background processing failed for {file_name}: {str(e)}", exc_info=True)
    finally:
        # Clean up the temporary file regardless of success or failure
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
                logger.info(f"Temporary file deleted: {file_path}")
            except OSError as e:
                logger.error(f"Error deleting temporary file {file_path}: {e}")

# --- API Endpoints ---

@router.post("/upload/")
async def upload_and_process_files(
    background_tasks: BackgroundTasks,
    files: List[UploadFile] = File(...), # Accept a list of files
    azure_provider: AzureOpenAIProvider = Depends(get_azure_provider) # Inject provider
):
    """
    Accepts multiple file uploads (.csv, .xlsx, .xls) and processes them
    in the background (embedding generation and storage).
    """
    allowed_extensions = {".csv", ".xlsx", ".xls"}
    processed_files = []
    errors = []

    if not files:
        raise HTTPException(status_code=400, detail="No files were uploaded.")

    for file in files:
        file_ext = os.path.splitext(file.filename)[1].lower()
        if file_ext not in allowed_extensions:
            errors.append(f"Unsupported file type for '{file.filename}': {file_ext}. Allowed: {allowed_extensions}")
            logger.warning(f"Skipping unsupported file: {file.filename}")
            continue # Skip this file

        # Create a unique temporary filename to avoid conflicts
        temp_filename = f"{uuid.uuid4()}{file_ext}"
        file_path = os.path.join(UPLOAD_DIR, temp_filename)
        logger.info(f"Receiving file: {file.filename} -> saving as {temp_filename}")

        try:
            # Save file temporarily
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            logger.info(f"File '{file.filename}' saved temporarily to: {file_path}")

            # Add processing to background tasks, passing necessary info
            background_tasks.add_task(
                process_file_background,
                file_path,          # Pass the path to the temp file
                file.filename,      # Pass the original filename for collection naming etc.
                azure_provider      # Pass the provider instance
            )
            processed_files.append(file.filename)

        except Exception as e:
            logger.error(f"Error handling file {file.filename}: {str(e)}", exc_info=True)
            errors.append(f"Failed to initiate processing for '{file.filename}': {str(e)}")
            # Clean up if saving failed partway
            if os.path.exists(file_path):
                 try:
                     os.remove(file_path)
                 except OSError:
                     pass # Ignore cleanup error if main error occurred

    if not processed_files and errors:
         # If all files failed validation or initial saving
         raise HTTPException(status_code=400, detail={"errors": errors})

    return {
        "message": f"Received {len(files)} file(s). Started background processing for {len(processed_files)} valid file(s). Check logs for progress.",
        "processed_files": processed_files,
        "errors": errors if errors else None
    }


