import os
from fastapi import UploadFile, HTTPException

UPLOAD_FOLDER = os.getenv("UPLOAD_FOLDER", "./data/uploads")

def save_uploaded_file(file: UploadFile):
    try:
        file_path = os.path.join(UPLOAD_FOLDER, file.filename)
        with open(file_path, "wb") as f:
            f.write(file.file.read())
        return file_path
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error saving file: {str(e)}")
