import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import SampleDatasets, { UploadedFile } from '@/components/data-sources/SampleDatasets';
import DataBoilerplates from '@/components/data-sources/DataBoilerplates';
import ExternalDataSources from '@/components/data-sources/ExternalDataSources';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

const STORAGE_KEY = 'chat4ba_uploaded_files';

const DataSources = () => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const navigate = useNavigate();

  // Load uploaded files from local storage on component mount
  useEffect(() => {
    const savedFiles = localStorage.getItem(STORAGE_KEY);
    if (savedFiles) {
      try {
        setUploadedFiles(JSON.parse(savedFiles));
      } catch (error) {
        console.error('Error parsing saved files:', error);
      }
    }
  }, []);

  // Save uploaded files to local storage whenever the list changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(uploadedFiles));
  }, [uploadedFiles]);

  // Update handleFileUpload to accept an array of names
  const handleFileUpload = (processedFileNames: string[]) => {
    const newFiles: UploadedFile[] = processedFileNames.map(name => ({
        name: name,
        // Infer type based on extension or keep it generic? Let's keep track of original type if possible
        // For now, we might need to adjust the UploadedFile interface or how type is determined
        // Let's assume the API or DataUploader could pass back the type too, or infer from name
        type: name.includes('.') ? name.split('.').pop()!.toUpperCase() as any : 'Excel/CSV', // Simple type inference
        timestamp: new Date().toLocaleString(),
    }));

    setUploadedFiles(prev => {
        const updatedFiles = [...prev];
        newFiles.forEach(newFile => {
            const existingIndex = updatedFiles.findIndex(f => f.name === newFile.name);
            if (existingIndex !== -1) {
                updatedFiles[existingIndex] = newFile; // Replace if exists
            } else {
                updatedFiles.push(newFile); // Add if new
            }
        });
        return updatedFiles;
    });

    // Toast is now handled in DataUploader after API call
    // No navigation needed here anymore
  };

  return (
    <Layout>
      <div className="container mx-auto py-8 max-w-4xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-semibold">Setup your project</h1>
          <ThemeToggle />
        </div>
        
        <SampleDatasets onFileUpload={handleFileUpload} />
        <DataBoilerplates />
        <ExternalDataSources />
      </div>
    </Layout>
  );
};

export default DataSources;
