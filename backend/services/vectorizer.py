# services/vectorizer.py
from sentence_transformers import SentenceTransformer
import os

# Initialize the embedding model
model = SentenceTransformer('all-MiniLM-L6-v2')

def generate_embeddings(text_data):
    """
    Generate embeddings for the extracted text data
    """
    if isinstance(text_data, list):
        embeddings = model.encode(text_data)
    else:
        embeddings = model.encode([text_data])[0]
    return embeddings
