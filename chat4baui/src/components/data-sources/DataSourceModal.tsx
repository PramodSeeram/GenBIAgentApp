import React, { useState } from 'react';
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
import { Button } from '@/components/ui/button';
import PreviewContent from './PreviewContent';
import { toast } from '@/hooks/use-toast';
import { previewFiles } from '@/services/api';

type DataSourceType = 'PDF' | 'Excel/CSV' | 'Word' | 'PowerPoint' | 
                     'BigQuery' | 'PostgreSQL' | 'MySQL' | 'SQLServer' | 
                     'ClickHouse' | 'Trino' | 'Snowflake';

interface DataSourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceType: DataSourceType | null;
  onUploadSuccess?: (fileName: string, sourceType: DataSourceType) => void;
}

export default function DataSourceModal({ 
  isOpen, 
  onClose, 
  sourceType,
  onUploadSuccess
}: DataSourceModalProps) {
  const [previewMode, setPreviewMode] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewData, setPreviewData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

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

  // Handle files selection before upload
  const handleFilesSelected = (files: File[]) => {
    setSelectedFiles(files);
  };

  // Handle preview request
  const handlePreview = async () => {
    if (selectedFiles.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select files to preview first",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await previewFiles(selectedFiles);
      setPreviewData(response);
      setPreviewMode(true);
      toast({
        title: "Preview generated",
        description: "Successfully generated preview for the selected files"
      });
    } catch (error) {
      toast({
        title: "Preview failed",
        description: error instanceof Error ? error.message : "Could not generate preview",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle back from preview mode
  const handleBackFromPreview = () => {
    setPreviewMode(false);
    setPreviewData(null);
  };

  // Handle successful file upload
  const handleUploadSuccess = (fileName: string) => {
    if (sourceType && onUploadSuccess) {
      onUploadSuccess(fileName, sourceType);
      toast({
        title: "Upload successful",
        description: `Successfully uploaded ${fileName}`
      });
      onClose();
    }
  };

  // Handle modal close - reset state
  const handleClose = () => {
    setPreviewMode(false);
    setSelectedFiles([]);
    setPreviewData(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && handleClose()}>
      <DialogContent className="sm:max-w-[700px] animate-enter">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isFileUpload && sourceType && getFileTypeIcon(sourceType)}
            {!isFileUpload && sourceType && getDatabaseIcon(sourceType)}
            {previewMode ? `Preview ${sourceType} Data` : sourceType}
          </DialogTitle>
        </DialogHeader>
        
        {previewMode ? (
          <PreviewContent 
            data={previewData} 
            onBack={handleBackFromPreview}
            sourceType={sourceType}
            fileName={selectedFiles[0]?.name}
          />
        ) : isFileUpload && sourceType ? (
          <DataUploader 
            fileType={sourceType} 
            accept={fileTypeToAccept[sourceType] || ''}
            maxSize={50}
            onUploadSuccess={handleUploadSuccess}
            onFilesSelected={handleFilesSelected}
            onPreviewRequest={handlePreview}
            isLoading={isLoading}
          />
        ) : !isFileUpload && sourceType ? (
          <DatabaseConnector 
            databaseType={sourceType} 
            icon={getDatabaseIcon(sourceType)} 
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
