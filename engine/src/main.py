from fastapi import FastAPI
from src.api.routers.data_router import router as data_router
from src.api.routers.query_router import router as query_router

app = FastAPI(title="Chat4BA API")

app.include_router(data_router, prefix="/api/data")
app.include_router(query_router, prefix="/api/query")

@app.get("/")
async def root():
    return {
        "app": "Chat4BA",
        "status": "online",
        "endpoints": {
            "docs": "/docs",
            "upload": "/api/data/upload",
            "query": "/api/query/ask"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
