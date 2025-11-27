import { useState, useRef } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Upload, Scan, RotateCcw, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getSupabaseClient } from "@/integrations/supabase/safeClient";
import { generatePDF } from "@/utils/pdf-export";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { validateImageFile } from "@/utils/fileValidation";
import { sanitizeHtml } from "@/utils/sanitizeHtml";

// Generate or retrieve session ID for usage tracking
const getSessionId = () => {
  let sessionId = sessionStorage.getItem('ortho_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('ortho_session_id', sessionId);
  }
  return sessionId;
};

// Log usage event
const logUsageEvent = async (eventType: string, metadata?: any, errorMessage?: string) => {
  try {
    const supabase = await getSupabaseClient();
    await supabase.from("orthodontic_usage_logs").insert({
      event_type: eventType,
      session_id: getSessionId(),
      metadata: metadata || null,
      error_message: errorMessage || null,
    });
  } catch (error) {
    console.error("Error logging usage:", error);
  }
};

const OrthodonticAnalyzer = () => {
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [treatmentPlan, setTreatmentPlan] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);
  const [showPdfDialog, setShowPdfDialog] = useState(false);
  const [pdfSuccess, setPdfSuccess] = useState(false);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const treatmentPlanRef = useRef<HTMLDivElement>(null);
  const treatmentPlanCardRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate the file
    const validation = await validateImageFile(file);
    if (!validation.valid) {
      toast({
        title: "Invalid file",
        description: validation.error || "Invalid image file",
        variant: "destructive",
      });
      return;
    }

    // Read the file and set it as the only image
    const reader = new FileReader();
    reader.onload = (e) => {
      setSelectedImages([e.target?.result as string]);
    };
    reader.readAsDataURL(file);
    
    setImageFiles([file]);
    setTreatmentPlan("");
    
    // Log upload event
    logUsageEvent('upload', { fileType: file.type, fileSize: file.size });
  };

  const handleRemoveImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleAnalyze = async () => {
    if (imageFiles.length === 0) {
      toast({
        title: "No image selected",
        description: "Please upload a panorex image first",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    setProgress(0);
    setTreatmentPlan("");
    
    // Log analysis start
    logUsageEvent('analysis_start');
    
    // Start progress simulation
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
    
    let i = 0;
    progressIntervalRef.current = setInterval(() => {
      if (i < 60) {
        i += 2;
      } else if (i < 90) {
        i += 1;
      } else if (i < 99) {
        i += 0.5;
      }
      setProgress(Math.min(Math.round(i), 99));
      if (i >= 99 && progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    }, 1200);
    
      try {
        const supabase = await getSupabaseClient();
        const { data, error } = await supabase.functions.invoke("analyze-orthodontic-image", {
          body: { images: selectedImages },
        });

      if (error) throw error;

      setProgress(100);
      setTimeout(() => {
        setTreatmentPlan(data.analysis);
        toast({
          title: "Analysis complete",
          description: "Your orthodontic treatment plan is ready",
        });
        setIsAnalyzing(false);
        
        // Log successful analysis
        logUsageEvent('analysis_success');
        
        // Scroll to treatment plan
        setTimeout(() => {
          treatmentPlanCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }, 500);
    } catch (error) {
      console.error('Error analyzing image:', error);
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      setProgress(0);
      
      // Log error
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logUsageEvent('analysis_error', null, errorMessage);
      
      toast({
        title: "Analysis failed",
        description: "There was an error analyzing your image. Please try again.",
        variant: "destructive",
      });
      setIsAnalyzing(false);
    }
  };

  const handleGeneratePDF = async () => {
    if (!treatmentPlan) {
      toast({
        title: "No treatment plan",
        description: "Please generate a treatment plan first",
        variant: "destructive",
      });
      return;
    }

    setIsPdfGenerating(true);
    setShowPdfDialog(true);
    setPdfSuccess(false);
    
    // Log PDF export start
    logUsageEvent('pdf_export_start');
    
    try {
      // Prepare images array with captions for PDF
      const pdfImages = selectedImages.map((imgSrc, index) => {
        // Try to infer caption from image characteristics or use generic caption
        let caption = `Photo ${index + 1}`;
        
        // You can enhance this logic to detect image types if needed
        if (index === 0) caption = "Pano";
        
        return { src: imgSrc, caption };
      });

      const success = await generatePDF({
        title: "Orthodontic Treatment Plan",
        fileName: "orthodontic-treatment-plan",
        contentRef: treatmentPlanRef,
        content: treatmentPlan,
        images: pdfImages,
      });

      if (success) {
        setPdfSuccess(true);
        // Log successful PDF export
        logUsageEvent('pdf_export_success');
      } else {
        throw new Error("PDF generation failed");
      }
    } catch (error) {
      console.error("Error generating PDF:", error);
      
      // Log PDF export error
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logUsageEvent('pdf_export_error', null, errorMessage);
      
      setShowPdfDialog(false);
      toast({
        title: "Export failed",
        description: "There was an error generating the PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsPdfGenerating(false);
    }
  };

  const handleClearAll = () => {
    setSelectedImages([]);
    setImageFiles([]);
    setTreatmentPlan("");
    setProgress(0);
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
    toast({
      title: "Page cleared",
      description: "All images and results have been removed",
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-1 container py-8 md:py-12">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              Orthodontic Panorex Analyzer
            </h1>
            <p className="text-sm text-muted-foreground mb-4">
              For Dental Professionals Only
            </p>
            <p className="text-lg text-muted-foreground">
              Upload a panoramic X-ray to receive a comprehensive orthodontic evaluation and treatment plan powered by AI.
            </p>
          </div>

          {/* Security & Compliance Section */}
          <Card className="mb-8 bg-muted/30">
            <CardHeader>
              <CardTitle className="text-xl">Security & Compliance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-semibold">No images are stored.</p>
                <p className="text-sm text-muted-foreground">
                  All uploads are processed in temporary memory and immediately deleted after analysis.
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-semibold">HIPAA-Friendly Workflow.</p>
                <p className="text-sm text-muted-foreground">
                  This tool does not save, transmit, or retain any Protected Health Information (PHI). All processing is ephemeral and session-based.
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-semibold">Encrypted Communication.</p>
                <p className="text-sm text-muted-foreground">
                  All data is sent over secure HTTPS/TLS 1.2+ connections.
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-semibold">You remain the data controller.</p>
                <p className="text-sm text-muted-foreground">
                  Only the clinician can access uploaded images and results during the session. Nothing is shared with third parties.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* How It Works Section */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-xl text-center">How It Works</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6 text-center">
                <div className="space-y-2">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <span className="text-xl font-bold text-primary">1</span>
                  </div>
                  <p className="text-sm font-semibold">Upload a panoramic X-ray.</p>
                </div>
                <div className="space-y-2">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <span className="text-xl font-bold text-primary">2</span>
                  </div>
                  <p className="text-sm font-semibold">AI analyzes radiographic markers.</p>
                </div>
                <div className="space-y-2">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <span className="text-xl font-bold text-primary">3</span>
                  </div>
                  <p className="text-sm font-semibold">Receive structured findings and clinical considerations.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Left: Image Viewer */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Panoramic X-Ray</CardTitle>
                {(selectedImages.length > 0 || treatmentPlan) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearAll}
                    disabled={isAnalyzing}
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Clear All
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                  <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">
                    Upload one panoramic X-ray image
                  </p>
                  <label htmlFor="image-upload">
                    <Button variant="default" asChild disabled={selectedImages.length > 0}>
                      <span>Select Panorex</span>
                    </Button>
                  </label>
                  <input
                    id="image-upload"
                    type="file"
                    accept=".jpg,.jpeg,.png,.heic,.pdf"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                  <p className="text-xs text-muted-foreground mt-4">
                    Supported formats: JPG, PNG, PDF, HEIC
                  </p>
                </div>

                {selectedImages.length > 0 && (
                  <>
                    <div className="relative aspect-[2/1] bg-muted rounded-lg overflow-hidden">
                      <img
                        src={selectedImages[0]}
                        alt="Panorex X-ray"
                        className="w-full h-full object-contain"
                      />
                      <button
                        onClick={() => handleRemoveImage(0)}
                        className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1.5 hover:bg-destructive/90 transition-colors"
                        aria-label="Remove image"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18"></line>
                          <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                      </button>
                    </div>
                    
                    <Button
                      onClick={handleAnalyze}
                      disabled={isAnalyzing || selectedImages.length === 0}
                      className="w-full"
                      size="lg"
                    >
                      <Scan className="mr-2 h-4 w-4" />
                      {isAnalyzing ? "Analyzing..." : "Generate Treatment Plan"}
                    </Button>

                    {isAnalyzing && (
                      <div className="space-y-2">
                        <Progress value={progress} className="w-full h-4" />
                        <p className="text-sm text-center text-muted-foreground">{progress}% complete</p>
                      </div>
                    )}
                  </>
                )}
                
                <Button
                  variant="outline"
                  className="w-full"
                  asChild
                >
                  <a href="mailto:steven@jaredco.com?subject=Orthodontic Analyzer feedback">
                    Email Support / Feedback
                  </a>
                </Button>
              </CardContent>
            </Card>

            {/* Right: Treatment Plan Output */}
            <Card ref={treatmentPlanCardRef}>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Treatment Plan</CardTitle>
                {treatmentPlan && (
                  <Button
                    onClick={handleGeneratePDF}
                    disabled={isPdfGenerating}
                    variant="outline"
                    size="sm"
                  >
                    {isPdfGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      "Export PDF"
                    )}
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {!treatmentPlan ? (
                  <div className="text-center text-muted-foreground py-12">
                    <p>Upload a panorex image and click "Generate Treatment Plan" to see the analysis</p>
                  </div>
                ) : (
                  <div 
                    ref={treatmentPlanRef}
                    className="prose prose-headings:font-semibold prose-headings:text-foreground
                    prose-p:text-muted-foreground prose-p:leading-relaxed prose-p:my-3
                    prose-li:text-muted-foreground prose-strong:text-foreground
                    prose-ul:my-3 prose-ol:my-3 prose-li:my-1.5
                    prose-h2:text-2xl prose-h3:text-xl prose-h2:mt-6 prose-h2:mb-3 prose-h3:mt-4 prose-h3:mb-2
                    max-w-none dark:prose-invert overflow-y-auto max-h-[600px]">
                    <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(treatmentPlan) }} />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

            <div className="mt-8 text-center text-sm text-muted-foreground">
              <p className="mb-2">
                <strong>Disclaimer:</strong> This AI-powered analysis is for informational purposes only and should not replace professional orthodontic consultation.
              </p>
              <p>
                The analysis is based solely on the radiographic image and may not capture all clinical details. Please consult with a licensed orthodontist for accurate diagnosis and treatment planning.
              </p>
            </div>
        </div>
      </main>
      <Footer />
      
      {/* PDF Generation Dialog */}
      <Dialog open={showPdfDialog} onOpenChange={(open) => {
        if (!open && pdfSuccess) {
          setShowPdfDialog(false);
          setPdfSuccess(false);
          setIsPdfGenerating(false);
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">
              {pdfSuccess ? "PDF Downloaded" : "Generating PDF"}
            </DialogTitle>
          </DialogHeader>
          
          {!pdfSuccess ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <DialogDescription className="text-center">
                Please wait while we generate your treatment plan PDF...
              </DialogDescription>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <DialogDescription className="text-center mb-6">
                Your treatment plan PDF has been successfully downloaded!
              </DialogDescription>
              <Button 
                onClick={() => {
                  setShowPdfDialog(false);
                  setPdfSuccess(false);
                  setIsPdfGenerating(false);
                }}
                className="w-full"
              >
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrthodonticAnalyzer;
