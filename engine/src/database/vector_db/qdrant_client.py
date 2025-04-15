from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams
from src.config.settings import settings

def get_qdrant_client():
    return QdrantClient(
        url=settings.QDRANT_ENDPOINT,
        api_key=settings.QDRANT_API_KEY
    )

def setup_collection(collection_name: str, vector_size: int = 3072):
    client = get_qdrant_client()
    # Check if collection exists before recreating
    try:
        client.get_collection(collection_name=collection_name)
        print(f"Collection '{collection_name}' already exists. Skipping recreation.")
    except Exception: # Qdrant throws exception if collection doesn't exist
        print(f"Creating collection '{collection_name}' with size {vector_size}.")
        client.recreate_collection(
            collection_name=collection_name,
            vectors_config=VectorParams(size=vector_size, distance=Distance.COSINE)
        )
