from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    # Azure OpenAI Settings
    AZURE_OPENAI_API_KEY: str
    AZURE_OPENAI_ENDPOINT: str
    OPENAI_DEPLOYMENT_NAME: str
    EMBEDDINGS_DEPLOYMENT_NAME: str

    # Qdrant Settings
    QDRANT_API_KEY: str
    QDRANT_URL: str
    QDRANT_ENDPOINT: str

    # Google SSO Settings
    GOOGLE_CLIENT_ID: str
    GOOGLE_CLIENT_SECRET: str
    GOOGLE_REDIRECT_URI: str

    # Database Settings
    USER_DATABASE_URL: str
    DATABASE_URL: str = "sqlite:///./main.db"
    DB_POOL_SIZE: int = 5
    DB_MAX_OVERFLOW: int = 10
    USER_DB_POOL_SIZE: int = 5
    USER_DB_MAX_OVERFLOW: int = 10

    class Config:
        env_file = ".env"

settings = Settings()
