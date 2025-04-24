from fastapi import APIRouter, HTTPException, Body, Depends
from src.llm.providers.azure_openai import generate_query_embedding, ask_llm_with_context
from src.database.vector_db.qdrant_client import get_qdrant_client
from src.prompts.system.system_prompt import SYSTEM_PROMPT
from typing import List, Dict, Optional
from pydantic import BaseModel
import logging

# Define request models
class QueryRequest(BaseModel):
    query: str

class MultiCollectionRequest(BaseModel):
    query: str
    collections: List[str]

router = APIRouter()
logger = logging.getLogger(__name__)

def build_context(results: List) -> str:
    """Builds a context string from Qdrant search results."""
    context_parts = []
    for res in results:
        source = res.payload.get('metadata', {}).get('source', 'Unknown Source')
        content = res.payload.get('content', 'No Content')
        context_parts.append(f"Source: {source}\nContent: {content}")
    return "\n\n---\n\n".join(context_parts) # Separator for clarity

# Dependency for Qdrant Client
async def get_db_client():
    return get_qdrant_client()

@router.post("/ask")
async def process_query(collection_name: str, data: QueryRequest, client = Depends(get_db_client)):
    """Processes a query against a single specified collection."""
    query = data.query
    logger.info(f"Received query for collection '{collection_name}': {query}")
    if not query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty.")

    try:
        query_vector = await generate_query_embedding(query)

        logger.info(f"Searching collection '{collection_name}'...")
        search_results = client.search(
            collection_name=collection_name,
            query_vector=query_vector,
            limit=5, # Number of results to fetch for context
            with_payload=True
        )
        logger.info(f"Found {len(search_results)} results from '{collection_name}'.")

        if not search_results:
            # Option 1: Return "No data found"
            # return {"answer": "No relevant data found in the specified collection.", "sources": []}
            # Option 2: Ask LLM without specific context (might hallucinate)
            logger.warning(f"No relevant documents found in {collection_name} for query. Asking LLM without context.")
            context = "No specific documents found." # Provide minimal context
            # Or comment out below and use return above if you prefer not to ask LLM
            llm_answer = await ask_llm_with_context(query, context, SYSTEM_PROMPT)
            return {"answer": llm_answer, "sources": []}


        context = build_context(search_results)
        logger.debug(f"Built context for LLM: {context[:500]}...") # Log truncated context

        llm_answer = await ask_llm_with_context(query, context, SYSTEM_PROMPT)
        sources = list(set(res.payload.get('metadata', {}).get('source', 'Unknown') for res in search_results)) # Extract unique sources

        return {"answer": llm_answer, "sources": sources}

    except Exception as e:
        logger.error(f"Error processing query for collection '{collection_name}': {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.post("/ask/multi-collection")
async def cross_collection_query(data: MultiCollectionRequest, client = Depends(get_db_client)):
    """Processes a query across multiple specified collections."""
    query = data.query
    collections_to_search = data.collections
    logger.info(f"Received multi-collection query for {collections_to_search}: {query}")
    if not query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty.")
    if not collections_to_search:
         raise HTTPException(status_code=400, detail="Collections list cannot be empty.")

    try:
        query_vector = await generate_query_embedding(query)
        all_results = []
        unique_sources = set()

        for collection_name in collections_to_search:
            try:
                logger.info(f"Searching collection '{collection_name}'...")
                results = client.search(
                    collection_name=collection_name,
                    query_vector=query_vector,
                    limit=3, # Limit per collection
                    with_payload=True
                )
                all_results.extend(results)
                logger.info(f"Found {len(results)} results from '{collection_name}'.")
                for res in results:
                     unique_sources.add(res.payload.get('metadata', {}).get('source', 'Unknown'))
            except Exception as e:
                logger.warning(f"Could not search collection '{collection_name}': {e}")
                continue # Skip this collection if search fails

        if not all_results:
            logger.warning(f"No relevant documents found across specified collections. Asking LLM without context.")
            context = "No specific documents found in the requested collections."
            llm_answer = await ask_llm_with_context(query, context, SYSTEM_PROMPT)
            return {"answer": llm_answer, "sources": list(collections_to_search)} # Indicate searched collections

        # Optional: Add reranking/sorting logic here if needed across collections
        # For now, just combine context
        context = build_context(all_results)
        logger.debug(f"Built context for LLM from multi-collection: {context[:500]}...")

        llm_answer = await ask_llm_with_context(query, context, SYSTEM_PROMPT)

        return {"answer": llm_answer, "sources": list(unique_sources)}

    except Exception as e:
        logger.error(f"Error processing multi-collection query: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.post("/ask/all-collections")
async def query_all_collections(data: QueryRequest, client = Depends(get_db_client)):
    """Processes a query across all available collections."""
    query = data.query
    logger.info(f"Received query for ALL collections: {query}")
    if not query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty.")

    try:
        # Get all collection names
        try:
             collections_response = client.get_collections()
             all_collection_names = [c.name for c in collections_response.collections]
             logger.info(f"Found collections: {all_collection_names}")
        except Exception as e:
             logger.error(f"Failed to retrieve collection list from Qdrant: {e}")
             raise HTTPException(status_code=500, detail="Could not retrieve collection list.")

        if not all_collection_names:
             raise HTTPException(status_code=404, detail="No collections found in Qdrant.")

        # Use the multi-collection logic
        multi_request_data = MultiCollectionRequest(query=query, collections=all_collection_names)
        return await cross_collection_query(multi_request_data, client)

    except HTTPException as he:
         raise he # Re-raise HTTP exceptions
    except Exception as e:
        logger.error(f"Error processing query across all collections: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


