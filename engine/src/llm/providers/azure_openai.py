import os
import logging
from dotenv import load_dotenv
from langchain_openai import AzureOpenAIEmbeddings, AzureChatOpenAI
from langchain.prompts import ChatPromptTemplate
from langchain.schema.runnable import RunnablePassthrough
from langchain.schema.output_parser import StrOutputParser

# Configure logging for this module
logger = logging.getLogger(__name__)

# --- Environment Variable Loading ---
# Calculate the path to the .env.dev file relative to this script's location
# Assumes .env.dev is in the 'engine' directory, 3 levels up from 'src/llm/providers'
dotenv_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..', '.env'))
logger.info(f"Attempting to load environment variables from: {dotenv_path}")

# Load the .env.dev file. If it returns False, the file might be missing or unreadable.
loaded = load_dotenv(dotenv_path=dotenv_path, override=True) # Override ensures fresh load on reload
if not loaded:
    logger.warning(f".env file not found or failed to load from {dotenv_path}. Relying on system environment variables.")
else:
    logger.info(f".env file loaded successfully from {dotenv_path}")

# --- Debug: Print loaded variables ---
# It's helpful to see exactly what os.getenv is retrieving right after loading
# logger.debug(f"AZURE_OPENAI_API_KEY loaded: {'*' * 5 if os.getenv('AZURE_OPENAI_API_KEY') else 'Not Set'}")
# logger.debug(f"AZURE_OPENAI_ENDPOINT loaded: {os.getenv('AZURE_OPENAI_ENDPOINT')}")
# logger.debug(f"AZURE_OPENAI_API_VERSION loaded: {os.getenv('AZURE_OPENAI_API_VERSION')}")
# logger.debug(f"AZURE_EMBEDDING_DEPLOYMENT loaded: {os.getenv('AZURE_EMBEDDING_DEPLOYMENT')}")
# logger.debug(f"AZURE_CHAT_DEPLOYMENT loaded: {os.getenv('AZURE_CHAT_DEPLOYMENT')}")
# --- End Debug ---


class AzureOpenAIProvider:
    def __init__(self):
        logger.info("Initializing AzureOpenAIProvider...")
        self.api_key = os.getenv("AZURE_OPENAI_API_KEY")
        self.endpoint = os.getenv("AZURE_OPENAI_ENDPOINT")
        self.embedding_deployment = os.getenv("AZURE_EMBEDDING_DEPLOYMENT")
        self.chat_deployment = os.getenv("AZURE_CHAT_DEPLOYMENT")
        self.api_version = os.getenv("AZURE_OPENAI_API_VERSION")

        # Check if any variable is None or empty string
        required_vars = {
            "AZURE_OPENAI_API_KEY": self.api_key,
            "AZURE_OPENAI_ENDPOINT": self.endpoint,
            "AZURE_EMBEDDING_DEPLOYMENT": self.embedding_deployment,
            "AZURE_CHAT_DEPLOYMENT": self.chat_deployment,
            "AZURE_OPENAI_API_VERSION": self.api_version
        }
        missing_vars = [name for name, value in required_vars.items() if not value]

        if missing_vars:
            error_message = f"Missing Azure OpenAI environment variables: {', '.join(missing_vars)}"
            logger.error(error_message)
            raise ValueError(error_message) # Raise error with specific missing vars

        try:
            # Initialize models safely
            logger.info(f"Initializing Embeddings model (Deployment: {self.embedding_deployment})...")
            self.embeddings_model = AzureOpenAIEmbeddings(
                azure_deployment=self.embedding_deployment,
                openai_api_key=self.api_key,
                azure_endpoint=self.endpoint,
                api_version=self.api_version,
                # Add retry logic if needed
            )
            logger.info(f"Initializing Chat model (Deployment: {self.chat_deployment})...")
            self.chat_model = AzureChatOpenAI(
                azure_deployment=self.chat_deployment,
                openai_api_key=self.api_key,
                azure_endpoint=self.endpoint,
                api_version=self.api_version,
                temperature=0.7,
                # Add retry logic if needed
            )
            logger.info("AzureOpenAIProvider initialized successfully.")
        except Exception as e:
            logger.error(f"Error initializing Azure OpenAI models: {e}", exc_info=True)
            raise # Re-raise the exception after logging

    def get_embeddings_model(self):
        return self.embeddings_model

    def get_chat_model(self):
        return self.chat_model

    async def generate_query_embedding(self, query: str):
        if not isinstance(query, str) or not query.strip():
             logger.warning("generate_query_embedding received empty or invalid query.")
             return None # Or handle appropriately
        try:
             return await self.embeddings_model.aembed_query(query)
        except Exception as e:
             logger.error(f"Error generating query embedding: {e}", exc_info=True)
             raise

    async def generate_document_embeddings(self, texts: list[str]):
        valid_texts = [text for text in texts if isinstance(text, str) and text.strip()]
        if not valid_texts:
             logger.warning("generate_document_embeddings received no valid texts.")
             return []
        if len(valid_texts) < len(texts):
             logger.warning(f"Filtered out {len(texts) - len(valid_texts)} invalid/empty texts.")
        try:
            return await self.embeddings_model.aembed_documents(valid_texts)
        except Exception as e:
            logger.error(f"Error generating document embeddings: {e}", exc_info=True)
            raise

    async def ask_with_context(self, query: str, context: str, system_prompt: str):
        prompt_template = ChatPromptTemplate.from_template(f"""{system_prompt}

        Context:
        {{context}}

        Question: {{question}}
        Answer (markdown supported):""")

        rag_chain = (
            {"context": RunnablePassthrough(), "question": RunnablePassthrough()}
            | prompt_template
            | self.chat_model
            | StrOutputParser()
        )

        try:
            response = await rag_chain.ainvoke({"context": context, "question": query})
            return response.strip()
        except Exception as e:
            logger.error(f"Error invoking RAG chain: {e}", exc_info=True)
            raise

# --- Global Instance Management ---
# Instantiate ONLY when needed, preferably via dependency injection in FastAPI
# Avoid creating global instance here if possible, as it runs on import
_azure_provider_instance = None

def get_azure_provider():
    """Dependency function to get the provider instance."""
    global _azure_provider_instance
    if _azure_provider_instance is None:
        logger.info("Creating new AzureOpenAIProvider instance.")
        _azure_provider_instance = AzureOpenAIProvider()
    return _azure_provider_instance

# --- Convenience Functions using Dependency ---
# These functions should ideally be methods or called via the provider instance

def get_llm():
    provider = get_azure_provider()
    return provider.get_chat_model()

def get_embeddings():
    provider = get_azure_provider()
    return provider.get_embeddings_model()

async def generate_query_embedding(query: str):
    provider = get_azure_provider()
    return await provider.generate_query_embedding(query)

async def generate_document_embeddings(texts: list[str]):
    provider = get_azure_provider()
    # This needs adjustment - the original function expected Document chunks
    # Assuming the calling code now passes strings:
    return await provider.generate_document_embeddings(texts)

async def ask_llm_with_context(query: str, context: str, system_prompt: str):
    provider = get_azure_provider()
    return await provider.ask_with_context(query, context, system_prompt)

