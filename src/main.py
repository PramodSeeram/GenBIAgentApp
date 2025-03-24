from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
from typing import Optional

app = FastAPI()

@app.post("/upload/")
async def upload_file(file: UploadFile = File(...)):
    try:
        
        file_path = f"./data/uploads/{file.filename}"
        chunk_size = 1024 * 1024  # 1MB chunks
        with open(file_path, "wb") as f:
            while chunk := await file.read(chunk_size):
                f.write(chunk)
        
        
        return JSONResponse(content={"message": f"File {file.filename} uploaded successfully."}, status_code=200)
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)
