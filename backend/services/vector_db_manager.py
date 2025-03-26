# services/vector_db_manager.py
import faiss
import numpy as np
import os
import pickle
from services.vectorizer import generate_embeddings

# Directory to store FAISS indexes and metadata
INDEX_DIR = "vector_db"
os.makedirs(INDEX_DIR, exist_ok=True)

def store_embeddings(text_data, file_name):
    """
    Generate embeddings and store them in FAISS index
    """
    # Generate embeddings
    embeddings = generate_embeddings(text_data)
    
    # Convert to numpy array if it's not already
    embeddings_np = np.array(embeddings).astype('float32')
    
    # Get dimension of embeddings
    dim = embeddings_np.shape[1]
    
    # Create a FAISS index
    index = faiss.IndexFlatIP(dim)  # Inner product similarity (cosine similarity)
    
    # Add embeddings to the index
    index.add(embeddings_np)
    
    # Save the index
    index_path = os.path.join(INDEX_DIR, f"{file_name}.index")
    faiss.write_index(index, index_path)
    
    # Save metadata (text data) separately
    metadata_path = os.path.join(INDEX_DIR, f"{file_name}.pkl")
    with open(metadata_path, 'wb') as f:
        pickle.dump({
            'text_data': text_data,
            'file_name': file_name
        }, f)
    
    return True

def query_vector_db(query_text, top_k=5):
    """
    Query the vector database to find relevant context
    """
    # Generate embedding for the query
    query_embedding = generate_embeddings(query_text)
    
    # Convert to numpy array
    query_embedding_np = np.array([query_embedding]).astype('float32')
    
    # Get all index files
    index_files = [f for f in os.listdir(INDEX_DIR) if f.endswith('.index')]
    
    if not index_files:
        return []
    
    # Collect results from all indexes
    all_results = []
    
    for index_file in index_files:
        # Load the index
        index_path = os.path.join(INDEX_DIR, index_file)
        index = faiss.read_index(index_path)
        
        # Load the corresponding metadata
        metadata_path = os.path.join(INDEX_DIR, index_file.replace('.index', '.pkl'))
        with open(metadata_path, 'rb') as f:
            metadata = pickle.load(f)
        
        # Search the index
        scores, indices = index.search(query_embedding_np, top_k)
        
        # Collect results
        for i, (score, idx) in enumerate(zip(scores[0], indices[0])):
            if idx >= 0:  # Valid index
                all_results.append({
                    'text': metadata['text_data'][idx],
                    'file_name': metadata['file_name'],
                    'score': float(score)
                })
    
    # Sort by score and take top_k
    all_results.sort(key=lambda x: x['score'], reverse=True)
    return all_results[:top_k]
