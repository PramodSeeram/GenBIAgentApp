import React, { useEffect, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText, Database, UploadCloud } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { getExtractedData } from '@/services/api';
import { useNavigate } from 'react-router-dom';

interface UploadedFile {
  name: string;
  type: string;
  timestamp: string;
}

interface ExtractedData {
  fileName: string;
  content: any[];
  metadata?: Record<string, any>;
}

const ModelingPage = () => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [extractedData, setExtractedData] = useState<ExtractedData[]>([]);
  const [activeFileIndex, setActiveFileIndex] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Load data when component mounts
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    
    try {
      // Get uploaded files from local storage
      const savedFiles = localStorage.getItem('chat4ba_uploaded_files');
      let filesList: UploadedFile[] = [];
      
      if (savedFiles) {
        filesList = JSON.parse(savedFiles);
        setUploadedFiles(filesList);
      }

      // Get extracted data from API
      try {
        const data = await getExtractedData();
        console.log('Extracted data:', data);
        
        if (data.files && Array.isArray(data.files)) {
          setExtractedData(data.files);
        } else {
          console.log('Using mock data for demonstration');
          // If no data from API, create mock data based on uploaded files
          const mockData = filesList.map(file => ({
            fileName: file.name,
            content: [
              { id: 1, name: 'John Doe', value: Math.floor(Math.random() * 100) },
              { id: 2, name: 'Jane Smith', value: Math.floor(Math.random() * 100) },
              { id: 3, name: 'Bob Johnson', value: Math.floor(Math.random() * 100) },
            ],
            metadata: { rows: 3, columns: 3 }
          }));
          setExtractedData(mockData);
        }
      } catch (error) {
        console.error('API error:', error);
        toast({
          title: 'Error fetching data',
          description: 'Could not fetch extracted data from server',
          variant: 'destructive'
        });
        
        // Create mock data if API fails
        if (filesList.length > 0) {
          const mockData = filesList.map(file => ({
            fileName: file.name,
            content: [
              { id: 1, name: 'John Doe', value: Math.floor(Math.random() * 100) },
              { id: 2, name: 'Jane Smith', value: Math.floor(Math.random() * 100) },
              { id: 3, name: 'Bob Johnson', value: Math.floor(Math.random() * 100) },
            ]
          }));
          setExtractedData(mockData);
        }
      }
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getActiveFileData = () => {
    if (extractedData.length === 0 || activeFileIndex < 0 || activeFileIndex >= uploadedFiles.length) {
      return null;
    }
    
    const activeFileName = uploadedFiles[activeFileIndex].name;
    return extractedData.find(data => data.fileName === activeFileName) || null;
  };

  const handleFileClick = (index: number) => {
    setActiveFileIndex(index);
  };

  const renderTable = (data: ExtractedData) => {
    if (!data || !data.content || !Array.isArray(data.content) || data.content.length === 0) {
      return (
        <div className="p-8 text-center text-muted-foreground">
          No data available for this file
        </div>
      );
    }

    const headers = Object.keys(data.content[0]);

    return (
      <Table>
        <TableHeader>
          <TableRow>
            {headers.map((header, index) => (
              <TableHead key={index} className="font-semibold">{header}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.content.map((row, rowIndex) => (
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
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto py-8">
          <div className="flex items-center justify-center h-[60vh]">
            <div className="animate-spin w-8 h-8 border-2 border-primary rounded-full border-t-transparent"></div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Data Modeling</h1>
          <Button 
            variant="outline" 
            className="flex items-center gap-1"
            onClick={() => navigate('/data-sources')}
          >
            <UploadCloud className="h-4 w-4" />
            <span>Upload More</span>
          </Button>
        </div>

        {uploadedFiles.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
            <Database className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Data Available</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              You haven't uploaded any files yet. Start by uploading some data.
            </p>
            <Button onClick={() => navigate('/data-sources')}>
              Upload Files
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Sidebar with uploaded files */}
            <Card className="p-4 md:col-span-1">
              <h2 className="text-lg font-semibold mb-4">Data Sources</h2>
              <ScrollArea className="h-[65vh] pr-3">
                <div className="space-y-2">
                  {uploadedFiles.map((file, index) => (
                    <div 
                      key={index}
                      className={`p-3 rounded-md cursor-pointer transition-colors ${
                        index === activeFileIndex 
                          ? 'bg-primary/10 border border-primary/20' 
                          : 'hover:bg-secondary'
                      }`}
                      onClick={() => handleFileClick(index)}
                    >
                      <div className="flex items-center">
                        {file.type.includes('Excel') || file.type.includes('CSV') ? (
                          <Database className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0" />
                        ) : (
                          <FileText className="h-5 w-5 text-orange-500 mr-2 flex-shrink-0" />
                        )}
                        <div className="overflow-hidden">
                          <div className="font-medium truncate">{file.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {file.timestamp}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </Card>

            {/* Main content area */}
            <Card className="p-6 md:col-span-3">
              {uploadedFiles.length > 0 && activeFileIndex >= 0 && (
                <>
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold mb-1">
                      {uploadedFiles[activeFileIndex].name}
                    </h2>
                    <p className="text-muted-foreground text-sm">
                      {uploadedFiles[activeFileIndex].type}
                    </p>
                  </div>

                  <div className="border rounded-lg">
                    <ScrollArea className="h-[60vh]">
                      {getActiveFileData() ? (
                        renderTable(getActiveFileData()!)
                      ) : (
                        <div className="p-8 text-center text-muted-foreground">
                          No data available for this file
                        </div>
                      )}
                    </ScrollArea>
                  </div>
                </>
              )}
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ModelingPage; 