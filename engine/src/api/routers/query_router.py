from fastapi import APIRouter, HTTPException
from src.llm.providers.azure_openai import get_llm, get_embeddings
from src.database.vector_db.qdrant_client import get_qdrant_client
from typing import List

router = APIRouter()

def build_context(results: List) -> str:
    return "\n".join(
        f"Source: {res.payload['metadata']['source_file']}\nContent: {res.payload['content']}"
        for res in results
    )

@router.post("/ask")
async def process_query(query: str, session_id: str):
    try:
        qdrant = get_qdrant_client()
        embeddings = get_embeddings()
        
        if not query.strip():
            raise HTTPException(400, "Empty query")
        
        results = qdrant.search(
            collection_name=session_id,
            query_vector=embeddings.embed_query(query),
            limit=5,
            with_payload=True
        )
        
        if not results:
            return {"answer": "No relevant data found", "sources": []}
        
        llm = get_llm()
        response = await llm.ainvoke(
            f"Context:\n{build_context(results)}\n\nQuestion: {query}\nAnswer:"
        )
        
        return {
            "answer": response.content,
            "sources": [res.payload["metadata"] for res in results]
        }
        
    except Exception as e:
        raise HTTPException(500, f"Query processing error: {str(e)}")
