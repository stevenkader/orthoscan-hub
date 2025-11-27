import React from 'react';
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, FileText, FileType, Globe, Lock, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const Index = () => {
  return (
    <div className="flex min-h-screen flex-col">
      <Navigation />
      
      {/* Hero Section with Updated Text */}
      <section className="relative overflow-hidden bg-gradient-to-b from-background to-muted py-20 md:py-28">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col justify-center space-y-8 mx-auto text-center max-w-3xl">
            <div className="space-y-4">
              <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                Confused by Complex Documents? Let AI 
                <span className="gradient-text"> Break Them Down—Fast.</span>
              </h1>
              <p className="text-xl text-muted-foreground mx-auto max-w-[700px]">
                Legal contracts, medical reports, or documents in another language—SimpleInsights helps you instantly understand what matters, in plain language you can trust.
              </p>
            </div>
            
            {/* Tool Cards - Replacing the buttons with cards */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3 pt-4">
              <Card className="hover-card">
                <CardContent className="p-6">
                  <div className="flex justify-center mb-4">
                    <div className="bg-blue-100 p-4 rounded-lg">
                      <FileText className="h-8 w-8 text-insights-blue" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Legal Assistant</h3>
                  <p className="text-muted-foreground mb-4">
                    Upload PDF of legal contract to get detailed laymen explanation.
                  </p>
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <Link to="/legal-assistant" className="flex items-center justify-center">
                      Try It Now <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
              
              <Card className="hover-card">
                <CardContent className="p-6">
                  <div className="flex justify-center mb-4">
                    <div className="bg-blue-100 p-4 rounded-lg">
                      <FileType className="h-8 w-8 text-insights-blue" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Medical Assistant</h3>
                  <p className="text-muted-foreground mb-4">
                    Upload PDF of test results to understand them.
                  </p>
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <Link to="/medical-reports" className="flex items-center justify-center">
                      Try It Now <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
              
              <Card className="hover-card">
                <CardContent className="p-6">
                  <div className="flex justify-center mb-4">
                    <div className="bg-blue-100 p-4 rounded-lg">
                      <Globe className="h-8 w-8 text-insights-blue" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Expert Translator</h3>
                  <p className="text-muted-foreground mb-4">
                    Upload PDF in any language and get it translated to English.
                  </p>
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <Link to="/translation-assistant" className="flex items-center justify-center">
                      Try It Now <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="section-padding bg-muted">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <div className="inline-block rounded-lg bg-background px-3 py-1 text-sm">How It Works</div>
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                Simple process, powerful results
              </h2>
              <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Our AI-powered platform makes understanding complex documents easier than ever.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-6 pt-12 md:grid-cols-4">
            <Card className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 text-primary mb-4">
                  <span className="text-xl font-bold">1</span>
                </div>
                <h3 className="text-xl font-bold">Choose Your Tool</h3>
                <p className="text-muted-foreground mt-2">
                  Select whether you want a legal explanation, medical interpretation, or translation.
                </p>
              </CardContent>
            </Card>
            <Card className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 text-primary mb-4">
                  <span className="text-xl font-bold">2</span>
                </div>
                <h3 className="text-xl font-bold">Upload Your Document</h3>
                <p className="text-muted-foreground mt-2">
                  Simply upload the PDF, Word document, or text file you need help understanding.
                </p>
              </CardContent>
            </Card>
            <Card className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 text-primary mb-4">
                  <span className="text-xl font-bold">3</span>
                </div>
                <h3 className="text-xl font-bold">Get Clear Insights</h3>
                <p className="text-muted-foreground mt-2">
                  Receive easy-to-understand explanations, interpretations, and translations tailored to your needs.
                </p>
              </CardContent>
            </Card>
            <Card className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 text-primary mb-4">
                  <span className="text-xl font-bold">4</span>
                </div>
                <h3 className="text-xl font-bold">Save & Share</h3>
                <p className="text-muted-foreground mt-2">
                  Save your insights for future reference or easily share them with others who need to understand the document.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="section-padding">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">Use Cases</div>
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                Who can benefit?
              </h2>
              <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                SimpleInsights.ai helps people from all walks of life understand complex information.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-6 pt-12 md:grid-cols-2 lg:grid-cols-3">
            <Card className="hover-card">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold">Students</h3>
                <p className="text-muted-foreground mt-2">
                  Break down complex academic papers, textbooks, and study materials into understandable concepts.
                </p>
              </CardContent>
            </Card>
            <Card className="hover-card">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold">Researchers</h3>
                <p className="text-muted-foreground mt-2">
                  Quickly understand key findings from research papers outside your immediate field of expertise.
                </p>
              </CardContent>
            </Card>
            <Card className="hover-card">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold">General Public</h3>
                <p className="text-muted-foreground mt-2">
                  Make sense of legal documents, terms of service, insurance policies, and more without the jargon.
                </p>
              </CardContent>
            </Card>
            <Card className="hover-card">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold">Professionals</h3>
                <p className="text-muted-foreground mt-2">
                  Quickly grasp the essentials of industry reports, technical documentation, and specialized content.
                </p>
              </CardContent>
            </Card>
            <Card className="hover-card">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold">Non-Native Speakers</h3>
                <p className="text-muted-foreground mt-2">
                  Get help understanding complex documents in languages you're still mastering.
                </p>
              </CardContent>
            </Card>
            <Card className="hover-card">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold">Busy Individuals</h3>
                <p className="text-muted-foreground mt-2">
                  Save time by quickly extracting key information from lengthy documents when you're short on time.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Privacy Promise Section */}
      <section className="section-padding">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">Privacy</div>
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                Your documents stay private
              </h2>
              <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                We're committed to protecting your information and the privacy of your documents.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-6 pt-12 md:grid-cols-3">
            <Card className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex justify-center mb-4">
                  <Lock className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-center">Secure Processing</h3>
                <p className="text-muted-foreground mt-2 text-center">
                  Your documents are processed in a secure environment and never stored longer than necessary.
                </p>
              </CardContent>
            </Card>
            <Card className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex justify-center mb-4">
                  <Lock className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-center">No Data Selling</h3>
                <p className="text-muted-foreground mt-2 text-center">
                  We will never sell your data or documents to third parties. Your information stays yours.
                </p>
              </CardContent>
            </Card>
            <Card className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex justify-center mb-4">
                  <Lock className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-center">User Control</h3>
                <p className="text-muted-foreground mt-2 text-center">
                  You can delete your documents and any generated insights at any time.
                </p>
              </CardContent>
            </Card>
          </div>
          <div className="mt-10 flex justify-center">
            <Button variant="outline" asChild>
              <Link to="/privacy">Learn More About Our Privacy Policy</Link>
            </Button>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default Index;
