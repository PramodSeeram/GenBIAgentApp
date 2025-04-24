# src/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging
import os
# Import router modules directly
from src.api.routers import upload_router, query_router
from src.database.vector_db.qdrant_client import initialize_qdrant_client # For startup check

# Configure basic logging
log_level = os.getenv("LOG_LEVEL", "INFO").upper()
logging.basicConfig(
    level=log_level,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# --- FastAPI App Initialization ---
app = FastAPI(
    title="Chat4BA Engine API",
    description="API for uploading documents and querying them using Azure OpenAI and Qdrant.",
    version="1.0.0"
)

# --- CORS Middleware ---
# Adjust origins based on your frontend URL in production
origins = [
    "http://localhost",
    "http://localhost:3000", # Example for React dev server
    "http://localhost:8080", # Example for Vue dev server
    # Add your production frontend URL here
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins, # More specific than "*"
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"], # Be specific
    allow_headers=["*"], # Or list specific headers like Content-Type, Authorization
)

# --- Event Handlers ---
@app.on_event("startup")
async def startup_event():
    """Initialize resources on startup."""
    logger.info("Application startup sequence initiated...")
    try:
        # Initialize Qdrant client and check connection
        initialize_qdrant_client()
        logger.info("Qdrant client connection checked successfully on startup.")
        # Note: AzureOpenAIProvider is initialized lazily via dependency injection
    except Exception as e:
         logger.critical(f"CRITICAL: Failed to initialize resources on startup: {e}", exc_info=True)
         # Depending on policy, you might exit or just log the error
         # raise RuntimeError("Failed to initialize critical resources.") from e

@app.on_event("shutdown")
async def shutdown_event():
    """Clean up resources on shutdown (if necessary)."""
    logger.info("Application shutdown sequence initiated...")
    # Add cleanup logic here if needed (e.g., closing database connections)
    logger.info("Application shutdown complete.")


# --- Root Endpoint ---
@app.get("/", tags=["Root"])
async def read_root():
    """Root endpoint providing basic API information."""
    return {
        "message": "Welcome to the Chat4BA Engine API",
        "docs_url": "/docs",
        "redoc_url": "/redoc"
        }

# --- Include API Routers ---
# Group endpoints logically using tags
app.include_router(upload_router.router, prefix="/api/data", tags=["Data Management"])
app.include_router(query_router.router, prefix="/api/query", tags=["Query & Analysis"])

logger.info("FastAPI application configuration complete. Ready to serve requests.")

# --- Main Execution (for direct run, e.g., python src/main.py) ---
# Usually, you run with `uvicorn src.main:app --reload`
if __name__ == "__main__":
    import uvicorn
    logger.info("Running Uvicorn server directly (for debugging)...")
    uvicorn.run("main:app", host="0.0.0.0", port=8003, reload=True)
