
import { useState, useRef, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { API_BASE_URL, API_ENDPOINTS } from "@/config/api";
import { validatePdfFile } from "@/utils/fileValidation";

export const useFileProcessor = () => {
  const [fileReference, setFileReference] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [response, setResponse] = useState<string>("");
  const { toast } = useToast();
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const resetProgress = useCallback(() => {
    setProgress(0);
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  }, []);

  const simulateProgress = useCallback(() => {
    // Make sure to clear any existing interval first
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    
    setProgress(0);
    let i = 0;
    
    const interval = setInterval(() => {
      if (i < 60) {
        i += 2; // Faster at start
      } else if (i < 90) {
        i += 1; // Medium in the middle
      } else if (i < 99) {
        i += 0.5; // Slower at end
      }
      
      setProgress(Math.min(Math.round(i), 99)); // Cap at 99% until complete
      
      if (i >= 99) {
        clearInterval(interval);
      }
    }, 600);
    
    progressIntervalRef.current = interval;
    return interval;
  }, []);

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
      
      // Start progress simulation
      simulateProgress();
      
      const uploadResponse = await fetch(`${API_BASE_URL}${API_ENDPOINTS.UPLOAD_FILE}`, {
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
      
      const processResponse = await fetch(`${API_BASE_URL}${API_ENDPOINTS.LEGAL_ANALYSIS}`, {
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
      
      // Set progress to 100% to indicate completion
      setProgress(100);
      
      // Clear the interval now that we've completed
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
    fileReference,
    isLoading,
    progress,
    response,
    setFileReference,
    setIsLoading,
    setProgress,
    setResponse,
    resetProgress,
    simulateProgress,
    processFile
  };
};
