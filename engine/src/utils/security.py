import os
from fastapi import UploadFile

ALLOWED_EXTENSIONS = {".csv", ".xlsx", ".xls", ".xlsm", ".xlsb", ".xltx", ".xltm", ".xlt"}
MIME_TYPE_MAP = {
    ".csv": ["text/csv", "text/plain", "application/vnd.ms-excel", "application/csv", "text/x-csv"],
    ".xlsx": ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
    ".xls": ["application/vnd.ms-excel"],
    ".xlsm": ["application/vnd.ms-excel.sheet.macroEnabled.12"],
    ".xlsb": ["application/vnd.ms-excel.sheet.binary.macroEnabled.12"],
    ".xltx": ["application/vnd.openxmlformats-officedocument.spreadsheetml.template"],
    ".xltm": ["application/vnd.ms-excel.template.macroEnabled.12"],
    ".xlt": ["application/vnd.ms-excel"]
}

def validate_file(file: UploadFile):
    """Improved validation using research from [2] and [5]"""
    if not file.filename:
        raise ValueError("Filename is required")
    
    ext = os.path.splitext(file.filename)[1].lower()
    
    # Extension check
    if ext not in ALLOWED_EXTENSIONS:
        raise ValueError(f"Unsupported file type: {ext}. Allowed: {', '.join(ALLOWED_EXTENSIONS)}")
    
    # MIME type validation
    if file.content_type not in MIME_TYPE_MAP.get(ext, []):
        raise ValueError(f"MIME type {file.content_type} doesn't match {ext} extension")
