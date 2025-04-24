from langchain_community.document_loaders import UnstructuredCSVLoader, UnstructuredExcelLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
import os
import logging
import uuid # Import uuid for fallback collection name
# Import the Azure Provider TYPE for type hinting, NOT the functions directly here
from src.llm.providers.azure_openai import AzureOpenAIProvider
# Import the database functions
from src.database.vector_db.qdrant_client import setup_collection, upsert_vectors

logger = logging.getLogger(__name__)

class FileProcessor:
    @staticmethod
    def _load_and_chunk_file(file_path: str) -> list:
        """Loads and chunks documents from a file path. Returns list of LangChain Document objects."""
        ext = os.path.splitext(file_path)[1].lower()
        logger.info(f"Loading and chunking file: {file_path} with extension {ext}")

        try:
            if ext == ".csv":
                loader = UnstructuredCSVLoader(file_path, mode="elements", encoding='utf-8-sig')
            elif ext in (".xlsx", ".xls"):
                loader = UnstructuredExcelLoader(file_path, mode="elements")
            else:
                raise ValueError(f"Unsupported file type: {ext}")

            docs = loader.load()
            if not docs:
                 logger.warning(f"No documents loaded from {file_path}.")
                 return []
            logger.info(f"Loaded {len(docs)} initial elements from {file_path}.")

        except Exception as e:
            logger.error(f"Error loading file {file_path}: {e}", exc_info=True)
            raise ValueError(f"Failed to load file: {e}")

        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000, chunk_overlap=150, length_function=len,
            separators=["\n\n", "\n", ". ", ", ", " ", ""], add_start_index=True
        )
        chunks = text_splitter.split_documents(docs)
        logger.info(f"Split into {len(chunks)} final chunks.")

        valid_chunks = []
        for i, chunk in enumerate(chunks):
            if not isinstance(chunk.page_content, str) or not chunk.page_content.strip():
                 logger.warning(f"Chunk {i} has invalid content, skipping.")
                 continue
            # Ensure metadata is a dict and add source/index
            if not isinstance(chunk.metadata, dict):
                 chunk.metadata = {}
            chunk.metadata['source'] = os.path.basename(file_path)
            chunk.metadata['chunk_index'] = i
            valid_chunks.append(chunk)

        logger.info(f"Returning {len(valid_chunks)} valid chunks.")
        return valid_chunks

    # Corrected Method Signature: Added azure_provider parameter
    async def process_and_store(self, file_path: str, file_name: str, azure_provider: AzureOpenAIProvider):
        """Processes file, generates embeddings using the provided provider, and stores in Qdrant."""
        logger.info(f"Starting process_and_store for {file_name}...")
        try:
            chunks = self._load_and_chunk_file(file_path) # Returns list of LangChain Document objects
            if not chunks:
                logger.warning(f"No valid chunks generated for {file_name}. Skipping storage.")
                return {"collection_name": None, "chunks_processed": 0, "points_stored": 0}

            texts = [chunk.page_content for chunk in chunks]
            metadatas = [chunk.metadata for chunk in chunks] # List of metadata dicts

            logger.info(f"Generating embeddings for {len(texts)} chunks...")
            # Use the generate_document_embeddings method from the PASSED provider instance
            vectors = await azure_provider.generate_document_embeddings(texts)
            logger.info(f"Generated {len(vectors)} vectors.")

            if len(vectors) != len(texts):
                raise RuntimeError(f"Mismatch: {len(texts)} texts vs {len(vectors)} vectors.")

            # Generate collection name from original filename
            collection_base_name = os.path.splitext(file_name)[0]
            collection_name = "".join(c if c.isalnum() else '_' for c in collection_base_name).lower()
            if not collection_name:
                 collection_name = f"collection_{uuid.uuid4().hex[:8]}" # Fallback
            logger.info(f"Target collection name: {collection_name}")

            # Setup collection (vector size 3072 assumed handled by setup_collection)
            setup_collection(collection_name)

            # Store vectors (assuming upsert_vectors handles async/sync correctly)
            num_stored = await upsert_vectors(collection_name, texts, metadatas, vectors)
            logger.info(f"Storage complete for {file_name}. Stored {num_stored} points.")

            return {
                "collection_name": collection_name,
                "chunks_processed": len(chunks),
                "points_stored": num_stored
            }
        except Exception as e:
            logger.error(f"Error in process_and_store for {file_name}: {e}", exc_info=True)
            raise # Re-raise for the background task handler
