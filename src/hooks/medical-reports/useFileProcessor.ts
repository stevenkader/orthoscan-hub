
import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { API_BASE_URL } from "@/config/api";
import { validatePdfFile } from "@/utils/fileValidation";

export const useFileProcessor = () => {
  const [response, setResponse] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [fileReference, setFileReference] = useState<string>("");
  const { toast } = useToast();
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const resetProgress = () => {
    setProgress(0);
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  };

  const simulateProgress = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    
    setProgress(0);
    let i = 0;
    
    const interval = setInterval(() => {
      if (i < 60) {
        i += 2;
      } else if (i < 90) {
        i += 1;
      } else if (i < 99) {
        i += 0.5;
      }
      
      setProgress(Math.min(Math.round(i), 99));
      
      if (i >= 99) {
        clearInterval(interval);
      }
    }, 600);
    
    progressIntervalRef.current = interval;
    return interval;
  };

  const handleFileChange = () => {
    setResponse("");
    resetProgress();
  };

  const processFile = async (file: File) => {
    setIsLoading(true);
    setResponse("");
    
    try {
      // Validate file
      const validation = await validatePdfFile(file);
      if (!validation.valid) {
        toast({
          title: "Invalid file",
          description: validation.error,
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      const formData = new FormData();
      formData.append("file", file);
      
      simulateProgress();
      
      const uploadResponse = await fetch(`${API_BASE_URL}/upload-temp-file`, {
        method: "POST",
        body: formData
      });
      
      if (!uploadResponse.ok) {
        throw new Error(`HTTP error! Status: ${uploadResponse.status}`);
      }
      
      const fileRef = await uploadResponse.text();
      
      if (fileRef === "max_tokens") {
        resetProgress();
        toast({
          title: "File too large",
          description: "The file is too large to process. Please try a smaller file.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
      
      if (fileRef === "error") {
        resetProgress();
        toast({
          title: "Upload failed",
          description: "The file could not be uploaded.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
      
      setFileReference(fileRef);
      localStorage.setItem("fileReference", fileRef);
      
      const processResponse = await fetch(`${API_BASE_URL}/upload-medical01`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fileReference: fileRef }),
      });
      
      if (!processResponse.ok) {
        throw new Error(`HTTP error! Status: ${processResponse.status}`);
      }
      
      const resultHtml = await processResponse.text();
      
      setProgress(100);
      
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      
      setTimeout(() => {
        setResponse(resultHtml);
        setIsLoading(false);
      }, 500);
      
    } catch (error) {
      console.error("Error processing file:", error);
      resetProgress();
      toast({
        title: "Processing failed",
        description: "There was an error processing your file. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  return {
    response,
    isLoading,
    progress,
    fileReference,
    handleFileChange,
    processFile,
    resetProgress,
    // Export the setter functions so they can be used in the MedicalReports component
    setProgress,
    setResponse,
    setIsLoading
  };
};
