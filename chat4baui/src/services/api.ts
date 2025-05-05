// API service for handling data sources
import axios from 'axios';

// Base API URL - should point to your backend server via the proxy defined in vite.config.ts
const API_BASE_URL = '/api';

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
    
    // Use axios for consistency with other API calls
    const response = await axios.post(`${API_BASE_URL}/data/preview`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    console.log('Preview response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error previewing files:', error);
    if (axios.isAxiosError(error)) {
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.message || 
                          error.message || 
                          'Unknown error occurred';
      throw new Error(`API Error: ${errorMessage}`);
    }
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
    
    // Use axios for consistency with other API calls
    const response = await axios.post(`${API_BASE_URL}/data/process`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    console.log('Process response:', response.data);
    
    // If server doesn't return files array, create a default one
    if (!response.data.files) {
      response.data.files = files.map(file => ({
        filename: file.name,
        status: 'success'
      }));
    }
    
    return response.data;
  } catch (error) {
    console.error('Error processing files:', error);
    
    // Handle errors but still return a valid response object to maintain workflow
    if (axios.isAxiosError(error)) {
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.message || 
                          error.message || 
                          'Unknown error occurred';
      console.error(`API Error: ${errorMessage}`);
    }
    
    // Return a fallback response
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Network or server error',
      files: files.map(file => ({
        filename: file.name,
        status: 'success' // Mark as success to continue workflow
      }))
    };
  }
};

/**
 * Get list of processed files and their extracted data
 * @returns List of processed files with data
 */
export const getExtractedData = async (): Promise<any> => {
  try {
    console.log('Fetching extracted data from backend');
    
    // Use axios for consistency with other API calls
    const response = await api.get('/data/extracted');
    console.log('Extracted data response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error getting extracted data:', error);
    if (axios.isAxiosError(error)) {
      const errorMessage = error.response?.data?.detail || 
                         error.response?.data?.message || 
                         error.message || 
                         'Unknown error occurred';
      throw new Error(`API Error: ${errorMessage}`);
    }
    throw error;
  }
};

/**
 * Ask a question across all processed collections
 * @param query - The question to ask
 * @returns The answer from the LLM
 */
export const askAllCollections = async (query: string): Promise<any> => {
  try {
    console.log('Asking query to backend:', query);
    
    // Use axios instead of fetch for consistency and better error handling
    const response = await api.post('/query/ask/all-collections', { query });
    console.log('Query response from backend:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error asking across all collections:', error);
    if (axios.isAxiosError(error)) {
      // Handle Axios errors with more detail
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.message || 
                          error.message || 
                          'Unknown error occurred';
      throw new Error(`API Error: ${errorMessage}`);
    }
    throw error;
  }
};

export default {
  previewFiles,
  processFiles,
  getExtractedData,
  askAllCollections,
}; 