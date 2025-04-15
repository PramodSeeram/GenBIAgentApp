import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ModelHeader from '@/components/modeling/ModelHeader';
import ModelSidebar from '@/components/modeling/ModelSidebar';
import SchemaGrid from '@/components/modeling/SchemaGrid';
import { Button } from '@/components/ui/button';
import { Upload, FileType, Loader2, X, Search, Eye, MoreHorizontal, AlertCircle } from 'lucide-react';
import { schemaData, displayedSchemasList, modelsList, relationData } from '@/components/modeling/SchemaData';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';
import { Home, Table2, FileCheck2, FileType as FileIcon } from 'lucide-react';

interface UploadedFile {
  name: string;
  size: string;
  timestamp: string;
  status: 'success' | 'processing' | 'error';
  type: 'csv' | 'json' | 'sql' | 'xlsx' | 'unknown';
}

interface DataPreview {
  headers: string[];
  rows: string[][];
}

const ModelingPage = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('schema');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [dataPreview, setDataPreview] = useState<DataPreview | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([
    { name: 'sales_data.csv', size: '2.3 MB', timestamp: 'Today, 10:23 AM', status: 'success', type: 'csv' },
    { name: 'customer_schema.json', size: '156 KB', timestamp: 'Yesterday, 4:15 PM', status: 'success', type: 'json' },
    { name: 'product_inventory.xlsx', size: '1.8 MB', timestamp: 'Today, 11:45 AM', status: 'success', type: 'xlsx' },
    { name: 'marketing_campaigns.csv', size: '4.2 MB', timestamp: '2 days ago', status: 'success', type: 'csv' }
  ]);

  // Sample data preview
  const generateDataPreview = (fileName: string): DataPreview | null => {
    if (fileName === 'sales_data.csv') {
      return {
        headers: ['ID', 'Date', 'Product', 'Quantity', 'Price', 'Total'],
        rows: [
          ['1001', '2023-01-15', 'Laptop', '2', '$999.99', '$1,999.98'],
          ['1002', '2023-01-15', 'Mouse', '5', '$24.99', '$124.95'],
          ['1003', '2023-01-16', 'Monitor', '3', '$249.99', '$749.97'],
          ['1004', '2023-01-17', 'Keyboard', '4', '$49.99', '$199.96'],
          ['1005', '2023-01-18', 'Headphones', '6', '$79.99', '$479.94']
        ]
      };
    } else if (fileName === 'marketing_campaigns.csv') {
      return {
        headers: ['Campaign ID', 'Name', 'Start Date', 'End Date', 'Budget', 'ROI'],
        rows: [
          ['C001', 'Summer Sale', '2023-06-01', '2023-06-30', '$5,000', '245%'],
          ['C002', 'Back to School', '2023-08-15', '2023-09-15', '$8,000', '187%'],
          ['C003', 'Holiday Special', '2023-12-01', '2023-12-25', '$12,000', '320%'],
          ['C004', 'New Year Deal', '2024-01-01', '2024-01-15', '$4,000', '210%']
        ]
      };
    } else if (fileName === 'customer_schema.json') {
      return {
        headers: ['Field', 'Type', 'Required', 'Description'],
        rows: [
          ['id', 'string', 'true', 'Unique customer identifier'],
          ['name', 'object', 'true', 'Customer name object'],
          ['email', 'string', 'true', 'Customer email address'],
          ['phone', 'string', 'false', 'Customer phone number'],
          ['address', 'object', 'false', 'Customer address details']
        ]
      };
    } else if (fileName === 'product_inventory.xlsx') {
      return {
        headers: ['Product ID', 'Name', 'Category', 'Stock', 'Reorder Level', 'Supplier'],
        rows: [
          ['P001', 'Ultra Laptop', 'Electronics', '45', '10', 'TechSupplier Inc'],
          ['P002', 'Wireless Mouse', 'Accessories', '120', '30', 'AccessoriesRUs'],
          ['P003', '27" Monitor', 'Electronics', '28', '15', 'DisplayTech'],
          ['P004', 'Mechanical Keyboard', 'Accessories', '65', '20', 'KeyboardMasters'],
          ['P005', 'Noise-Canceling Headphones', 'Audio', '34', '15', 'SoundWave']
        ]
      };
    }
    return null;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const getFileTypeIcon = (fileType: string) => {
    switch (fileType) {
      case 'csv':
        return <FileType className="h-4 w-4 text-green-500" />;
      case 'json':
        return <FileType className="h-4 w-4 text-blue-500" />;
      case 'sql':
        return <FileType className="h-4 w-4 text-purple-500" />;
      case 'xlsx':
        return <FileType className="h-4 w-4 text-emerald-500" />;
      default:
        return <FileType className="h-4 w-4" />;
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    
    setIsUploading(true);
    
    // Simulate file processing
    setTimeout(() => {
      const newFiles: UploadedFile[] = Array.from(e.target.files || []).map(file => {
        const extension = file.name.split('.').pop()?.toLowerCase() || 'unknown';
        // Ensure type is one of the allowed types for UploadedFile
        let fileType: 'csv' | 'json' | 'sql' | 'xlsx' | 'unknown' = 'unknown';
        
        if (extension === 'csv') fileType = 'csv';
        else if (extension === 'json') fileType = 'json';
        else if (extension === 'sql') fileType = 'sql';
        else if (extension === 'xlsx') fileType = 'xlsx';
          
        return {
          name: file.name,
          size: formatFileSize(file.size),
          timestamp: 'Just now',
          status: 'success' as const,
          type: fileType
        };
      });
      
      setUploadedFiles(prev => [...newFiles, ...prev]);
      setIsUploading(false);
      
      toast.success(`${newFiles.length} ${newFiles.length === 1 ? 'file' : 'files'} uploaded`, {
        description: `Successfully uploaded ${newFiles.map(f => f.name).join(', ')}`
      });
    }, 1500);
  };

  const removeFile = (fileName: string) => {
    setUploadedFiles(prev => prev.filter(file => file.name !== fileName));
    if (selectedFile === fileName) {
      setSelectedFile(null);
      setDataPreview(null);
    }
    toast.info(`${fileName} removed`);
  };

  const handleFileSelect = (fileName: string) => {
    setSelectedFile(fileName);
    const preview = generateDataPreview(fileName);
    setDataPreview(preview);
  };

  return (
    <div className="flex h-screen flex-col bg-background text-foreground transition-colors duration-300">
      {/* Header */}
      <div className="flex justify-between items-center p-2 border-b border-border bg-card">
        <ModelHeader />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <label>
            <Button 
              variant="outline" 
              size="sm"
              className="flex items-center gap-1 hover:scale-105 transition-transform duration-200"
              disabled={isUploading}
            >
              {isUploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload size={16} />
              )}
              <span>Upload Schema</span>
              <input 
                type="file" 
                className="hidden" 
                accept=".json,.sql,.csv,.xlsx" 
                onChange={handleFileUpload}
                disabled={isUploading}
                multiple
              />
            </Button>
          </label>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel defaultSize={15} minSize={15}>
            <ModelSidebar models={modelsList} />
          </ResizablePanel>
          
          <ResizableHandle withHandle />
          
          <ResizablePanel defaultSize={85}>
            <div className="h-full flex flex-col bg-background">
              <div className="p-2 border-b border-border flex items-center">
                <div className="flex items-center space-x-4 px-2">
                  <Button 
                    variant={activeTab === 'schema' ? 'secondary' : 'ghost'} 
                    onClick={() => setActiveTab('schema')}
                    className="font-medium"
                  >
                    Schema Design
                  </Button>
                  <Button 
                    variant={activeTab === 'uploaded' ? 'secondary' : 'ghost'} 
                    onClick={() => setActiveTab('uploaded')}
                    className="font-medium"
                  >
                    Uploaded Files & Data Sources
                  </Button>
                </div>
              </div>
              
              {activeTab === 'schema' && (
                <div className="flex-1">
                  <SchemaGrid 
                    schemas={schemaData} 
                    displayedSchemas={displayedSchemasList} 
                    relations={relationData}
                  />
                </div>
              )}
              
              {activeTab === 'uploaded' && (
                <div className="p-4 flex-1 overflow-auto">
                  <Card className="col-span-1 animate-fade-in">
                    <CardHeader className="py-3 px-4">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <FileType className="h-4 w-4" />
                          Data Files ({uploadedFiles.length})
                        </CardTitle>
                        <div className="flex gap-2">
                          <Button variant="outline" size="icon" className="h-7 w-7">
                            <Search className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="icon" className="h-7 w-7">
                            <Upload className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="py-0 px-0 h-[calc(100%-56px)] overflow-y-auto">
                      {uploadedFiles.length > 0 ? (
                        <div className="space-y-1">
                          {uploadedFiles.map((file, index) => (
                            <div 
                              key={index} 
                              className={cn(
                                "flex items-center justify-between p-3 transition-colors cursor-pointer",
                                selectedFile === file.name 
                                  ? "bg-primary/10 border-r-2 border-primary" 
                                  : "hover:bg-accent/30",
                              )}
                              onClick={() => handleFileSelect(file.name)}
                            >
                              <div className="flex items-center gap-3 overflow-hidden">
                                {getFileTypeIcon(file.type)}
                                <div className="flex flex-col overflow-hidden">
                                  <span className="text-sm font-medium truncate">{file.name}</span>
                                  <div className="flex gap-2 text-xs text-muted-foreground">
                                    <span>{file.size}</span>
                                    <span>•</span>
                                    <span>{file.timestamp}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center">
                                {file.status === 'processing' ? (
                                  <Loader2 className="h-4 w-4 animate-spin text-amber-500" />
                                ) : file.status === 'error' ? (
                                  <AlertCircle className="h-4 w-4 text-red-500" />
                                ) : (
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-7 w-7">
                                        <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => handleFileSelect(file.name)}>
                                        <Eye className="h-4 w-4 mr-2" />
                                        Preview
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => removeFile(file.name)}>
                                        <X className="h-4 w-4 mr-2" />
                                        Remove
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <p>No files uploaded yet</p>
                          <p className="text-sm mt-1">Upload schema files to get started</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
};

export default ModelingPage;
