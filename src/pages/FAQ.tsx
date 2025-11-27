import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQ = () => {
  const faqs = [
    {
      question: "What types of orthodontic images can I analyze?",
      answer: "Ortho Scan Tool currently supports panoramic X-ray images (panorex). The system is optimized for analyzing dental structures, tooth positions, and identifying potential orthodontic issues."
    },
    {
      question: "How accurate is the AI analysis?",
      answer: "Our AI model is trained on thousands of orthodontic cases and provides highly accurate preliminary assessments. However, the analysis should always be reviewed by a qualified orthodontist and is intended to support, not replace, professional judgment."
    },
    {
      question: "Is my patient data secure?",
      answer: "Yes, we take data security very seriously. All images are processed securely, and we do not store patient images permanently. Our system complies with healthcare data protection standards."
    },
    {
      question: "Can I download the analysis reports?",
      answer: "Yes, you can download comprehensive PDF reports of the AI analysis, including all findings, recommendations, and anatomical observations."
    },
    {
      question: "What happens after I upload an image?",
      answer: "Once you upload a panoramic X-ray, our AI analyzes the image and provides a detailed report covering dental anatomy, tooth positioning, potential issues, and treatment recommendations within seconds."
    },
    {
      question: "Do I need special software to use Ortho Scan Tool?",
      answer: "No, Ortho Scan Tool is entirely web-based. You just need a modern web browser and an internet connection. No downloads or installations required."
    },
    {
      question: "Can I use this for patient consultations?",
      answer: "Absolutely! The detailed reports and visual analysis are perfect for explaining findings to patients and discussing treatment options."
    },
    {
      question: "What image formats are supported?",
      answer: "We support common image formats including JPG, JPEG, and PNG. Images should be clear and properly oriented for best results."
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      <main className="flex-1 container py-12 md:py-16">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold">Frequently Asked Questions</h1>
            <p className="text-xl text-muted-foreground">
              Everything you need to know about Ortho Scan Tool
            </p>
          </div>

          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default FAQ;
