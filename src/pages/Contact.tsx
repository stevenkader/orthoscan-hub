
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Mail } from "lucide-react";

const Contact = () => {
  return (
    <div className="flex min-h-screen flex-col">
      <Navigation />
      
      <main className="flex-1 container py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl mb-6">Contact Us</h1>
          
          <div className="mt-8">
            <h2 className="text-2xl font-semibold mb-4">Get in Touch</h2>
            <p className="text-muted-foreground mb-6">
              Have questions about how SimpleInsights.ai can help you understand complex documents? 
              Want to share feedback or just say hello? We'd love to hear from you!
            </p>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-2 rounded-full">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <a 
                  href="mailto:support@simpleinsights.ai?subject=re:%20SimpleInsights.ai" 
                  className="text-primary hover:underline"
                >
                  support@simpleinsights.ai
                </a>
              </div>
            </div>
            
            <Card className="mt-8 border-primary/20">
              <CardContent className="pt-6">
                <h3 className="font-medium mb-2">About SimpleInsights.ai</h3>
                <p className="text-sm text-muted-foreground">
                  Our mission is to help people understand complex documents without the headache. 
                  We're committed to making information accessible to everyone, completely free of charge.
                </p>
              </CardContent>
            </Card>
          </div>
          
          <div className="mt-16 bg-muted/50 rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">How SimpleInsights.ai Works</h2>
            <div className="grid sm:grid-cols-3 gap-6 text-center">
              <div className="p-4">
                <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-primary font-bold">1</span>
                </div>
                <h3 className="font-medium mb-2">Upload Your Document</h3>
                <p className="text-sm text-muted-foreground">Simply upload any complex document you need help understanding.</p>
              </div>
              
              <div className="p-4">
                <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-primary font-bold">2</span>
                </div>
                <h3 className="font-medium mb-2">AI Processing</h3>
                <p className="text-sm text-muted-foreground">Our AI breaks down complex language and terminology into clear explanations.</p>
              </div>
              
              <div className="p-4">
                <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-primary font-bold">3</span>
                </div>
                <h3 className="font-medium mb-2">Simple Results</h3>
                <p className="text-sm text-muted-foreground">Get an easy-to-read summary and explanation of your document.</p>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Contact;
