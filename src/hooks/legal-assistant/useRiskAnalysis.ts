
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { API_BASE_URL, API_ENDPOINTS } from "@/config/api";

export interface RiskAnalysisProps {
  fileReference: string;
  setIsLoading: (isLoading: boolean) => void;
  setResponse: (response: string) => void;
  setProgress: (progress: number) => void;
  resetProgress: () => void;
  simulateProgress: () => NodeJS.Timeout;
}

export const useRiskAnalysis = ({
  fileReference,
  setIsLoading,
  setResponse,
  setProgress,
  resetProgress,
  simulateProgress
}: RiskAnalysisProps) => {
  const [partyName, setPartyName] = useState<string>("");
  const [isRiskAnalysisLoading, setIsRiskAnalysisLoading] = useState<boolean>(false);
  const [isRiskAnalysis, setIsRiskAnalysis] = useState<boolean>(false);
  const { toast } = useToast();

  const handleRiskAnalysis = async () => {
    if (!fileReference || !partyName) {
      toast({
        title: "Missing Information",
        description: "Please specify which party you are before requesting risk analysis.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsRiskAnalysisLoading(true);
      setIsLoading(true);
      setResponse(""); // Clear existing results
      setIsRiskAnalysis(true); // Set this to true for risk analysis
      
      // Start progress simulation
      simulateProgress();
      
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.LEGAL_RISK_ANALYSIS}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          fileReference, 
          party: partyName 
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const resultHtml = await response.text();
      
      // Set progress to 100% to indicate completion
      setProgress(100);
      
      setTimeout(() => {
        setResponse(resultHtml);
        setIsLoading(false);
        setIsRiskAnalysisLoading(false);
        
        toast({
          title: "Risk Analysis Complete",
          description: "Your legal risk analysis is now available.",
        });
      }, 500);
      
    } catch (error) {
      console.error("Error generating risk analysis:", error);
      resetProgress();
      setIsLoading(false);
      setIsRiskAnalysisLoading(false);
      setIsRiskAnalysis(false);
      
      toast({
        title: "Risk Analysis Failed",
        description: "There was an error analyzing risks for your party. Please try again.",
        variant: "destructive",
      });
    }
  };

  return {
    partyName,
    isRiskAnalysisLoading,
    isRiskAnalysis,
    setPartyName,
    setIsRiskAnalysis,
    handleRiskAnalysis
  };
};
