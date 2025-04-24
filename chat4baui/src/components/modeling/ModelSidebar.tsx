import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, ChevronDown, Settings, Database, FileType } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

interface DisplayedFile {
  name: string;
  timestamp: string;
  size?: string;
  status: 'success' | 'processing' | 'error';
  extension: string;
}

interface ModelSidebarProps {
  models: Array<{ id: number; name: string }>;
  uploadedFiles?: DisplayedFile[];
  onFileClick?: (fileName: string) => void;
}

const ModelSidebar: React.FC<ModelSidebarProps> = ({ models, uploadedFiles = [], onFileClick }) => {
  const getFileTypeIcon = (fileExtension: string) => {
    switch (fileExtension.toLowerCase()) {
      case 'csv':
      case 'excel/csv':
        return <FileType className="h-4 w-4 text-green-500" />;
      case 'json':
        return <FileType className="h-4 w-4 text-blue-500" />;
      case 'pdf':
        return <FileType className="h-4 w-4 text-red-500" />;
      case 'xlsx':
      case 'xls':
        return <FileType className="h-4 w-4 text-emerald-500" />;
      case 'word':
      case 'doc':
      case 'docx':
        return <FileType className="h-4 w-4 text-blue-700" />;
      case 'powerpoint':
      case 'ppt':
      case 'pptx':
        return <FileType className="h-4 w-4 text-orange-500" />;
      default:
        return <FileType className="h-4 w-4" />;
    }
  };

  return (
    <aside className="bg-card h-full w-64 border-r border-border flex flex-col">
      <div className="p-4 flex-1 overflow-hidden flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <h2 className="font-medium">Models</h2>
            <span className="ml-2 bg-muted text-muted-foreground text-xs rounded-full px-2 py-0.5">{models.length}</span>
          </div>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <Plus className="h-4 w-4" />
            <span className="sr-only">New</span>
          </Button>
        </div>
        
        <ScrollArea className="flex-1">
          <div className="space-y-1">
            {models.map(model => (
              <div key={model.id}>
                <div className={cn(
                  "flex items-center px-2 py-1.5 text-sm rounded-md cursor-pointer transition-colors",
                  model.id === 1 ? "bg-primary/10" : "hover:bg-muted"
                )}>
                  <ChevronDown className="h-4 w-4 mr-1 flex-shrink-0" />
                  <span className="flex-grow overflow-hidden overflow-ellipsis whitespace-nowrap">
                    {model.name}
                  </span>
                </div>
              </div>
            ))}
          </div>
          
          {uploadedFiles.length > 0 && (
            <>
              <Separator className="my-4" />
              
              <div className="mb-2">
                <div className="flex items-center px-2">
                  <h2 className="font-medium text-sm">Data Files</h2>
                  <span className="ml-2 bg-muted text-muted-foreground text-xs rounded-full px-2 py-0.5">
                    {uploadedFiles.length}
                  </span>
                </div>
              </div>
              
              <div className="space-y-1">
                {uploadedFiles.map((file, index) => (
                  <div 
                    key={file.name + index}
                    className="flex items-center px-2 py-1.5 text-sm rounded-md cursor-pointer hover:bg-muted animate-fade-in transition-colors"
                    style={{ animationDelay: `${index * 50}ms` }}
                    onClick={() => onFileClick?.(file.name)}
                  >
                    {getFileTypeIcon(file.extension)}
                    <span className="ml-2 flex-grow overflow-hidden overflow-ellipsis whitespace-nowrap">
                      {file.name}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </ScrollArea>
      </div>
      
      {/* Settings */}
      <div className="p-4 border-t border-border">
        <Button variant="ghost" className="w-full justify-start">
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </Button>
      </div>
    </aside>
  );
};

export default ModelSidebar;
