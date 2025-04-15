
import React, { useState } from 'react';
import DataSourceCard from './DataSourceCard';
import DataSourceModal from './DataSourceModal';
import { FileText, FileSpreadsheet, File, Presentation } from 'lucide-react';

type DataSourceType = 'PDF' | 'Excel/CSV' | 'Word' | 'PowerPoint' | 
                     'BigQuery' | 'PostgreSQL' | 'MySQL' | 'SQLServer' | 
                     'ClickHouse' | 'Trino' | 'Snowflake';

const SampleDatasets = () => {
  const [activeSource, setActiveSource] = useState<DataSourceType | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const handleCardClick = (source: DataSourceType) => {
    setActiveSource(source);
    setIsModalOpen(true);
  };
  
  const closeModal = () => {
    setIsModalOpen(false);
    setActiveSource(null);
  };

  return (
    <section className="mb-12 animate-fade-in">
      <h2 className="text-xl font-medium mb-2">Start with a sample dataset</h2>
      <p className="text-muted-foreground mb-4">
        At Chat4BA, we offer sample datasets for a quick hands-on experience. Choose a document type to quickly start gaining insights.
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
      />
    </section>
  );
};

export default SampleDatasets;
