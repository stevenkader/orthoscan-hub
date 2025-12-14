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
          description: "Your orthodontic evaluation report is ready",
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
        title: "No evaluation report",
        description: "Please generate an evaluation report first",
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
        <div className="max-w-4xl mx-auto">
          
          {/* SECTION 1 — HERO */}
          <div className="mb-12 text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              AI-Assisted Panoramic Review for First Orthodontic Consults
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-3xl mx-auto">
              A clinician-controlled tool that highlights commonly evaluated panoramic features, supports early case review, and helps explain findings clearly to patients — before full diagnostics.
            </p>
            <Button 
              size="lg"
              onClick={() => {
                document.getElementById("upload-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className="mx-auto mb-4"
            >
              Upload Panoramic X-ray
            </Button>
            <p className="text-sm text-muted-foreground">
              First-consult use • No image storage • Clinician-only
            </p>
          </div>

          {/* SECTION 2 — WHAT THIS IS / WHAT THIS ISN'T */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-xl text-center">What This Is — And What It Isn't</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="font-semibold text-base">What This Is:</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start">
                      <span className="text-primary mr-2">•</span>
                      An AI-assisted early case review tool
                    </li>
                    <li className="flex items-start">
                      <span className="text-primary mr-2">•</span>
                      A structured way to surface commonly evaluated orthodontic radiographic features
                    </li>
                    <li className="flex items-start">
                      <span className="text-primary mr-2">•</span>
                      A support tool for clear, consistent first-consult explanations
                    </li>
                  </ul>
                </div>
                <div className="space-y-4">
                  <h3 className="font-semibold text-base">What This Isn't:</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start">
                      <span className="text-muted-foreground mr-2">•</span>
                      Not a diagnosis
                    </li>
                    <li className="flex items-start">
                      <span className="text-muted-foreground mr-2">•</span>
                      Not an automated treatment plan
                    </li>
                    <li className="flex items-start">
                      <span className="text-muted-foreground mr-2">•</span>
                      Not a replacement for clinical judgment or full records
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SECTION 3 — HOW IT WORKS */}
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
                  <p className="text-sm">Upload a panoramic X-ray (JPG, PNG, PDF, HEIC — no DICOM required)</p>
                </div>
                <div className="space-y-2">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <span className="text-xl font-bold text-primary">2</span>
                  </div>
                  <p className="text-sm">AI highlights commonly evaluated orthodontic radiographic features for clinician review</p>
                </div>
                <div className="space-y-2">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <span className="text-xl font-bold text-primary">3</span>
                  </div>
                  <p className="text-sm">Receive a structured first-consult clinical summary you review, refine, and explain</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SECTION 4 — THE AI-ASSISTED REPORT */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-xl text-center">AI-Assisted First-Consult Radiographic Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                The generated summary is designed to support early evaluation and patient discussion, not definitive treatment decisions.
              </p>
              <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                <p className="text-sm"><span className="font-semibold">Findings</span> — observable radiographic features</p>
                <p className="text-sm"><span className="font-semibold">Interpretation</span> — high-level, non-diagnostic context</p>
                <p className="text-sm"><span className="font-semibold">Clinical Considerations</span> — items commonly reviewed during initial orthodontic evaluation</p>
              </div>
              <p className="text-xs text-muted-foreground text-center italic">
                "This report supports clinician review and patient discussion and is not intended for definitive treatment planning."
              </p>
            </CardContent>
          </Card>

          {/* SAMPLE OUTPUT PREVIEW */}
          <Card className="mb-8 border-primary/20">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded">Sample Output</span>
              </div>
              <CardTitle className="text-xl text-center">Example First-Consult Summary</CardTitle>
              <p className="text-sm text-muted-foreground text-center mt-2">
                Below is an example of what the AI-generated summary looks like.
              </p>
            </CardHeader>
            <CardContent>
              <div className="bg-muted/20 rounded-lg p-6 border border-border/50">
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <h3 className="text-lg font-semibold mb-3 text-foreground">Findings</h3>
                  <ul className="text-sm text-muted-foreground space-y-1.5 mb-5 list-disc pl-5">
                    <li>Mixed dentition stage with several primary teeth still present</li>
                    <li>Developing permanent teeth visible in various stages of eruption</li>
                    <li>Apparent crowding in the lower anterior region</li>
                    <li>Bilateral mandibular third molars developing</li>
                    <li>No obvious radiolucent or radiopaque pathology noted</li>
                  </ul>

                  <h3 className="text-lg font-semibold mb-3 text-foreground">Interpretation</h3>
                  <p className="text-sm text-muted-foreground mb-5">
                    The panoramic radiograph suggests a developing dentition with potential space management considerations. The crowding observed in the lower anterior region may warrant monitoring as permanent teeth continue to erupt. Overall dental development appears within normal parameters for the patient's apparent age.
                  </p>

                  <h3 className="text-lg font-semibold mb-3 text-foreground">Clinical Considerations</h3>
                  <ul className="text-sm text-muted-foreground space-y-1.5 list-disc pl-5">
                    <li>Assess timing of primary tooth exfoliation vs. permanent eruption</li>
                    <li>Evaluate arch length discrepancy and space requirements</li>
                    <li>Consider serial extraction or space maintenance options if indicated</li>
                    <li>Monitor third molar development and eruption path</li>
                    <li>Correlate with clinical examination and additional records as needed</li>
                  </ul>
                </div>
              </div>
              <p className="text-xs text-muted-foreground text-center italic mt-4">
                This is a sample output for demonstration purposes only. Actual results will vary based on the uploaded panoramic X-ray.
              </p>
            </CardContent>
          </Card>

          {/* UPLOAD & RESULTS SECTION */}
          <div className="grid md:grid-cols-2 gap-8 mb-8" id="upload-section">
            {/* Left: Image Viewer */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Panoramic X-ray Upload</CardTitle>
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
                    <span className="font-medium">Upload formats:</span> JPG, PNG, PDF, HEIC <span className="text-primary">(no DICOM required)</span>
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
                      {isAnalyzing ? "Analyzing..." : "Generate First-Consult Summary"}
                    </Button>

                    {isAnalyzing && (
                      <div className="space-y-2">
                        <Progress value={progress} className="w-full h-4" />
                        <p className="text-sm text-center text-muted-foreground">{progress}% complete</p>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Right: Report Output */}
            <Card ref={treatmentPlanCardRef}>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>First-Consult Summary</CardTitle>
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
                    <p>Upload a panoramic X-ray and click Generate First-Consult Summary to view the report.</p>
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

          {/* SECTION 5 — WHY ORTHODONTISTS USE ORTHO SCAN TOOL */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-xl text-center">Why Orthodontists Use Ortho Scan Tool</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="grid md:grid-cols-2 gap-4">
                <li className="flex items-start text-sm">
                  <span className="text-primary mr-2">•</span>
                  Shortens first-consult explanations
                </li>
                <li className="flex items-start text-sm">
                  <span className="text-primary mr-2">•</span>
                  Improves patient and parent understanding
                </li>
                <li className="flex items-start text-sm">
                  <span className="text-primary mr-2">•</span>
                  Creates consistent language across providers and staff
                </li>
                <li className="flex items-start text-sm">
                  <span className="text-primary mr-2">•</span>
                  Reduces repetitive explanations during busy consult days
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* SECTION 6 — SECURITY & CLINICAL SAFETY */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-xl text-center">Security & Clinical Safety</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="grid md:grid-cols-2 gap-4">
                <li className="flex items-start text-sm">
                  <span className="text-muted-foreground mr-2">•</span>
                  No image storage
                </li>
                <li className="flex items-start text-sm">
                  <span className="text-muted-foreground mr-2">•</span>
                  Session-based, ephemeral processing
                </li>
                <li className="flex items-start text-sm">
                  <span className="text-muted-foreground mr-2">•</span>
                  Encrypted transmission (HTTPS/TLS)
                </li>
                <li className="flex items-start text-sm">
                  <span className="text-muted-foreground mr-2">•</span>
                  HIPAA-friendly workflow
                </li>
                <li className="flex items-start text-sm">
                  <span className="text-muted-foreground mr-2">•</span>
                  Clinician-only access during active sessions
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* DISCLAIMER */}
          <div className="text-center text-sm text-muted-foreground mb-8 p-4 border border-border/40 rounded-lg">
            <p className="mb-2">
              <strong>For dental professionals only.</strong>
            </p>
            <p>
              This AI-assisted tool is for informational use only. It is not a diagnosis and does not replace clinical judgment, full records, or comprehensive examination. The summary is based solely on the uploaded panoramic image and may not capture all clinical details.
            </p>
          </div>

          {/* SUPPORT LINK */}
          <div className="text-center mb-4">
            <Button
              variant="outline"
              asChild
            >
              <a href="mailto:steven@jaredco.com?subject=Ortho Scan Tool feedback">
                Contact Support
              </a>
            </Button>
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
                Please wait while we generate your evaluation report PDF...
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
                Your evaluation report PDF has been successfully downloaded!
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
