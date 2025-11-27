
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import ResultsDisplay from "@/components/medical-reports/ResultsDisplay";
import DocumentUploader from "@/components/document-uploader/DocumentUploader";
import PrivacyNotice from "@/components/legal-assistant/PrivacyNotice";
import DemoSection from "@/components/medical-reports/DemoSection";
import { useFileProcessor } from "@/hooks/medical-reports/useFileProcessor";
import { useEffect, useState } from "react";
import { demoMedicalReport } from "@/components/medical-reports/data/demoContent";
import { useToast } from "@/hooks/use-toast";

const MedicalReports = () => {
  const [showDemoDialog, setShowDemoDialog] = useState<boolean>(false);
  const { toast } = useToast();
  const {
    response,
    isLoading,
    progress,
    handleFileChange,
    processFile,
    resetProgress,
    // Now these setter functions are properly imported from the hook
    setProgress,
    setResponse,
    setIsLoading
  } = useFileProcessor();

  const handleDemoProcess = () => {
    toast({
      title: "Using demo file",
      description: "Processing demo-contract-medical001.pdf",
    });
    
    setTimeout(() => {
      setProgress(100);
      setTimeout(() => {
        setResponse(demoMedicalReport);
        setIsLoading(false);
      }, 500);
    }, 3000);
  };

  useEffect(() => {
    return () => {
      resetProgress();
    };
  }, [resetProgress]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-1 container py-8 md:py-12">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8 text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Make Sense of Your Medical Reports: Clear, Personalized Explanations at Your Fingertips.
            </h1>
            <p className="text-lg text-muted-foreground">
              Upload any medical document to receive an easy-to-understand summary and personalized insights tailored to your health context—empowering you to take control of your healthcare journey.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <DemoSection 
              showDemoDialog={showDemoDialog}
              setShowDemoDialog={setShowDemoDialog}
              handleDemoProcess={handleDemoProcess}
            />
            
            <DocumentUploader 
              isLoading={isLoading}
              onProcessFile={processFile}
              onFileChange={handleFileChange}
              title="Get Plain English Translation"
              acceptedFileTypes={[".pdf"]}
            />
          </div>
          
          <ResultsDisplay 
            response={response} 
            isLoading={isLoading} 
            progress={progress}
          />
          <PrivacyNotice />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default MedicalReports;
