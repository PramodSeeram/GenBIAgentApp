import React, { useState, useEffect } from 'react';
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
import { UploadedFile } from '@/components/data-sources/SampleDatasets';
import { previewFiles, processFiles, getExtractedData } from '@/services/api';

const STORAGE_KEY = 'chat4ba_uploaded_files';

interface DisplayedFile extends UploadedFile {
  size?: string;
  status: 'success' | 'processing' | 'error';
  extension: string;
}

interface DataPreview {
  headers: string[];
  rows: string[][];
}

interface FilePreviewData {
  content: string;
  metadata: Record<string, any>;
}

interface ApiPreviewResponse {
  files: {
    filename: string;
    preview: FilePreviewData[];
    status: 'success' | 'error';
    error?: string;
  }[];
}

interface ExtractedDataResponse {
  success: boolean;
  files: {
    fileName: string;
    content: Record<string, any>[];
    metadata: {
      rows: number;
      columns: number;
    };
  }[];
}

const ModelingPage = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('schema');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [dataPreview, setDataPreview] = useState<DataPreview | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<DisplayedFile[]>([]);
  const [selectedFilePreview, setSelectedFilePreview] = useState<FilePreviewData[] | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedDataResponse | null>(null);
  const [isLoadingExtractedData, setIsLoadingExtractedData] = useState(false);

  // Load uploaded files from localStorage
  useEffect(() => {
    loadUploadedFiles();
    fetchExtractedData();
  }, []);

  const loadUploadedFiles = () => {
    const savedFiles = localStorage.getItem(STORAGE_KEY);
    if (savedFiles) {
      try {
        const files: UploadedFile[] = JSON.parse(savedFiles);
        const transformedFiles: DisplayedFile[] = files.map(file => {
          const nameParts = file.name.split('.');
          const extension = nameParts.length > 1 ? nameParts[nameParts.length - 1].toLowerCase() : 'unknown';
          return {
            ...file,
            status: 'success',
            extension
          };
        });
        setUploadedFiles(transformedFiles);
      } catch (error) {
        console.error('Error parsing saved files:', error);
        toast.error('Error loading your files');
      }
    }
  };

  const fetchExtractedData = async () => {
    setIsLoadingExtractedData(true);
    try {
      const data = await getExtractedData();
      setExtractedData(data);
    } catch (error) {
      console.error('Error fetching extracted data:', error);
    } finally {
      setIsLoadingExtractedData(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    
    setIsUploading(true);
    
    try {
      const files: File[] = Array.from(fileList);
      toast.info(`Processing ${files.length} files...`, {
        className: "animate-slide-in-right",
      });
      
      // Process files
      const response = await processFiles(files);
      
      if (response.success) {
        // Update local state
        const newFiles: DisplayedFile[] = files.map(file => {
          const nameParts = file.name.split('.');
          const extension = nameParts.length > 1 ? nameParts[nameParts.length - 1].toLowerCase() : 'unknown';
          const timestamp = new Date().toLocaleString();
          return {
            name: file.name,
            size: formatFileSize(file.size),
            timestamp,
            status: 'success',
            extension
          };
        });
        
        // Save to state and localStorage - ensure we're not overwriting existing files
        const savedFiles = localStorage.getItem(STORAGE_KEY);
        const existingFiles: UploadedFile[] = savedFiles ? JSON.parse(savedFiles) : [];
        
        // Filter out any duplicates by name
        const uniqueExistingFiles = existingFiles.filter(
          existing => !newFiles.some(newFile => newFile.name === existing.name)
        );
        
        const updatedFiles = [...uniqueExistingFiles, ...newFiles.map(file => ({
          name: file.name,
          timestamp: file.timestamp
        }))];
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedFiles));
        
        // Update state with all files
        setUploadedFiles(prev => {
          const filteredPrev = prev.filter(
            existing => !newFiles.some(newFile => newFile.name === existing.name)
          );
          return [...filteredPrev, ...newFiles];
        });
        
        toast.success(`${files.length} files processed successfully`, {
          className: "animate-slide-in-right",
        });
        setActiveTab('uploaded');
        
        // Refresh extracted data
        fetchExtractedData();
      } else {
        throw new Error('File processing failed');
      }
    } catch (error) {
      console.error('Error uploading files:', error);
      toast.error('Failed to process files', {
        description: error instanceof Error ? error.message : 'Unknown error',
        className: "animate-slide-in-right",
      });
    } finally {
      setIsUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  const fetchFilePreview = async (fileName: string) => {
    setSelectedFile(fileName);
    setSelectedFilePreview(null);
    setIsPreviewLoading(true);
    
    try {
      // For Excel files, try to get the extracted data first
      const nameParts = fileName.split('.');
      const extension = nameParts.length > 1 ? nameParts[nameParts.length - 1].toLowerCase() : '';
      
      if (['xlsx', 'xls', 'csv'].includes(extension) && extractedData) {
        // Try to find this file in the extracted data
        const fileData = extractedData.files.find(f => f.fileName === fileName);
        if (fileData) {
          // Convert to the format expected by the preview
          const tablePreview: FilePreviewData = {
            content: `${fileName} (${fileData.metadata.rows} rows, ${fileData.metadata.columns} columns)`,
            metadata: {
              table: true,
              headers: Object.keys(fileData.content[0] || {}),
              rows: fileData.content
            }
          };
          setSelectedFilePreview([tablePreview]);
          setIsPreviewLoading(false);
          return;
        }
      }
      
      // Fall back to regular preview
      const dummyFile = new File(["\"\""], fileName);
      const response: ApiPreviewResponse = await previewFiles([dummyFile]);

      if (response.files && response.files.length > 0 && response.files[0].status === 'success') {
        setSelectedFilePreview(response.files[0].preview);
      } else {
        const errorMsg = response.files?.[0]?.error || 'Could not load preview';
        throw new Error(errorMsg);
      }
    } catch (error) {
      console.error('Error fetching file preview:', error);
      toast.error('Failed to load preview', {
        description: error instanceof Error ? error.message : 'Unknown error',
        className: "animate-fade-in",
      });
      setSelectedFilePreview(null);
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const removeFile = (fileName: string) => {
    const updatedStateFiles = uploadedFiles.filter(file => file.name !== fileName);
    setUploadedFiles(updatedStateFiles);
    
    const savedFiles = localStorage.getItem(STORAGE_KEY);
    if (savedFiles) {
      try {
        const files: UploadedFile[] = JSON.parse(savedFiles);
        const updatedStorageFiles = files.filter(file => file.name !== fileName);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedStorageFiles));
      } catch (error) {
        console.error('Error updating saved files:', error);
        toast.error('Failed to update stored file list');
      }
    }
    
    if (selectedFile === fileName) {
      setSelectedFile(null);
      setSelectedFilePreview(null);
    }
    
    toast.info(`${fileName} removed`, {
      className: "animate-fade-out",
    });
  };

  const handleFileSelect = (fileName: string) => {
    setSelectedFile(fileName);
    const preview = generateDataPreview(fileName);
    setDataPreview(preview);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

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
    
    // Try to find in extracted data
    if (extractedData) {
      const fileData = extractedData.files.find(f => f.fileName === fileName);
      if (fileData && fileData.content.length > 0) {
        const headers = Object.keys(fileData.content[0]);
        const rows = fileData.content.map(row => 
          headers.map(header => String(row[header] || ''))
        );
        return { headers, rows };
      }
    }
    
    return null;
  };

  // Get data for SchemaGrid from extracted files
  const getSchemaFromExtractedData = () => {
    if (!extractedData) return [];
    
    return extractedData.files.map(file => {
      const headers = file.content.length > 0 ? Object.keys(file.content[0]) : [];
        return {
        name: file.fileName,
        fields: headers.map(header => ({
          name: header,
          type: 'string',
          required: false
        }))
        };
      });
  };

  return (
    <div className="flex h-screen flex-col bg-background text-foreground transition-colors duration-300">
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
                accept=".json,.sql,.csv,.xlsx,.pdf,.doc,.docx,.ppt,.pptx" 
                onChange={handleFileUpload}
                disabled={isUploading}
                multiple
              />
            </Button>
          </label>
        </div>
      </div>
      
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel defaultSize={15} minSize={15}>
            <ModelSidebar 
              models={modelsList} 
              uploadedFiles={uploadedFiles} 
              onFileClick={(fileName) => {
                if (activeTab === 'schema') {
                  handleFileSelect(fileName);
                } else {
                  fetchFilePreview(fileName);
                }
              }}
            />
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
                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
                  <div className="col-span-1 md:col-span-3">
                  <SchemaGrid 
                      schemas={schemaData.concat(getSchemaFromExtractedData())} 
                      displayedSchemas={displayedSchemasList.concat(uploadedFiles.map(f => f.name))} 
                    relations={relationData}
                      onSchemaClick={handleFileSelect}
                    />
                  </div>
                  
                  {selectedFile && dataPreview && (
                    <Card className="col-span-1 md:col-span-3 animate-fade-in">
                      <CardHeader className="py-3 px-4 border-b">
                        <CardTitle className="text-base font-medium flex items-center gap-2">
                          <Eye className="h-5 w-5" />
                          Preview: {selectedFile}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                {dataPreview.headers.map((header, i) => (
                                  <TableHead key={i} className="font-medium">{header}</TableHead>
                                ))}
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {dataPreview.rows.map((row, i) => (
                                <TableRow key={i} className="hover:bg-muted/50 animate-fade-in" style={{animationDelay: `${i * 50}ms`}}>
                                  {row.map((cell, j) => (
                                    <TableCell key={j}>{cell}</TableCell>
                                  ))}
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
              
              {activeTab === 'uploaded' && (
                <div className="p-4 flex-1 overflow-auto grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="col-span-1 animate-fade-in h-full flex flex-col">
                    <CardHeader className="py-3 px-4 border-b">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base font-medium flex items-center gap-2">
                          <FileCheck2 className="h-5 w-5" />
                          Data Files ({uploadedFiles.length})
                        </CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="py-0 px-0 flex-1 overflow-y-auto">
                      {uploadedFiles.length > 0 ? (
                        <div className="space-y-0">
                          {uploadedFiles.map((file, index) => (
                            <div 
                              key={file.name + index}
                              className={cn(
                                "flex items-center justify-between p-3 border-b last:border-b-0 transition-colors cursor-pointer animate-fade-in",
                                selectedFile === file.name 
                                  ? "bg-primary/10 border-l-4 border-l-primary" 
                                  : "hover:bg-accent/30",
                              )}
                              style={{animationDelay: `${index * 50}ms`}}
                              onClick={() => fetchFilePreview(file.name)}
                            >
                              <div className="flex items-center gap-3 overflow-hidden flex-1">
                                {getFileTypeIcon(file.extension)}
                                <div className="flex flex-col overflow-hidden">
                                  <span className="text-sm font-medium truncate">{file.name}</span>
                                  <span className="text-xs text-muted-foreground">{file.timestamp}</span>
                                </div>
                              </div>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-7 w-7 ml-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                                        <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); fetchFilePreview(file.name); }}>
                                        <Eye className="h-4 w-4 mr-2" />
                                        Preview
                                      </DropdownMenuItem>
                                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); removeFile(file.name); }}>
                                        <X className="h-4 w-4 mr-2" />
                                        Remove
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground flex flex-col items-center justify-center h-full">
                          <FileCheck2 className="h-12 w-12 mb-4 text-gray-400" />
                          <p className="font-medium">No files processed yet</p>
                          <p className="text-sm mt-1">Upload files from the Data Sources page.</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  
                  <Card className="col-span-1 md:col-span-2 animate-fade-in h-full flex flex-col">
                    <CardHeader className="py-3 px-4 border-b">
                      <CardTitle className="text-base font-medium flex items-center gap-2">
                        <Eye className="h-5 w-5" />
                        {selectedFile ? `Preview: ${selectedFile}` : 'Select a file to preview'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-auto p-4">
                      {isPreviewLoading ? (
                        <div className="flex items-center justify-center h-full">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                      ) : selectedFilePreview ? (
                        <div className="space-y-4">
                          {selectedFilePreview.map((chunk, idx) => (
                            <div key={idx} className="mb-4 pb-4 border-b last:border-0 animate-fade-in" style={{animationDelay: `${idx * 100}ms`}}>
                              {chunk.metadata?.table ? (
                                <div className="overflow-x-auto">
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        {chunk.metadata.headers.map((header, i) => (
                                          <TableHead key={i} className="font-medium">{header}</TableHead>
                                        ))}
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {chunk.metadata.rows.slice(0, 20).map((row, i) => (
                                        <TableRow key={i} className="hover:bg-muted/50 animate-fade-in" style={{animationDelay: `${i * 50}ms`}}>
                                          {chunk.metadata.headers.map((header, j) => (
                                            <TableCell key={j}>{row[header]}</TableCell>
                                          ))}
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                  {chunk.metadata.rows.length > 20 && (
                                    <p className="text-center text-sm text-muted-foreground mt-2">
                                      Showing 20 of {chunk.metadata.rows.length} rows
                                    </p>
                                )}
                              </div>
                              ) : (
                                <>
                                  <p className="whitespace-pre-wrap text-sm">{chunk.content}</p>
                                  {chunk.metadata && Object.keys(chunk.metadata).length > 0 && (
                                    <div className="mt-2 text-xs text-muted-foreground">
                                      <strong>Metadata:</strong>
                                      <pre className="text-xs bg-muted/50 p-2 rounded mt-1">{JSON.stringify(chunk.metadata, null, 2)}</pre>
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground flex flex-col items-center justify-center h-full">
                          <Eye className="h-12 w-12 mb-4 text-gray-400" />
                          <p className="font-medium">
                            {selectedFile ? 'No preview available for this file.' : 'Select a file from the list to see its preview.'}
                          </p>
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
