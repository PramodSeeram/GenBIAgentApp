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
import axios from 'axios';

// Import API base URL for API calls
const API_BASE_URL = '/api';

const STORAGE_KEY = 'chat4ba_uploaded_files';

interface DisplayedFile extends UploadedFile {
  size?: string;
  status: 'success' | 'processing' | 'error';
  extension: string;
  type?: string;
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
    
    // Also load files from the newer localStorage key
    const newSavedFiles = localStorage.getItem('uploadedFiles');
    if (newSavedFiles) {
      try {
        const files = JSON.parse(newSavedFiles);
        const transformedFiles: DisplayedFile[] = files.map(file => {
          const nameParts = file.name.split('.');
          const extension = nameParts.length > 1 ? nameParts[nameParts.length - 1].toLowerCase() : 'unknown';
          return {
            name: file.name,
            size: formatFileSize(file.size),
            timestamp: new Date(file.date).toLocaleString(),
            status: 'success',
            extension,
            type: file.type || 'unknown'
          };
        });
        // Combine with existing files, avoiding duplicates
        setUploadedFiles(prevFiles => {
          const existingFileNames = new Set(prevFiles.map(f => f.name));
          const newFiles = transformedFiles.filter(f => !existingFileNames.has(f.name));
          return [...prevFiles, ...newFiles];
        });
      } catch (error) {
        console.error('Error parsing files from new storage:', error);
      }
    }
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
            extension,
            type: 'unknown'
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
      console.log('Fetching extracted data from backend...');
      const response = await getExtractedData();
      console.log('Received extracted data:', response);
      
      // Ensure we have a properly structured response to work with
      const data = {
        success: response.success !== false,
        files: Array.isArray(response.data) 
          ? response.data.map(item => ({
              fileName: item.filename || '',
              content: Array.isArray(item.content) ? item.content : [],
              metadata: item.metadata || { rows: 0, columns: 0 }
            }))
          : []
      };
      
      console.log('Formatted extracted data:', data);
      setExtractedData(data);
    } catch (error) {
      console.error('Error fetching extracted data:', error);
      // Provide a default empty response structure instead of failing
      setExtractedData({
        success: true,
        files: []
      });
      toast.error('Could not load extracted data', {
        description: error instanceof Error ? error.message : 'Unknown error occurred'
      });
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
    // First update UI state
    const updatedStateFiles = uploadedFiles.filter(file => file.name !== fileName);
    setUploadedFiles(updatedStateFiles);
    
    // Update localStorage
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
    
    // Also remove from uploadedFiles key
    const newSavedFiles = localStorage.getItem('uploadedFiles');
    if (newSavedFiles) {
      try {
        const files = JSON.parse(newSavedFiles);
        const updatedFiles = files.filter(file => file.name !== fileName);
        localStorage.setItem('uploadedFiles', JSON.stringify(updatedFiles));
      } catch (error) {
        console.error('Error updating uploadedFiles:', error);
      }
    }
    
    // Delete from Qdrant/backend using axios
    axios.delete(`${API_BASE_URL}/data/delete`, {
      params: { filename: fileName }
    })
      .then(response => {
        console.log('File successfully deleted from backend:', response.data);
      })
      .catch(error => {
        console.error('Error deleting file from backend:', error);
      });
    
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
    console.log('Generating data preview for:', fileName);
    
    // Try to find in extracted data
    if (extractedData && extractedData.files) {
      const fileData = extractedData.files.find(f => f.fileName === fileName);
      if (fileData && fileData.content && Array.isArray(fileData.content) && fileData.content.length > 0) {
        console.log('Found file data:', fileData);
        // Make sure we have valid content before trying to extract headers
        const firstRow = fileData.content[0] || {};
        const headers = Object.keys(firstRow);
        if (headers.length === 0) {
          console.log('No headers found in content');
          return null;
        }
        
        // Map rows with safe handling for null values
        const rows = fileData.content.map(row => 
          headers.map(header => {
            const value = row[header];
            return value !== null && value !== undefined ? String(value) : '';
          })
        );
        return { headers, rows };
      } else {
        console.log('No content found for file:', fileName);
      }
    } else {
      console.log('No extracted data available');
    }
    
    return null;
  };

  // Get data for SchemaGrid from extracted files
  const getSchemaFromExtractedData = () => {
    if (!extractedData || !extractedData.files || !Array.isArray(extractedData.files)) {
      console.log('No valid extracted data available for schema generation');
      return [];
    }
    
    return extractedData.files.map(file => {
      // Make sure we have content and it's an array
      const content = Array.isArray(file.content) ? file.content : [];
      const firstRow = content.length > 0 ? content[0] : {};
      const headers = Object.keys(firstRow);
      const randomId = Math.random().toString(36).substring(2, 9);
      
      return {
        id: `extracted-${randomId}`,
        name: file.fileName,
        title: file.fileName,
        columns: headers.map(header => ({
          name: header,
          type: 'string'
        })),
        position: {
          x: Math.floor(Math.random() * 300),
          y: Math.floor(Math.random() * 300)
        }
      };
    });
  };

  const UploadedFilesSection = () => {
    if (uploadedFiles.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-64 space-y-4 text-center p-6 border-2 border-dashed rounded-lg border-gray-300 dark:border-gray-700">
          <FileIcon className="h-12 w-12 text-gray-400" />
          <div>
            <h3 className="text-lg font-medium">No files uploaded yet</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Upload files to start analyzing your data
            </p>
          </div>
          <Button onClick={() => navigate('/data-sources')}>
            <Upload className="h-4 w-4 mr-2" />
            Upload Files
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Your Uploaded Files</h3>
          <Button variant="outline" size="sm" onClick={() => navigate('/data-sources')}>
            <Upload className="h-4 w-4 mr-2" />
            Upload More
          </Button>
        </div>
        
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]"></TableHead>
                <TableHead>Filename</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Uploaded</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {uploadedFiles.map((file, index) => (
                <TableRow 
                  key={`${file.name}-${index}`}
                  className={cn(
                    "cursor-pointer hover:bg-muted/50",
                    selectedFile === file.name && "bg-muted/80"
                  )}
                  onClick={() => handleFileSelect(file.name)}
                >
                  <TableCell>
                    {getFileTypeIcon(file.extension)}
                  </TableCell>
                  <TableCell className="font-medium">{file.name}</TableCell>
                  <TableCell>{file.size || 'Unknown'}</TableCell>
                  <TableCell>{file.timestamp || 'Recent'}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={(e) => {
                          e.stopPropagation();
                          fetchFilePreview(file.name);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(file.name);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
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
              onClick={() => navigate('/data-sources')}
            >
              <Upload size={16} />
              <span>Upload Schema</span>
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
                <div className="p-6 space-y-6">
                  <UploadedFilesSection />
                  
                  {selectedFile && (
                    <Card className="mt-6">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">File Preview: {selectedFile}</CardTitle>
                        <CardDescription>
                          Preview of the selected file content
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {isPreviewLoading ? (
                          <div className="flex items-center justify-center h-40">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                          </div>
                        ) : selectedFilePreview ? (
                          <div className="max-h-96 overflow-auto">
                            {selectedFilePreview.map((preview, index) => (
                              <div key={index} className="mb-4">
                                {preview.metadata?.table ? (
                                  <div className="border rounded-lg overflow-hidden">
                                    <Table>
                                      <TableHeader>
                                        <TableRow>
                                          {preview.metadata.headers.map((header, i) => (
                                            <TableHead key={i}>{header}</TableHead>
                                          ))}
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {preview.metadata.rows.slice(0, 10).map((row, rowIndex) => (
                                          <TableRow key={rowIndex}>
                                            {preview.metadata.headers.map((header, colIndex) => (
                                              <TableCell key={colIndex}>
                                                {row[header]}
                                              </TableCell>
                                            ))}
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                    {preview.metadata.rows.length > 10 && (
                                      <div className="p-2 text-center text-sm text-muted-foreground bg-muted/20">
                                        Showing 10 of {preview.metadata.rows.length} rows
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <pre className="p-4 bg-muted/30 rounded-lg text-sm overflow-auto">
                                    {preview.content}
                                  </pre>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center h-40 space-y-2">
                            <AlertCircle className="h-8 w-8 text-muted-foreground" />
                            <p>No preview available</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
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
