import React, { useState } from 'react';
import DataSourceCard from './DataSourceCard';
import DataSourceModal from './DataSourceModal';
import { FileText, FileSpreadsheet, File, Presentation } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

type DataSourceType = 'PDF' | 'Excel/CSV' | 'Word' | 'PowerPoint' | 
                     'BigQuery' | 'PostgreSQL' | 'MySQL' | 'SQLServer' | 
                     'ClickHouse' | 'Trino' | 'Snowflake';

export interface UploadedFile {
  name: string;
  type: DataSourceType;
  timestamp: string;
}

interface SampleDatasetsProps {
  onFileUpload?: (files: string[]) => void;
}

const SampleDatasets = ({ onFileUpload }: SampleDatasetsProps) => {
  const [activeSource, setActiveSource] = useState<DataSourceType | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();
  
  const handleCardClick = (source: DataSourceType) => {
    setActiveSource(source);
    setIsModalOpen(true);
  };
  
  const closeModal = () => {
    setIsModalOpen(false);
    setActiveSource(null);
  };

  const handleUploadSuccess = (fileName: string, sourceType: DataSourceType) => {
    console.log(`Upload success: ${fileName} (${sourceType})`);
    
    // Save to local storage for persistence
    try {
      const newFile: UploadedFile = {
        name: fileName,
        type: sourceType,
        timestamp: new Date().toLocaleString()
      };
      
      const savedFiles = localStorage.getItem('chat4ba_uploaded_files');
      const existingFiles: UploadedFile[] = savedFiles ? JSON.parse(savedFiles) : [];
      const updatedFiles = [...existingFiles, newFile];
      localStorage.setItem('chat4ba_uploaded_files', JSON.stringify(updatedFiles));
      
      // Notify parent component
      if (onFileUpload) {
        onFileUpload([fileName]);
      }
      
      // Show success message
      toast({
        title: "File uploaded successfully",
        description: `${fileName} has been processed and is ready for analysis.`,
      });
      
      // Navigate to modeling page
      setTimeout(() => {
        navigate('/modeling');
      }, 1000);
    } catch (error) {
      console.error('Error saving file data:', error);
    }
  };

  return (
    <section className="mb-12 animate-fade-in">
      <h2 className="text-xl font-medium mb-2">Start with a sample dataset</h2>
      <p className="text-muted-foreground mb-4">
        Choose a document type to quickly start gaining insights.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <DataSourceCard onClick={() => handleCardClick('PDF')}>
          <FileText className="mr-2 h-5 w-5" />
          <span>PDF</span>
        </DataSourceCard>
        
        <DataSourceCard onClick={() => handleCardClick('Excel/CSV')}>
          <FileSpreadsheet className="mr-2 h-5 w-5" />
          <span>Excel/CSV</span>
        </DataSourceCard>
        
        <DataSourceCard onClick={() => handleCardClick('Word')}>
          <File className="mr-2 h-5 w-5" />
          <span>Word</span>
        </DataSourceCard>
        
        <DataSourceCard onClick={() => handleCardClick('PowerPoint')}>
          <Presentation className="mr-2 h-5 w-5" />
          <span>PowerPoint</span>
        </DataSourceCard>
      </div>
      
      <DataSourceModal
        isOpen={isModalOpen}
        onClose={closeModal}
        sourceType={activeSource}
        onUploadSuccess={handleUploadSuccess}
      />
    </section>
  );
};

export default SampleDatasets;
