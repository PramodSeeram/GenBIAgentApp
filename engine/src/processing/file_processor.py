from langchain_community.document_loaders import CSVLoader, UnstructuredExcelLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
import os
from src.processing.vectorizer import store_texts_in_qdrant

class FileProcessor:
    @staticmethod
    def process_file(file_path: str) -> list:
        """Enhanced processing using techniques from [1] and [4]"""
        ext = os.path.splitext(file_path)[1].lower()
        
        # Initialize loader with proper encoding
        if ext == ".csv":
            loader = CSVLoader(file_path, encoding='utf-8-sig')  # Handle BOM
        elif ext in (".xlsx", ".xls", ".xlsm", ".xlsb", ".xltx", ".xltm", ".xlt"):
            # Using elements mode can sometimes be better for structure
            loader = UnstructuredExcelLoader(file_path, mode="elements") 
        else:
            raise ValueError("Unsupported file type")
            
        # Load documents using the selected loader
        docs = loader.load()

        # Create text splitter with appropriate chunk size
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,  # Keep original chunk size
            chunk_overlap=100, # Add some overlap
            separators=["\n\n", "\n", ".", " ", ""], # More robust separators
            length_function=len
        )

        # Split documents into smaller chunks
        chunks = text_splitter.split_documents(docs)

        # Ensure each chunk's content is a string and not too long
        for chunk in chunks:
            if not isinstance(chunk.page_content, str):
                chunk.page_content = str(chunk.page_content)
            # Truncate if too long (optional safety measure)
            # Increased limit slightly as embeddings handle longer texts
            if len(chunk.page_content) > 4000: 
                print(f"Warning: Truncating chunk content longer than 4000 chars for file {os.path.basename(file_path)}")
                chunk.page_content = chunk.page_content[:4000]

        return chunks

    def process_and_store(self, file_path: str, file_name: str):
        """
        Process file, create embeddings and store in Qdrant
        Uses file_name as collection name
        """
        # Get chunked documents
        docs = self.process_file(file_path)
        print(f"[FileProcessor] Processed file {file_name}, got {len(docs)} documents/chunks.")
        
        if not docs:
            print(f"[FileProcessor] Warning: No documents/chunks extracted from {file_name}.")
            # Optionally raise an error here or return an empty success state
            # For now, let it proceed to see vectorizer logs

        # Extract content and metadata from docs
        texts = [doc.page_content for doc in docs]
        metadatas = [dict(doc.metadata) for doc in docs]
        print(f"[FileProcessor] Extracted {len(texts)} texts and {len(metadatas)} metadata entries.")
        if texts:
            print(f"[FileProcessor] First text chunk sample: {texts[0][:200]}...")
        
        # Generate collection name from filename without extension
        collection_name = os.path.splitext(file_name)[0].lower().replace(" ", "_")
        
        # Setup collection if it doesn't exist
        from src.database.vector_db.qdrant_client import setup_collection
        setup_collection(collection_name)
        
        # Store in Qdrant
        num_stored = store_texts_in_qdrant(texts, metadatas, collection_name)
        print(f"[FileProcessor] Vectorizer reported storing {num_stored} points.")
        
        return {
            "collection_name": collection_name,
            "chunks_processed": len(texts), # Report initial chunk count
            "points_stored": num_stored      # Report how many were actually stored
        }
