from langchain_openai import AzureOpenAIEmbeddings, AzureChatOpenAI
from src.config.settings import settings

def get_embeddings():
    return AzureOpenAIEmbeddings(
        azure_deployment=settings.EMBEDDINGS_DEPLOYMENT_NAME,  # e.g., "text-embedding-ada-002"
        openai_api_version="2023-12-01-preview",
        azure_endpoint=settings.AZURE_OPENAI_ENDPOINT,
        api_key=settings.AZURE_OPENAI_API_KEY
    )

# def get_embeddings():
#     return AzureOpenAIEmbeddings(
#         azure_deployment=settings.EMBEDDINGS_DEPLOYMENT_NAME,
#         openai_api_version="2023-05-15",
#         azure_endpoint=settings.AZURE_OPENAI_ENDPOINT,
#         api_key=settings.AZURE_OPENAI_API_KEY
#     )

def get_llm():
    return AzureChatOpenAI(
        azure_deployment=settings.OPENAI_DEPLOYMENT_NAME,
        openai_api_version="2024-05-01-preview",
        azure_endpoint=settings.AZURE_OPENAI_ENDPOINT,
        api_key=settings.AZURE_OPENAI_API_KEY,
        temperature=0
    )
