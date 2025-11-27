import React, { useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Upload, X } from "lucide-react";

interface DocumentUploaderProps {
  onProcessFile: (file: File) => void;
  onFileChange?: () => void;
  isLoading?: boolean;
  acceptedFileTypes?: string[];
  title: string;
  description?: string;
}

const DocumentUploader: React.FC<DocumentUploaderProps> = ({
  onProcessFile,
  onFileChange,
  isLoading = false,
  acceptedFileTypes = [".pdf"],
  title,
  description,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      validateAndSetFile(file);
      if (onFileChange) onFileChange();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      validateAndSetFile(file);
      if (onFileChange) onFileChange();
    }
  };

  const validateAndSetFile = (file: File) => {
    const fileExtension = `.${file.name.split('.').pop()?.toLowerCase()}`;
    
    if (!acceptedFileTypes.includes(fileExtension)) {
      alert(`Invalid file type. Please upload a ${acceptedFileTypes.join(", ")} file.`);
      return;
    }
    
    setSelectedFile(file);
  };

  const handleUpload = () => {
    if (selectedFile) {
      onProcessFile(selectedFile);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (onFileChange) onFileChange();
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const getButtonLabel = () => {
    switch (title.toLowerCase()) {
      case "upload document for translation":
        return "Translate Document";
      case "upload document for analysis":
        return "Process Document";
      default:
        return "Process Document";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && (
          <CardDescription>
            {description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center ${
            dragActive ? "border-primary bg-primary/10" : "border-gray-300 dark:border-gray-700"
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleChange}
            accept={acceptedFileTypes.join(",")}
            disabled={isLoading}
          />

          {!selectedFile ? (
            <>
              <div className="flex justify-center mb-4">
                <FileText className="h-12 w-12 text-gray-400" />
              </div>
              <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                <span className="font-semibold">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                {acceptedFileTypes.join(", ")} (Max 10MB)
              </p>
              <Button onClick={handleButtonClick} variant="outline" disabled={isLoading}>
                <Upload className="mr-2 h-4 w-4" />
                Select Document
              </Button>
            </>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-center">
                <FileText className="h-8 w-8 text-primary mr-2" />
                <span className="font-medium">{selectedFile.name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-2 h-8 w-8 p-0"
                  onClick={clearFile}
                  disabled={isLoading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <Button onClick={handleUpload} disabled={isLoading}>
                <Upload className="mr-2 h-4 w-4" />
                {getButtonLabel()}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DocumentUploader;
