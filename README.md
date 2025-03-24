
# GENBI - Generative Business Intelligence Application


**GENBI** is a cutting-edge Generative Business Intelligence (GenBI) application designed to revolutionize how businesses interact with data. Leveraging the power of generative AI, GENBI streamlines data analysis, reporting, and decision-making processes by providing users with intuitive natural language interfaces.

### Key Features

- **Data Ingestion**: Supports uploading Excel and CSV files with real-time progress tracking.
- **Data Analysis**: Utilizes LangChain for embedding generation and semantic search, enabling users to query data in natural language.
- **Data Visualization**: Offers interactive visualizations (e.g., charts, graphs) based on query results.
- **Self-Service Analytics**: Empowers users across the organization to perform advanced analytics without requiring extensive technical expertise.

---

## Getting Started

### Prerequisites

- Python 3.10+
- FastAPI
- LangChain
- Pinecone (or similar vector database)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-repo/GENBI.git && cd GENBI/
   ```

2. Create a virtual environment:
   ```bash
   python3 -m venv env
   .\env\Scripts\activate   # On Windows
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt 
   ```

---

## Usage

1. Run the application:
   ```bash
   uvicorn src.main:app --reload 
   ```

2. Access the application at [http://127.0.0.1:8000](http://127.0.0.1:8000).

3. Upload a file and explore the modeling page for data inspection and editing.

4. Use the query input to ask questions about your data and view results with visualization options.

---

## Roadmap

- **Short-term Goals**:
  - Implement advanced data visualization options (e.g., interactive dashboards).
  - Enhance error handling for file uploads and query processing.

- **Long-term Goals**:
  - Integrate additional data sources (e.g., databases, APIs).
  - Expand support for more file formats (e.g., JSON, XML).

---

## Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---


