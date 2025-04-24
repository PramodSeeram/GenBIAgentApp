import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface PreviewData {
  content: string | any[];
  metadata: Record<string, any>;
}

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: PreviewData[] | null;
  fileName: string;
}

const PreviewModal: React.FC<PreviewModalProps> = ({
  isOpen,
  onClose,
  data,
  fileName,
}) => {
  if (!data) return null;

  const renderContent = (content: string | any[]) => {
    if (Array.isArray(content)) {
      // Render tabular data
      if (content.length === 0) return <p>No data available</p>;
      
      const headers = Object.keys(content[0]);
      
      return (
        <Table>
          <TableHeader>
            <TableRow>
              {headers.map((header, index) => (
                <TableHead key={index}>{header}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {content.slice(0, 100).map((row, rowIndex) => (
              <TableRow key={rowIndex}>
                {headers.map((header, colIndex) => (
                  <TableCell key={`${rowIndex}-${colIndex}`}>
                    {row[header]?.toString() || ''}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      );
    } else {
      // Render text content
      return (
        <pre className="whitespace-pre-wrap font-mono text-sm">
          {content}
        </pre>
      );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-4xl h-[80vh]">
        <DialogHeader>
          <DialogTitle>Preview: {fileName}</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="flex-1 p-4 rounded-md border">
          {data.map((item, index) => (
            <div key={index} className="space-y-4">
              {renderContent(item.content)}
            </div>
          ))}
        </ScrollArea>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PreviewModal; 