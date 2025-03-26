import React, { useState } from 'react';
import axios from 'axios';

const FileUpload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState<any>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
  
    const formData = new FormData();
    formData.append('file', file);
  
    setUploading(true);
    setProgress(0);
  
    try {
      const response = await axios.post('http://localhost:8000/api/upload', formData, {
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total || 1)
          );
          setProgress(percentCompleted);
        }
      });
  
      setPreview(response.data.data_preview);
      setUploading(false);
    } catch (error) {
      console.error('Error uploading file:', error);
      setUploading(false);
    }
  };

  return (
    <div className="file-upload-container">
      <h2>Upload Excel File</h2>
      <div className="file-input">
        <input type="file" onChange={handleFileChange} accept=".xlsx,.xls,.csv" />
        <button onClick={handleUpload} disabled={!file || uploading}>
          {uploading ? 'Uploading...' : 'Upload'}
        </button>
      </div>
      
      {uploading && (
        <div className="progress-bar">
          <div className="progress" style={{ width: `${progress}%` }}></div>
          <span>{progress}%</span>
        </div>
      )}
      
      {preview && (
        <div className="data-preview">
          <h3>Data Preview</h3>
          <pre>{JSON.stringify(preview, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
