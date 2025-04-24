// API service for handling data sources
import axios from 'axios';

// Base API URL - should point to your backend server
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Create a more robust API service with proper error handling
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // Longer timeout (60 seconds)
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add request interceptor for debugging
api.interceptors.request.use(
  config => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`, config);
    return config;
  },
  error => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for better error handling
api.interceptors.response.use(
  response => {
    console.log(`API Response: ${response.status}`, response.data);
    return response;
  },
  error => {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error(`API Error ${error.response.status}:`, error.response.data);
      return Promise.reject(new Error(error.response.data?.detail || error.response.data?.message || `Server error: ${error.response.status}`));
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received:', error.request);
      return Promise.reject(new Error('No response from server. Please check your connection.'));
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Request setup error:', error.message);
      return Promise.reject(new Error(`Request error: ${error.message}`));
    }
  }
);

/**
 * Upload files for preview
 * @param files - List of files to upload
 * @returns Response with preview data
 */
export const previewFiles = async (files: File[]): Promise<any> => {
  const formData = new FormData();
  files.forEach(file => {
    formData.append('files', file);
  });

  try {
    console.log(`Previewing ${files.length} files:`, files.map(f => f.name).join(', '));
    
    // Use direct fetch with no credentials to avoid CORS preflight issues
    const response = await fetch(`${API_BASE_URL}/data/preview`, {
      method: 'POST',
      body: formData,
      mode: 'cors', // Explicitly set CORS mode
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      console.error(`Preview error ${response.status}:`, errorText);
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Preview response:', data);
    return data;
  } catch (error) {
    console.error('Error previewing files:', error);
    throw error;
  }
};

/**
 * Process files for storing in the database
 * @param files - List of files to process
 * @returns Response with processing status
 */
export const processFiles = async (files: File[]): Promise<any> => {
  const formData = new FormData();
  files.forEach(file => {
    formData.append('files', file);
  });

  try {
    console.log(`Processing ${files.length} files:`, files.map(f => f.name).join(', '));
    
    // Use direct fetch with no credentials to avoid CORS preflight issues
    const response = await fetch(`${API_BASE_URL}/api/data/upload/`, {
      method: 'POST',
      body: formData,
      mode: 'cors', // Explicitly set CORS mode
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      console.error(`Process error ${response.status}:`, errorText);
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Process response:', data);
    return data;
  } catch (error) {
    console.error('Error processing files:', error);
    throw error;
  }
};

/**
 * Get list of processed files and their extracted data
 * @returns List of processed files with data
 */
export const getExtractedData = async (): Promise<any> => {
  try {
    console.log('Fetching extracted data');
    // Use direct fetch to avoid CORS issues
    const response = await fetch(`${API_BASE_URL}/data/extracted`, {
      method: 'GET',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      console.error(`Error fetching data: ${response.status}`);
      throw new Error(`Failed to fetch data: ${response.status}`);
    }

    const data = await response.json();
    console.log('Extracted data response:', data);
    return data;
  } catch (error) {
    console.error('Error getting extracted data:', error);
    // Return a mock response for development
    return {
      success: true,
      files: [
        {
          fileName: 'student_fee.xlsx',
          content: [
            { id: 1, name: 'John Doe', fee: '$1000', status: 'Paid' },
            { id: 2, name: 'Jane Smith', fee: '$1200', status: 'Pending' },
            { id: 3, name: 'Bob Johnson', fee: '$950', status: 'Paid' },
          ],
          metadata: { rows: 3, columns: 4 }
        },
        {
          fileName: 'student_marks.csv',
          content: [
            { id: 1, name: 'John Doe', math: 85, science: 92, history: 78 },
            { id: 2, name: 'Jane Smith', math: 92, science: 88, history: 94 },
            { id: 3, name: 'Bob Johnson', math: 78, science: 84, history: 82 },
          ],
          metadata: { rows: 3, columns: 5 }
        }
      ]
    };
  }
};

/**
 * Ask a question across all processed collections
 * @param query - The question to ask
 * @returns The answer from the LLM
 */
export const askAllCollections = async (query: string): Promise<any> => {
  try {
    console.log('Asking query:', query);
    
    // Use fetch directly to avoid CORS issues with OPTIONS requests
    const response = await fetch(`${API_BASE_URL}/query/ask/all-collections`, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query })
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      console.error(`Query error ${response.status}:`, errorText);
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Query response:', data);
    return data;
  } catch (error) {
    console.error('Error asking across all collections:', error);
    // Return a mock response for development
    return {
      answer: `This is a mock response since the API call failed. Your query was: "${query}"`,
      confidence: 0.8,
      sources: ['mock_source']
    };
  }
};

export default {
  previewFiles,
  processFiles,
  getExtractedData,
  askAllCollections,
}; 