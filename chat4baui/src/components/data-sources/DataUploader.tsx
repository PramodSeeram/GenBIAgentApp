import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Upload, Check, X, Loader2, Eye, Plus } from 'lucide-react';
import { toast } from "@/hooks/use-toast";
import { previewFiles, processFiles } from '@/services/api';
import { useNavigate } from 'react-router-dom';

interface DataUploaderProps {
  fileType: string;
  accept: string;
  maxSize?: number; // Size in MB
  onUploadSuccess?: (filename: string) => void;
  onFilesSelected?: (files: File[]) => void;
  onPreviewRequest?: () => void;
  isLoading?: boolean;
}

export default function DataUploader({ 
  fileType, 
  accept, 
  maxSize = 50,
  onUploadSuccess,
  onFilesSelected,
  onPreviewRequest,
  isLoading = false
}: DataUploaderProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newSelectedFiles = Array.from(e.target.files);
      const currentFiles = files;
      
      const validNewFiles = newSelectedFiles.filter(file => {
        const fileSizeMB = file.size / (1024 * 1024);
        if (maxSize && fileSizeMB > maxSize) {
          toast({
            title: "File too large",
            description: `${file.name} exceeds the maximum allowed size of ${maxSize}MB and was not added.`,
            variant: "destructive",
          });
          return false;
        }
        return true;
      });

      const combinedFiles = [...currentFiles];
      validNewFiles.forEach(newFile => {
        if (!currentFiles.some(existingFile => existingFile.name === newFile.name)) {
          combinedFiles.push(newFile);
        }
      });
      
      setFiles(combinedFiles);
      
      // Notify parent component
      if (onFilesSelected) {
        onFilesSelected(combinedFiles);
      }

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveFile = (indexToRemove: number) => {
    const updatedFiles = files.filter((_, index) => index !== indexToRemove);
    setFiles(updatedFiles);
    
    // Notify parent component
    if (onFilesSelected) {
      onFilesSelected(updatedFiles);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handlePreviewClick = () => {
    if (files.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select files before previewing",
        variant: "destructive"
      });
      return;
    }
    
    if (onPreviewRequest) {
      onPreviewRequest();
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select at least one file to upload",
        variant: "destructive"
      });
      return;
    }
    
    setUploading(true);
    setProgress(0);
    
    const interval = setInterval(() => {
      setProgress(prev => Math.min(prev + 5, 95));
    }, 100);
    
    try {
      console.log("Uploading files:", files.map(f => f.name).join(", "));
      const response = await processFiles(files);
      clearInterval(interval);
      setProgress(100);
      
      console.log("Upload response:", response);

      if (response.files && response.files.length > 0) {
        const successfulUploads = response.files.filter(f => f.status === 'success');
        const failedUploads = response.files.filter(f => f.status === 'error');

        if (successfulUploads.length > 0) {
          toast({
            title: "Upload Successful",
            description: `${successfulUploads.length} file(s) uploaded and processed successfully.`,
          });
          
          // Call parent's success handler if available
          if (onUploadSuccess && files.length > 0) {
            onUploadSuccess(files[0].name);
          }

          // Redirect to modeling page after successful upload
          navigate('/modeling');
        }

        if (failedUploads.length > 0) {
          failedUploads.forEach(file => {
            toast({
              title: `Failed to upload ${file.filename}`,
              description: file.error,
              variant: "destructive",
            });
          });
        }
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      clearInterval(interval);
      setProgress(0);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setTimeout(() => {
        setUploading(false);
      }, 500);
    }
  };

  return (
    <div className="animate-fade-in">
      <input 
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
        multiple
      />

      <div className="space-y-4">        
        {/* Dropzone/Selection Area */}        
        <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 transition-colors hover:border-primary/50 flex flex-col items-center justify-center min-h-[200px]">
          {files.length === 0 ? (
            <>
              <Upload className="h-10 w-10 text-gray-400 mb-4" />
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-4">
                Drag and drop your {fileType} files here, or click to select files
              </p>
              <Button variant="outline" onClick={triggerFileInput}>Select Files</Button>
            </>
          ) : (
            <div className="w-full space-y-4">
              {/* File List */}
              <div className="max-h-40 overflow-y-auto space-y-2 pr-2">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-muted/30 p-2 rounded">
                    <span className="text-sm truncate flex-1 mr-2">{file.name}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-destructive"
                      onClick={() => handleRemoveFile(index)}
                      disabled={uploading || isLoading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            
              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2 border-t border-dashed">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={triggerFileInput}
                  disabled={uploading || isLoading}
                  title="Add more files"
                  className="h-9 w-9"
                >
                  <Plus className="h-5 w-5" />
                </Button>
                <div className="flex-1 flex gap-2 justify-end">
                  <Button
                    onClick={handlePreviewClick}
                    variant="secondary"
                    disabled={uploading || isLoading || files.length === 0}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Eye className="h-4 w-4 mr-2" />
                    )}
                    Preview
                  </Button>
                  <Button
                    onClick={handleUpload}
                    disabled={uploading || isLoading || files.length === 0}
                  >
                    {uploading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4 mr-2" />
                    )}
                    Upload {files.length > 0 ? `(${files.length})` : ''}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Progress bar */}
        {(uploading || isLoading) && (
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300" 
              style={{ width: `${progress}%` }} 
            />
          </div>
        )}

        {/* Footer Info */}  
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Maximum file size: {maxSize}MB. Supported format(s): {accept.replace(/\./g, '').replace(/,/g, ', ')}
        </p>
      </div>
    </div>
  );
}
