
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ScrollToTop from "./components/ScrollToTop";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Privacy from "./pages/Privacy";
import Contact from "./pages/Contact";
import Terms from "./pages/Terms";
import FAQ from "./pages/FAQ";
import Testimonials from "./pages/Testimonials";
import LegalAssistant from "./pages/LegalAssistant";
import MedicalReports from "./pages/MedicalReports";
import TranslationAssistant from "./pages/TranslationAssistant";
import OrthodonticAnalyzer from "./pages/OrthodonticAnalyzer";
import OrthodonticAnalytics from "./pages/OrthodonticAnalytics";
import Auth from "./pages/Auth";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/testimonials" element={<Testimonials />} />
          <Route path="/legal-assistant" element={<LegalAssistant />} />
          <Route path="/medical-reports" element={<MedicalReports />} />
          <Route path="/translation-assistant" element={<TranslationAssistant />} />
          <Route path="/orthodontic-analyzer" element={<OrthodonticAnalyzer />} />
          <Route path="/ortho-internal-stats" element={<OrthodonticAnalytics />} />
          <Route path="/auth" element={<Auth />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
