import uuid
from qdrant_client.models import PointStruct, VectorParams, Distance
from src.database.vector_db.qdrant_client import get_qdrant_client
from src.llm.providers.azure_openai import get_embeddings
import numpy as np

def store_texts_in_qdrant(texts, metadatas, collection_name):
    """
    Converts texts into embeddings and stores them in Qdrant.
    
    Args:
        texts (list): List of text chunks to embed
        metadatas (list): List of metadata dictionaries for each text chunk
        collection_name (str): Name of the Qdrant collection to store in
    """
    # Get embeddings model
    embeddings = get_embeddings()
    
    # Get Qdrant client
    client = get_qdrant_client()
    
    # Ensure collection exists
    collections = client.get_collections().collections
    collection_names = [collection.name for collection in collections]
    
    if collection_name not in collection_names:
        client.create_collection(
            collection_name=collection_name,
            vectors_config=VectorParams(size=3072, distance=Distance.COSINE)
        )
    
    # Create points with embeddings
    points = []
    skipped_count = 0
    for i, (text, metadata) in enumerate(zip(texts, metadatas)):
        # Ensure text is a string and not empty/whitespace
        if not isinstance(text, str):
            print(f"[Vectorizer] Skipping point {i}: Content is not a string ({type(text)}). First 100 chars: {str(text)[:100]}")
            skipped_count += 1
            continue
        if not text or text.isspace():
            print(f"[Vectorizer] Skipping point {i}: Content is empty or whitespace.")
            skipped_count += 1
            continue
        if len(text) > 4000:  # Truncate if too long (sync with processor)
            print(f"[Vectorizer] Warning: Truncating text for point {i} (was {len(text)} chars). First 100: {text[:100]}")
            text = text[:4000]
            
        # Generate embedding
        try:
            embedding = embeddings.embed_query(text)
            
            # Validate embedding dimension
            if len(embedding) != 3072:
                print(f"[Vectorizer] Skipping point {i}: Unexpected embedding dimension {len(embedding)} (expected 3072). Text: {text[:100]}...")
                skipped_count += 1
                continue
                
            point = PointStruct(
                id=str(uuid.uuid4()),
                vector=embedding,
                payload={
                    "content": text,
                    "metadata": metadata
                }
            )
            points.append(point)
        except Exception as e:
            print(f"[Vectorizer] Skipping point {i}: Error generating embedding. Text: {text[:100]}... Error: {str(e)}")
            skipped_count += 1
            continue
    
    print(f"[Vectorizer] Generated {len(points)} valid points, skipped {skipped_count} points.")
    
    if not points:
        # Raise the error only if no points were generated *at all*
        raise ValueError("No valid points generated for storage")
        
    # Batch upsert to Qdrant
    try:
        client.upsert(
            collection_name=collection_name,
            points=points
        )
        print(f"Successfully stored {len(points)} embeddings in collection {collection_name}")
        return len(points)
    except Exception as e:
        print(f"Error storing embeddings: {str(e)}")
        raise
