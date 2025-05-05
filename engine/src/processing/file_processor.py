# src/processing/file_processor.py
import os
import logging
import uuid
from langchain_community.document_loaders import UnstructuredCSVLoader, UnstructuredExcelLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
# Import the provider TYPE for type hinting
from src.llm.providers.azure_openai import AzureOpenAIProvider
# Import the database functions
from src.database.vector_db.qdrant_client import setup_collection, upsert_vectors

logger = logging.getLogger(__name__)

EXPECTED_VECTOR_SIZE = 3072  # Define this constant for embedding vector size

class FileProcessor:
    @staticmethod
    def _load_and_chunk_file(file_path: str) -> list:
        """Loads and chunks documents from a file path. Returns list of LangChain Document objects."""
        ext = os.path.splitext(file_path)[1].lower()
        logger.info(f"Loading and chunking file: {file_path} with extension {ext}")

        docs = [] # Initialize docs list
        try:
            if ext == ".csv":
                loader = UnstructuredCSVLoader(file_path, mode="elements", encoding='utf-8-sig')
                docs = loader.load()
            elif ext in (".xlsx", ".xls"):
                loader = UnstructuredExcelLoader(file_path, mode="elements")
                docs = loader.load()
            else:
                raise ValueError(f"Unsupported file type: {ext}")

            if not docs:
                 logger.warning(f"No documents loaded from {file_path}. The file might be empty or unparseable.")
                 return [] # Return empty list if loading yields nothing
            logger.info(f"Loaded {len(docs)} initial elements from {file_path}.")

        except Exception as e:
            logger.error(f"Error loading file {file_path}: {e}", exc_info=True)
            # Raise a specific error or return empty list depending on desired handling
            raise ValueError(f"Failed to load file '{os.path.basename(file_path)}': {e}")

        # Chunking
        try:
            text_splitter = RecursiveCharacterTextSplitter(
                chunk_size=1000, chunk_overlap=150, length_function=len,
                separators=["\n\n", "\n", ". ", ", ", " ", ""], add_start_index=True
            )
            chunks = text_splitter.split_documents(docs)
            logger.info(f"Split into {len(chunks)} final chunks.")
        except Exception as e:
             logger.error(f"Error splitting documents from {file_path}: {e}", exc_info=True)
             raise ValueError(f"Failed to split documents: {e}")

        # Validation and Metadata Enrichment
        valid_chunks = []
        original_filename = os.path.basename(file_path) # Get filename for metadata
        for i, chunk in enumerate(chunks):
            page_content = getattr(chunk, 'page_content', None)
            if not isinstance(page_content, str) or not page_content.strip():
                 logger.warning(f"Chunk {i} from '{original_filename}' has invalid or empty page_content, skipping.")
                 continue

            # Ensure metadata is a dict; initialize if necessary
            if not hasattr(chunk, 'metadata') or not isinstance(chunk.metadata, dict):
                chunk.metadata = {}

            # Ensure source and add chunk index
            chunk.metadata['source'] = original_filename
            chunk.metadata['chunk_index'] = i
            valid_chunks.append(chunk)

        if not valid_chunks:
             logger.warning(f"No valid chunks generated after splitting for '{original_filename}'.")

        logger.info(f"Returning {len(valid_chunks)} valid chunks for '{original_filename}'.")
        return valid_chunks

    async def process_and_store(self, file_path: str, original_file_name: str, azure_provider: AzureOpenAIProvider):
        """
        Processes a single file: loads, chunks, generates embeddings, and stores in Qdrant.
        Requires the AzureOpenAIProvider instance to be passed.
        """
        logger.info(f"Starting process_and_store for '{original_file_name}'...")
        try:
            # 1. Load and Chunk using the static method
            chunks = self._load_and_chunk_file(file_path) # Returns list of LangChain Document objects
            if not chunks:
                # If loading/chunking failed or produced nothing, return early
                logger.warning(f"No valid chunks generated for {original_file_name}. Aborting storage.")
                return {
                    "collection_name": None,
                    "chunks_processed": 0,
                    "points_stored": 0,
                    "status": "No content processed"
                }

            texts = [chunk.page_content for chunk in chunks]
            metadatas = [chunk.metadata for chunk in chunks] # List of metadata dicts

            # 2. Generate Embeddings using the passed provider instance
            logger.info(f"Generating embeddings for {len(texts)} chunks for {original_file_name}...")
            vectors = await azure_provider.generate_document_embeddings(texts)
            logger.info(f"Generated {len(vectors)} vectors for {original_file_name}.")

            # Validate embedding count
            if len(vectors) != len(texts):
                raise RuntimeError(f"Embedding count mismatch for {original_file_name}: {len(texts)} texts vs {len(vectors)} vectors.")

            # 3. Prepare Qdrant Collection Name
            collection_base_name = os.path.splitext(original_file_name)[0]
            # Clean the name: replace non-alphanumeric with underscore, lowercase, remove leading/trailing underscores
            collection_name = "".join(c if c.isalnum() else '_' for c in collection_base_name).lower().strip('_')
            if not collection_name: # Handle cases where name becomes empty (e.g., filename was just '.')
                 collection_name = f"file_{uuid.uuid4().hex[:8]}" # Generate a fallback name
            logger.info(f"Target collection for {original_file_name}: {collection_name}")

            # 4. Setup Qdrant Collection (ensure size matches embedding model)
            # Pass the expected vector size explicitly
            setup_collection(collection_name, vector_size=EXPECTED_VECTOR_SIZE)

            # 5. Upsert Vectors into Qdrant
            # Pass texts, metadatas, and vectors
            num_stored = await upsert_vectors(collection_name, texts, metadatas, vectors)
            logger.info(f"Storage process complete for {original_file_name}. Stored {num_stored} points in '{collection_name}'.")

            # Return success details
            return {
                "collection_name": collection_name,
                "chunks_processed": len(chunks),
                "points_stored": num_stored,
                "status": "Success"
            }
        except Exception as e:
            # Log error with file context before re-raising for the background task
            logger.error(f"Critical error during process_and_store for '{original_file_name}': {e}", exc_info=True)
            # Re-raise the exception so the background task handler knows it failed
            raise
