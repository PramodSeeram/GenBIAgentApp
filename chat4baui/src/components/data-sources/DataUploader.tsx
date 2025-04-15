
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Upload, Check, X, Loader2 } from 'lucide-react';
import { toast } from "@/hooks/use-toast";

interface DataUploaderProps {
  fileType: string;
  accept: string;
  maxSize?: number; // Size in MB
}

export default function DataUploader({ fileType, accept, maxSize = 10 }: DataUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const fileSizeMB = selectedFile.size / (1024 * 1024);
      
      if (maxSize && fileSizeMB > maxSize) {
        toast({
          title: "File too large",
          description: `File size exceeds maximum allowed size of ${maxSize}MB`,
          variant: "destructive",
        });
        return;
      }
      
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setUploading(true);
    setProgress(0);
    
    // Simulate upload progress
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) {
          clearInterval(interval);
          return 95;
        }
        return prev + 5;
      });
    }, 100);
    
    try {
      // Simulate API call - would be replaced with actual upload code
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      clearInterval(interval);
      setProgress(100);
      
      toast({
        title: "Upload successful",
        description: `${file.name} has been uploaded successfully`,
      });
      
      setTimeout(() => {
        setUploading(false);
        setProgress(0);
      }, 500);
    } catch (error) {
      clearInterval(interval);
      setUploading(false);
      setProgress(0);
      
      toast({
        title: "Upload failed",
        description: "There was an error uploading your file",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    setFile(null);
    setUploading(false);
    setProgress(0);
  };

  return (
    <Card className="p-6 animate-fade-in">
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Upload {fileType} File</h3>
        
        <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 transition-colors hover:border-primary/50 flex flex-col items-center justify-center">
          <Upload className="h-10 w-10 text-gray-400 mb-4 animate-bounce" />
          
          {!file ? (
            <>
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-4">
                Drag and drop your {fileType} file here, or click to select file
              </p>
              <label className="cursor-pointer">
                <Button variant="outline">Select File</Button>
                <input 
                  type="file"
                  accept={accept}
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </>
          ) : (
            <div className="w-full space-y-4">
              <div className="flex items-center">
                <div className="flex-1 truncate">{file.name}</div>
                {!uploading && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="ml-2" 
                    onClick={handleCancel}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              
              {uploading && (
                <>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                    <div 
                      className="bg-blue-500 h-2.5 rounded-full transition-all duration-300 animate-pulse"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-center">{progress}% uploaded</p>
                </>
              )}
              
              {!uploading && (
                <Button 
                  onClick={handleUpload} 
                  className="w-full transition-colors"
                >
                  Upload
                </Button>
              )}
            </div>
          )}
        </div>
        
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Maximum file size: {maxSize}MB. Supported format: {fileType}
        </p>
      </div>
    </Card>
  );
}
