from qdrant_client import QdrantClient, models
from qdrant_client.http.models import Distance, VectorParams, PointStruct
import os
import uuid
import logging
from dotenv import load_dotenv
from src.config.settings import settings  # Import settings

# Load environment variables
dotenv_path = os.path.join(os.path.dirname(__file__), '..', '..', '..', '.env')
load_dotenv(dotenv_path=dotenv_path)

logger = logging.getLogger(__name__)

# Global Qdrant client instance (consider FastAPI dependency injection for production)
_qdrant_client = None

def initialize_qdrant_client():
    global _qdrant_client
    if _qdrant_client is None:
        qdrant_url = settings.QDRANT_ENDPOINT
        qdrant_api_key = settings.QDRANT_API_KEY
        if not qdrant_url:
            raise ValueError("QDRANT_ENDPOINT environment variable not set.")
        logger.info(f"Initializing Qdrant client with URL: {qdrant_url}")
        try:
            _qdrant_client = QdrantClient(
                url=qdrant_url,
                api_key=qdrant_api_key if qdrant_api_key else None,
                timeout=60 # Increase timeout
            )
            # Test connection
            _qdrant_client.get_collections()
            logger.info("Qdrant client initialized successfully.")
        except Exception as e:
            logger.error(f"Failed to initialize Qdrant client: {e}")
            _qdrant_client = None # Reset on failure
            raise
    return _qdrant_client

def get_qdrant_client():
    """Gets the initialized Qdrant client."""
    if _qdrant_client is None:
        return initialize_qdrant_client()
    return _qdrant_client

def setup_collection(collection_name: str, vector_size: int = 3072, distance_metric: Distance = Distance.COSINE):
    """Creates or recreates a Qdrant collection with the specified configuration."""
    client = get_qdrant_client()
    try:
        collections = client.get_collections().collections
        collection_names = [c.name for c in collections]

        if collection_name in collection_names:
            logger.warning(f"Collection '{collection_name}' already exists. Recreating with specified config.")
            # Recreate ensures the config is correct
            client.recreate_collection(
                collection_name=collection_name,
                vectors_config=VectorParams(size=vector_size, distance=distance_metric)
            )
        else:
             logger.info(f"Creating new collection '{collection_name}'.")
             client.create_collection(
                collection_name=collection_name,
                vectors_config=VectorParams(size=vector_size, distance=distance_metric)
            )
        logger.info(f"Collection '{collection_name}' setup complete with vector size {vector_size}.")

    except Exception as e:
        logger.error(f"Failed to setup collection '{collection_name}': {e}")
        raise

async def upsert_vectors(collection_name: str, texts: list[str], metadatas: list[dict], embeddings: list[list[float]]):
    """Upserts vectors into Qdrant."""
    client = get_qdrant_client()
    points_to_upsert = []
    skipped_count = 0

    if len(texts) != len(metadatas) or len(texts) != len(embeddings):
        raise ValueError("Texts, metadatas, and embeddings lists must have the same length.")

    for i, (text, meta, vector) in enumerate(zip(texts, metadatas, embeddings)):
        if not isinstance(text, str) or not text.strip():
            logger.warning(f"Skipping point {i} in {collection_name}: Empty or non-string content.")
            skipped_count += 1
            continue
        if not vector or len(vector) != 3072: # Assuming 3072 from AZURE_EMBEDDING_DEPLOYMENT
             logger.warning(f"Skipping point {i} in {collection_name}: Invalid vector (size {len(vector) if vector else 0}). Text: {text[:50]}...")
             skipped_count += 1
             continue

        # Ensure metadata is serializable and add source if missing
        clean_meta = {k: str(v) for k, v in meta.items()} # Basic cleaning
        if 'source' not in clean_meta:
             clean_meta['source'] = collection_name # Use collection name as default source

        points_to_upsert.append(PointStruct(
            id=str(uuid.uuid4()),
            vector=vector,
            payload={"content": text, "metadata": clean_meta}
        ))

    if not points_to_upsert:
        logger.warning(f"No valid points to upsert for collection {collection_name}.")
        return 0 # Return 0 points stored

    logger.info(f"Upserting {len(points_to_upsert)} points to collection '{collection_name}'. Skipped {skipped_count}.")

    try:
        # Use batch upsert for efficiency
        client.upsert(
            collection_name=collection_name,
            points=points_to_upsert,
            wait=True # Wait for operation to complete
        )
        logger.info(f"Successfully upserted {len(points_to_upsert)} points to '{collection_name}'.")
        return len(points_to_upsert)
    except Exception as e:
        logger.error(f"Failed to upsert points to '{collection_name}': {e}")
        raise
