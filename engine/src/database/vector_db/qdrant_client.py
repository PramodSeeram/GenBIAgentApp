from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams
from src.config.settings import settings

def get_qdrant_client():
    return QdrantClient(
        url=settings.QDRANT_ENDPOINT,
        api_key=settings.QDRANT_API_KEY
    )

def setup_collection(collection_name: str, vector_size: int = 1536):
    client = get_qdrant_client()
    client.recreate_collection(
        collection_name=collection_name,
        vectors_config=VectorParams(size=vector_size, distance=Distance.COSINE)
    )
