# services/query_processor.py
from openai import AzureOpenAI
import os
from services.vector_db_manager import query_vector_db

# Initialize Azure OpenAI client
client = AzureOpenAI(
    azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT", "https://chat4baai.openai.azure.com/"),
    api_key=os.getenv("AZURE_OPENAI_API_KEY", "2hNgRCRUWi3KFlAQuiTDWRnmyduY9bSr29kMnCXQ0oaOxHyrqkJTJQQJ99BAACYeBjFXJ3w3AAABACOGMgfH"),
    api_version=os.getenv("OPEN_API_VERSION", "2024-05-01-preview")
)

def process_query(query):
    """
    Process a query using RAG with Azure OpenAI
    """
    # Retrieve relevant context from vector database
    context = query_vector_db(query)
    
    # Format context for the prompt
    context_text = "\n\n".join([item["text"] for item in context])
    
    # Create system and user messages for the chat completion
    system_prompt = """
    You are a helpful assistant. Use the following information to answer the user's question.
    If you don't know the answer based on the provided information, say so.
    """
    
    user_prompt = f"""
    Use the following context to answer my question:
    
    Context:
    {context_text}
    
    Question: {query}
    """
    
    # Call Azure OpenAI API
    try:
        response = client.chat.completions.create(
            model=os.getenv("OPENAI_DEPLOYMENT_ID", "gpt-4"),
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.7,
            max_tokens=800
        )
        
        return {
            "query": query,
            "response": response.choices[0].message.content,
            "context": [item["text"] for item in context]
        }
    except Exception as e:
        print(f"Error calling Azure OpenAI: {str(e)}")
        return {
            "query": query,
            "response": "I'm sorry, I encountered an error while processing your query.",
            "context": [item["text"] for item in context]
        }
