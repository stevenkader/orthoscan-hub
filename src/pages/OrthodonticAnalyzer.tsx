import { useState, useRef, useEffect } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Upload, Scan, RotateCcw, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import ExportButton from "@/components/legal-assistant/results/ExportButton";
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
    await supabase.from('orthodontic_usage_logs').insert({
      event_type: eventType,
      session_id: getSessionId(),
      metadata: metadata || null,
      error_message: errorMessage || null,
    });
  } catch (error) {
    console.error('Error logging usage:', error);
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
  const { toast } = useToast();

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Check if adding these files would exceed 8 images
    if (selectedImages.length + files.length > 8) {
      toast({
        title: "Too many images",
        description: "You can upload a maximum of 8 images",
        variant: "destructive",
      });
      return;
    }

    // Validate each file
    for (const file of files) {
      const validation = await validateImageFile(file);
      if (!validation.valid) {
        toast({
          title: "Invalid file",
          description: validation.error || "Invalid image file",
          variant: "destructive",
        });
        return;
      }
    }

    // Read all files and add them to state
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImages(prev => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
    
    setImageFiles(prev => [...prev, ...files]);
    setTreatmentPlan("");
    
    // Log upload event
    files.forEach(file => {
      logUsageEvent('upload', { fileType: file.type, fileSize: file.size });
    });
  };

  const handleRemoveImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleAnalyze = async () => {
    if (imageFiles.length === 0) {
      toast({
        title: "No images selected",
        description: "Please upload at least one image first",
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
      // All images are already in base64 format in selectedImages
      const { data, error } = await supabase.functions.invoke('analyze-orthodontic-image', {
        body: { images: selectedImages }
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
      } else {
        throw new Error("PDF generation failed");
      }
    } catch (error) {
      console.error("Error generating PDF:", error);
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
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Orthodontic Panorex Analyzer
            </h1>
            <p className="text-lg text-muted-foreground">
              Upload a panoramic X-ray to receive a comprehensive orthodontic evaluation and treatment plan powered by AI.
            </p>
          </div>


          {isAnalyzing && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Analyzing X-Ray</CardTitle>
              </CardHeader>
              <CardContent>
                <Progress value={progress} className="w-full h-4" />
                <p className="text-sm text-center mt-2 text-muted-foreground">{progress}% complete</p>
              </CardContent>
            </Card>
          )}

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
                    Upload up to 8 images (panoramic X-rays, intraoral photos, etc.)
                  </p>
                  <label htmlFor="image-upload">
                    <Button variant="default" asChild disabled={selectedImages.length >= 8}>
                      <span>Select Images</span>
                    </Button>
                  </label>
                  <input
                    id="image-upload"
                    type="file"
                    accept=".jpg,.jpeg,.png,.heic,.pdf"
                    multiple
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                  <p className="text-xs text-muted-foreground mt-4">
                    Supported formats: JPG, PNG, PDF, HEIC • {selectedImages.length}/8 images
                  </p>
                </div>

                {selectedImages.length > 0 && (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {selectedImages.map((image, index) => (
                        <div key={index} className="relative aspect-square bg-muted rounded-lg overflow-hidden group">
                          <img
                            src={image}
                            alt={`Upload ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <button
                            onClick={() => handleRemoveImage(index)}
                            className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                            aria-label="Remove image"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="18" y1="6" x2="6" y2="18"></line>
                              <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                          </button>
                        </div>
                      ))}
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
                  </>
                )}
                
                <Button
                  variant="outline"
                  className="w-full"
                  asChild
                >
                  <a href="mailto:steven@jaredco.com?subject=Orthodontic Analyzer feedback">
                    Email Beta Test Feedback
                  </a>
                </Button>
              </CardContent>
            </Card>

            {/* Right: Treatment Plan Output */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Treatment Plan</CardTitle>
                {treatmentPlan && (
                  <ExportButton 
                    isPdfGenerating={isPdfGenerating}
                    onClick={handleGeneratePDF}
                  />
                )}
              </CardHeader>
              <CardContent>
                {!treatmentPlan ? (
                  <div className="text-center text-muted-foreground py-12">
                    <p>Upload an image and click "Generate Treatment Plan" to see the analysis</p>
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
                OK
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrthodonticAnalyzer;
