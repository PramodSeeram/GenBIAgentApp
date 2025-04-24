import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';

interface PreviewContentProps {
  data: any;
  onBack: () => void;
  sourceType: string | null;
  fileName?: string;
}

const PreviewContent: React.FC<PreviewContentProps> = ({ 
  data, 
  onBack, 
  sourceType,
  fileName = 'File'
}) => {
  
  // Function to render the preview content based on data format
  const renderContent = () => {
    if (!data || !data.files || data.files.length === 0) {
      return (
        <div className="text-center py-10">
          <p className="text-muted-foreground">No preview data available</p>
        </div>
      );
    }

    const fileData = data.files[0];
    
    if (fileData.status !== 'success' || !fileData.preview) {
      return (
        <div className="text-center py-10 text-red-500">
          <p>Error: {fileData.error || 'Failed to generate preview'}</p>
        </div>
      );
    }

    // Handle Excel/CSV preview (tabular data)
    if (sourceType === 'Excel/CSV') {
      return renderTabularData(fileData.preview);
    }
    
    // Handle text-based preview (PDF, Word, etc.)
    return renderTextData(fileData.preview);
  };

  // Render tabular data (for CSV/Excel)
  const renderTabularData = (preview: any[]) => {
    if (!Array.isArray(preview) || preview.length === 0) {
      return <p className="text-muted-foreground">No data available</p>;
    }

    // For CSV/Excel files, the preview might contain rows directly,
    // or it might have content with rows
    const rows = preview[0].content && Array.isArray(preview[0].content) 
      ? preview[0].content 
      : preview;

    if (!rows || rows.length === 0) {
      return <p className="text-muted-foreground">No rows available</p>;
    }

    // Get headers from the first row
    const firstRow = rows[0];
    const headers = Object.keys(firstRow);

    return (
      <div className="border rounded-md">
        <ScrollArea className="h-[400px]">
          <Table>
            <TableHeader>
              <TableRow>
                {headers.map((header, index) => (
                  <TableHead key={index} className="font-medium">{header}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.slice(0, 100).map((row: any, rowIndex: number) => (
                <TableRow key={rowIndex}>
                  {headers.map((header, cellIndex) => (
                    <TableCell key={`${rowIndex}-${cellIndex}`}>
                      {row[header]?.toString() || ''}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>
    );
  };

  // Render text-based data (for PDF, Word, etc.)
  const renderTextData = (preview: any[]) => {
    if (!Array.isArray(preview) || preview.length === 0) {
      return <p className="text-muted-foreground">No text content available</p>;
    }

    return (
      <div className="border rounded-md">
        <ScrollArea className="h-[400px] p-4">
          {preview.map((chunk, index) => (
            <div key={index} className="mb-4 pb-4 border-b last:border-b-0">
              <p className="whitespace-pre-wrap">{chunk.content}</p>
              {chunk.metadata && Object.keys(chunk.metadata).length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-muted-foreground font-medium">Metadata:</p>
                  <pre className="text-xs bg-muted p-2 mt-1 rounded overflow-x-auto">
                    {JSON.stringify(chunk.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </ScrollArea>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onBack}
          className="flex items-center gap-1"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div className="text-sm text-muted-foreground">
          Previewing: <span className="font-medium">{fileName}</span>
        </div>
      </div>

      {renderContent()}
    </div>
  );
};

export default PreviewContent; 