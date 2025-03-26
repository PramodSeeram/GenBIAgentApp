# services/file_ingestor.py
import pandas as pd
import os

def process_excel_file(file_path):
    """
    Process an Excel or CSV file and extract structured data
    """
    try:
        if file_path.endswith('.csv'):
            df = pd.read_csv(file_path)
        else:
            df = pd.read_excel(file_path)
        
        # Convert DataFrame to a list of dictionaries
        records = df.to_dict('records')
        
        # Also prepare a text representation for embedding generation
        text_data = []
        for idx, row in df.iterrows():
            row_text = " ".join([f"{col}: {val}" for col, val in row.items() if pd.notna(val)])
            text_data.append(row_text)
        
        return records, text_data
    except Exception as e:
        raise Exception(f"Error processing file: {str(e)}")
