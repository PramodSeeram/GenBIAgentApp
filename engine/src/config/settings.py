from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    AZURE_OPENAI_API_KEY: str
    AZURE_OPENAI_ENDPOINT: str
    QDRANT_API_KEY: str
    QDRANT_ENDPOINT: str
    OPENAI_DEPLOYMENT_NAME: str
    EMBEDDINGS_DEPLOYMENT_NAME: str

settings = Settings()
