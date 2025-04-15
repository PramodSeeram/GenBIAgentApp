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
        elif ext in (".xlsx", ".xls"):
            loader = UnstructuredExcelLoader(file_path, mode="paged")
        else:
            raise ValueError("Unsupported file type")
            
        # Load and chunk documents
        docs = loader.load()
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            separators=["\n\n", "\n", "|", " "]
        )
        return text_splitter.split_documents(docs)

    def process_and_store(self, file_path: str, collection_name: str):
        docs = self.get_full_content(file_path)
        texts = [doc["content"] for doc in docs]
        metadatas = [doc["metadata"] for doc in docs]
        store_texts_in_qdrant(texts, metadatas, collection_name)
