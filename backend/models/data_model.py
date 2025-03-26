# models/data_model.py
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class QueryRequest(BaseModel):
    query: str

class QueryResponse(BaseModel):
    query: str
    response: str
    context: Optional[List[str]] = None

class FileUploadResponse(BaseModel):
    message: str
    filename: str
    data_preview: List[Dict[str, Any]]
