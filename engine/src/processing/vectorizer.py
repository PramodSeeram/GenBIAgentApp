import uuid
from qdrant_client.models import PointStruct
from src.database.vector_db.qdrant_client import get_qdrant_client
from src.llm.providers.azure_openai import get_embeddings

def store_texts_in_qdrant(texts, metadatas, collection_name):
    embeddings = get_embeddings()
    client = get_qdrant_client()
    points = []
    for text, metadata in zip(texts, metadatas):
        embedding = embeddings.embed_query(text)
        point = PointStruct(
            id=str(uuid.uuid4()),  # Use UUID string
            vector=embedding,
            payload={"content": text, "metadata": metadata}
        )
        points.append(point)
    client.upsert(
        collection_name=collection_name,
        points=points
    )
