# Chat4BA: AI-Powered Data Chat & Threaded Conversations

Welcome to **Chat4BA**, an open-source platform for conversational data analysis and business intelligence. Chat4BA lets you upload structured data (CSV, Excel), chat with your data using advanced AI models, and organize your insights in persistent, searchable threads—all with a modern, secure authentication system.

🚀 **Features**

* **Conversational Data Analysis:** Upload CSV/Excel files and ask questions in natural language. The AI provides context-aware answers, summaries, and insights.
* **Threaded Chat History:** Every conversation is stored as a thread, preserving all user and AI messages, file associations, and timestamps for easy retrieval and review.
* **Semantic Search:** Instantly find relevant threads or past conversations using vector-based semantic search powered by Qdrant.
* **File Management:** Preview, upload, and associate files with threads. All file content is chunked, embedded, and stored for fast retrieval.
* **Google & Microsoft SSO:** Secure, modern authentication with Google and Microsoft OAuth2 (SSO) for seamless user onboarding and access control.
* **Real-Time Updates:** Thread updates and chat history are instantly persisted and available across sessions.
* **Scalable Backend:** Built with FastAPI, Qdrant, and optional MySQL for future user management and enterprise features.

🏗️ **Architecture Overview**

| Layer            | Technology          | Purpose                                         |
| :--------------- | :------------------ | :---------------------------------------------- |
| **Frontend** | React, Vite         | Modern UI, chat interface, SSO                  |
| **Backend** | FastAPI             | REST API, authentication, orchestration         |
| **Vector Store** | Qdrant              | Thread storage, semantic search                 |
| **(Optional) DB** | MySQL/PostgreSQL    | User management, audit logs (future)            |
| **Auth** | Google/Microsoft    | Secure OAuth2 SSO                               |

---

📦 **Quick Start**

1.  **Clone the Repository**

    ```bash
    git clone https://github.com/PramodSeeram/GenBIAgentApp.git
    cd chat4ba
    ```

2.  **Environment Setup**

    Before installing dependencies, create `.env` files in the respective directories and populate them with your configuration details.

    **Backend: `AgentApp/engine/.env`**

    ```text
    AZURE_OPENAI_API_KEY="your_azure_openai_api_key"
    AZURE_OPENAI_ENDPOINT="your_azure_openai_endpoint"
    QDRANT_API_KEY="your_qdrant_api_key"
    QDRANT_URL="your_qdrant_url"
    QDRANT_ENDPOINT="your_qdrant_endpoint" # Often same as QDRANT_URL
    OPENAI_DEPLOYMENT_NAME="your_openai_deployment_name" # e.g., gpt-4
    EMBEDDINGS_DEPLOYMENT_NAME="your_embeddings_deployment_name" # e.g., text-embedding-3-large

    # Database Configuration
    # DATABASE_URL="sqlite:///./your.db" # Uncomment for SQLite if not using MySQL
    USER_DATABASE_URL="mysql+mysqlconnector://your_db_user:your_db_password@your_db_host:your_db_port/your_db_name"
    DATABASE_URL="mysql+mysqlconnector://your_db_user:your_db_password@your_db_host:your_db_port/your_db_name"

    GOOGLE_CLIENT_ID="your_google_client_id"
    GOOGLE_CLIENT_SECRET="your_google_client_secret"
    GOOGLE_REDIRECT_URI="http://localhost:8000/api/auth/google/callback" # Update if deployed
    ```

    **Frontend: `AgentApp/chat4baui/.env`**

    ```text
    VITE_GOOGLE_CLIENT_ID="your_google_client_id"
    ```

3.  **Install Dependencies**

    **Backend:**

    ```bash
    cd AgentApp/engine
    pip install -r requirements.txt
    ```

    **Frontend:**

    ```bash
    cd AgentApp/chat4baui
    npm install
    ```

4.  **Run the App**

    **Backend:**

    ```bash
    uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
    ```

    **Frontend:**

    ```bash
    npm run dev
    ```

---

🧩 **Key Concepts**

* **Thread Storage in Qdrant:** Each thread is a Qdrant point with a unique ID, title, full message history, timestamps, and associated files. All chat history and updates are stored in the thread’s payload, ensuring atomic updates and easy retrieval.
* **Authentication:** Google and Microsoft SSO are supported via OAuth2. Tokens are verified server-side for security; user info is stored in the backend for session management.
* **File Upload & Processing:** Upload CSV/Excel files, which are chunked, embedded, and stored in Qdrant for semantic retrieval. Files can be associated with threads for context-aware Q&A.

---

🛡️ **Security**

* All authentication tokens are verified on the backend.
* Environment variables are used for all secrets and API keys.
* CORS is configured for secure frontend-backend communication.