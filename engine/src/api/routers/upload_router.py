# src/api/routers/upload_router.py
import os
import shutil
import uuid
from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks, Depends
from typing import List
import logging
from src.processing.file_processor import FileProcessor
from src.llm.providers.azure_openai import AzureOpenAIProvider, get_azure_provider

UPLOAD_DIR = "./uploaded_files_temp"
os.makedirs(UPLOAD_DIR, exist_ok=True)

router = APIRouter()
logger = logging.getLogger(__name__)
file_processor = FileProcessor()

async def process_file_background(file_path: str, original_file_name: str, provider: AzureOpenAIProvider):
    """Task to process a single file in the background."""
    logger.info(f"[Background] Starting processing for '{original_file_name}' from path {file_path}")
    try:
        result = await file_processor.process_and_store(file_path, original_file_name, provider)
        logger.info(f"[Background] Finished processing for '{original_file_name}'. Result: {result}")
    except Exception as e:
        logger.error(f"[Background] Processing failed for '{original_file_name}': {str(e)}", exc_info=True)
    finally:
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
                logger.info(f"[Background] Temporary file deleted: {file_path}")
            except OSError as e_del:
                logger.error(f"[Background] Error deleting temporary file {file_path}: {e_del}")

@router.post("/upload/")
async def upload_and_process_files(
    background_tasks: BackgroundTasks,
    files: List[UploadFile] = File(...),
    azure_provider: AzureOpenAIProvider = Depends(get_azure_provider)
):
    """
    Handles multiple file uploads, validates them, and queues background
    processing for each valid file.
    """
    allowed_extensions = {".csv", ".xlsx", ".xls"}
    files_queued_for_processing = []
    file_errors = []

    if not files:
        raise HTTPException(status_code=400, detail="No files were provided in the request.")

    logger.info(f"Received {len(files)} file(s) for upload.")

    for file in files:
        original_filename = file.filename
        file_ext = os.path.splitext(original_filename)[1].lower()

        if file_ext not in allowed_extensions:
            msg = f"Unsupported file type for '{original_filename}': '{file_ext}'. Allowed: {', '.join(allowed_extensions)}"
            file_errors.append({"filename": original_filename, "error": msg})
            logger.warning(msg)
            continue

        temp_filename = f"{uuid.uuid4().hex}{file_ext}"
        file_path = os.path.join(UPLOAD_DIR, temp_filename)
        logger.debug(f"Preparing to save '{original_filename}' as temporary file '{temp_filename}'")

        try:
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            logger.info(f"File '{original_filename}' saved temporarily to: {file_path}")

            background_tasks.add_task(
                process_file_background,
                file_path,
                original_filename,
                azure_provider
            )
            files_queued_for_processing.append(original_filename)
            logger.info(f"Queued background processing for '{original_filename}'.")

        except Exception as e:
            logger.error(f"Error handling file '{original_filename}' during upload/queueing: {str(e)}", exc_info=True)
            file_errors.append({"filename": original_filename, "error": f"Failed to save or queue: {str(e)}"})
            if os.path.exists(file_path):
                 try: os.remove(file_path)
                 except OSError: pass

        finally:
             await file.close()

    if not files_queued_for_processing and file_errors:
         raise HTTPException(status_code=400, detail={"message": "No valid files could be queued for processing.", "errors": file_errors})

    return {
        "message": f"Received {len(files)} file(s). Queued {len(files_queued_for_processing)} for processing.",
        "files_queued": files_queued_for_processing,
        "errors": file_errors if file_errors else None
    }
