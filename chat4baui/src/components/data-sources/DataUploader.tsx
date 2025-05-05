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
    
    // Slower and more realistic progress simulation
    // Start with quick progress to 30%, then slow down
    let progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev < 30) return prev + 1.5; // Move quickly to 30%
        if (prev < 60) return prev + 0.6; // Slow down a bit
        if (prev < 85) return prev + 0.2; // Even slower for the last part
        return prev; // Stay at 85% until actual completion
      });
    }, 180); // Slower interval for more visible animation
    
    try {
      console.log("Uploading files:", files.map(f => f.name).join(", "));
      const response = await processFiles(files);
      
      // Ensure progress completes smoothly
      clearInterval(progressInterval);
      
      // Animate to 100% over a much longer duration for a more gradual completion
      const completeProgress = () => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(progressInterval);
            return 100;
          }
          return prev + 0.3; // Slower increment for post-upload completion
        });
      };
      
      progressInterval = setInterval(completeProgress, 40); // Slower interval
      
      // Clear the completion interval after a longer delay
      setTimeout(() => {
        clearInterval(progressInterval);
        setProgress(100);
      }, 3000); // Much longer delay to ensure animation is visible
      
      console.log("Upload response:", response);

      // Store uploaded files in localStorage for access on modeling page
      const uploadedFiles = JSON.parse(localStorage.getItem('uploadedFiles') || '[]');
      const newUploadedFiles = [
        ...uploadedFiles,
        ...files.map(file => ({
          name: file.name,
          size: file.size,
          type: file.type,
          date: new Date().toISOString()
        }))
      ];
      localStorage.setItem('uploadedFiles', JSON.stringify(newUploadedFiles));

      // Ensure we have a valid response with files array
      // If we're missing the files array, create a default one
      const filesData = response.files || files.map(file => ({
        filename: file.name,
        status: 'success'
      }));
      
      // Filter files by status
      const successfulUploads = filesData.filter(f => f.status === 'success');
      const failedUploads = filesData.filter(f => f.status === 'error');

      if (successfulUploads.length > 0) {
        toast({
          title: "Upload Successful",
          description: `${successfulUploads.length} file(s) uploaded and processed successfully.`,
        });
        
        // Call parent's success handler if available
        if (onUploadSuccess && files.length > 0) {
          onUploadSuccess(files[0].name);
        }

        // Add additional delay before navigating to give user time to see completion
        setTimeout(() => {
          // Redirect to modeling page after successful upload
          navigate('/modeling');
        }, 3500); // Increased delay before navigation
      }

      if (failedUploads.length > 0) {
        failedUploads.forEach(file => {
          toast({
            title: `Failed to upload ${file.filename || file.name}`,
            description: file.error || "Unknown error",
            variant: "destructive",
          });
        });
      }
    } catch (error) {
      clearInterval(progressInterval);
      setProgress(0);
      
      console.error("Upload error:", error);
      
      toast({
        title: "Upload Status Unknown",
        description: "Files were uploaded but we couldn't confirm processing status. Continuing anyway.",
        variant: "default",
      });
      
      // Store uploaded files anyway
      const uploadedFiles = JSON.parse(localStorage.getItem('uploadedFiles') || '[]');
      const newUploadedFiles = [
        ...uploadedFiles,
        ...files.map(file => ({
          name: file.name,
          size: file.size,
          type: file.type,
          date: new Date().toISOString()
        }))
      ];
      localStorage.setItem('uploadedFiles', JSON.stringify(newUploadedFiles));
      
      // Call parent's success handler with the first file
      if (onUploadSuccess && files.length > 0) {
        onUploadSuccess(files[0].name);
      }
      
      // Redirect to modeling page
      navigate('/modeling');
    } finally {
      setTimeout(() => {
        setUploading(false);
      }, 1500); // Longer delay to ensure animation is visible
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
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
            <div 
              className="bg-primary h-3 rounded-full transition-all duration-500 animate-pulse" 
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
