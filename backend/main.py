# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import api_routes
import os

# Set environment variables for Azure OpenAI
os.environ["AZURE_OPENAI_API_KEY"] = ""
os.environ["AZURE_OPENAI_ENDPOINT"] = ""
os.environ["OPEN_API_VERSION"] = ""
os.environ["OPENAI_DEPLOYMENT_ID"] = ""

app = FastAPI(title="GENBI API", description="API for GENBI application")

# Configure CORS to allow requests from the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React app's address
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(api_routes.router, prefix="/api")

@app.get("/")
async def root():
    return {"message": "Welcome to GENBI API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
