
import { useState } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import PrivacyNotice from "@/components/translation-assistant/PrivacyNotice";
import DocumentUploader from "@/components/document-uploader/DocumentUploader";
import DemoSection from "@/components/translation-assistant/DemoSection";
import ResultsDisplay from "@/components/translation-assistant/ResultsDisplay";
import { useDocumentProcessor } from "@/components/translation-assistant/hooks/useDocumentProcessor";

const TranslationAssistant = () => {
  const [showDemoDialog, setShowDemoDialog] = useState<boolean>(false);
  
  const {
    response,
    isLoading,
    progress,
    processFile,
    handleFileChange,
    handleDemoProcess
  } = useDocumentProcessor();

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-1 container py-8 md:py-12">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8 text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">Translation Assistant</h1>
            <p className="text-lg text-muted-foreground">
              Upload a document in any language and get it translated to English
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
              title="Upload Document for Translation"
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

export default TranslationAssistant;
