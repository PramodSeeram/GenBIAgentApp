
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import DataUploader from './DataUploader';
import DatabaseConnector from './DatabaseConnector';
import { FileText, FileSpreadsheet, File, Presentation } from 'lucide-react';
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

interface DataSourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceType: DataSourceType | null;
}

export default function DataSourceModal({ 
  isOpen, 
  onClose, 
  sourceType 
}: DataSourceModalProps) {
  // Map file types to their acceptance patterns
  const fileTypeToAccept: Record<string, string> = {
    'PDF': '.pdf',
    'Excel/CSV': '.csv,.xls,.xlsx',
    'Word': '.doc,.docx',
    'PowerPoint': '.ppt,.pptx',
  };
  
  // Get the appropriate icon for file types
  const getFileTypeIcon = (type: string) => {
    switch(type) {
      case 'PDF':
        return <FileText className="h-6 w-6" />;
      case 'Excel/CSV':
        return <FileSpreadsheet className="h-6 w-6" />;
      case 'Word':
        return <File className="h-6 w-6" />;
      case 'PowerPoint':
        return <Presentation className="h-6 w-6" />;
      default:
        return null;
    }
  };
  
  // Get the appropriate icon for database types
  const getDatabaseIcon = (type: string) => {
    switch(type) {
      case 'BigQuery':
        return <BigQueryIcon className="h-6 w-6" />;
      case 'PostgreSQL':
        return <PostgreSQLIcon className="h-6 w-6" />;
      case 'MySQL':
        return <MySQLIcon className="h-6 w-6" />;
      case 'SQLServer':
        return <SQLServerIcon className="h-6 w-6" />;
      case 'ClickHouse':
        return <ClickHouseIcon className="h-6 w-6" />;
      case 'Trino':
        return <TrinoIcon className="h-6 w-6" />;
      case 'Snowflake':
        return <SnowflakeIcon className="h-6 w-6" />;
      default:
        return null;
    }
  };
  
  // Determine if this is a file upload or database connection
  const isFileUpload = sourceType === 'PDF' || sourceType === 'Excel/CSV' || 
                       sourceType === 'Word' || sourceType === 'PowerPoint';

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] animate-enter">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isFileUpload && sourceType && getFileTypeIcon(sourceType)}
            {!isFileUpload && sourceType && getDatabaseIcon(sourceType)}
            {sourceType}
          </DialogTitle>
        </DialogHeader>
        
        {isFileUpload && sourceType && (
          <DataUploader 
            fileType={sourceType} 
            accept={fileTypeToAccept[sourceType] || ''}
            maxSize={50} 
          />
        )}
        
        {!isFileUpload && sourceType && (
          <DatabaseConnector 
            databaseType={sourceType} 
            icon={getDatabaseIcon(sourceType)} 
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
