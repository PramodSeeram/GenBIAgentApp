
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import DataSourceCard from './DataSourceCard';
import DataSourceModal from './DataSourceModal';
import { 
  BigQueryIcon, 
  PostgreSQLIcon, 
  MySQLIcon, 
  SQLServerIcon, 
  ClickHouseIcon, 
  TrinoIcon, 
  SnowflakeIcon 
} from './icons/DataSourceIcons';

type DataSourceType = 'PDF' | 'Excel/CSV' | 'Word' | 'PowerPoint' | 
                     'BigQuery' | 'PostgreSQL' | 'MySQL' | 'SQLServer' | 
                     'ClickHouse' | 'Trino' | 'Snowflake';

const ExternalDataSources = () => {
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
    <section className="mb-8 animate-fade-in">
      <h2 className="text-xl font-medium mb-2">Connect an external data source</h2>
      <p className="text-muted-foreground mb-4">
        <Link to="#" className="text-primary hover:underline">Contact Us</Link> to suggest new data sources.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <DataSourceCard onClick={() => handleCardClick('BigQuery')}>
          <BigQueryIcon className="mr-2 h-5 w-5" />
          <span>BigQuery</span>
        </DataSourceCard>
        
        <DataSourceCard onClick={() => handleCardClick('PostgreSQL')}>
          <PostgreSQLIcon className="mr-2 h-5 w-5" />
          <span>PostgreSQL</span>
        </DataSourceCard>
        
        <DataSourceCard onClick={() => handleCardClick('MySQL')}>
          <MySQLIcon className="mr-2 h-5 w-5" />
          <span>MySQL</span>
        </DataSourceCard>
        
        <DataSourceCard onClick={() => handleCardClick('SQLServer')}>
          <SQLServerIcon className="mr-2 h-5 w-5" />
          <span>SQL Server</span>
        </DataSourceCard>
        
        <DataSourceCard onClick={() => handleCardClick('ClickHouse')}>
          <ClickHouseIcon className="mr-2 h-5 w-5" />
          <span>ClickHouse</span>
        </DataSourceCard>
        
        <DataSourceCard onClick={() => handleCardClick('Trino')}>
          <TrinoIcon className="mr-2 h-5 w-5" />
          <span>Trino</span>
        </DataSourceCard>
        
        <DataSourceCard onClick={() => handleCardClick('Snowflake')}>
          <SnowflakeIcon className="mr-2 h-5 w-5" />
          <span>Snowflake</span>
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

export default ExternalDataSources;
