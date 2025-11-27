
import React from 'react';
import { Helmet } from 'react-helmet';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import PageBreadcrumbs from '@/components/PageBreadcrumbs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

// FAQ data to use in both the visible content and structured data
const faqData = [
  {
    question: "What is SimpleInsights.ai?",
    answer: "SimpleInsights.ai is a platform that transforms complex documents into easily understandable insights. Our AI-powered tools help you analyze legal documents, medical reports, and translate content between languages."
  },
  {
    question: "How does the Legal Assistant feature work?",
    answer: "Our Legal Assistant uses advanced AI to analyze legal documents, contracts, and agreements. Simply upload your document, and our system will extract key information, identify potential issues, and provide a plain-language summary of the most important aspects."
  },
  {
    question: "Is my data secure when using SimpleInsights.ai?",
    answer: "Yes, we take data security very seriously. All document uploads are encrypted, and we don't store your documents longer than necessary for processing. Our system is designed with privacy in mind, and we adhere to strict data protection standards. For more details, please review our Privacy Policy."
  },
  {
    question: "Can I use SimpleInsights.ai for professional work?",
    answer: "Yes, SimpleInsights.ai is designed for both personal and professional use. However, we recommend that professionals use our insights as a supplementary tool rather than a replacement for expert judgment. Our AI provides valuable analysis, but critical decisions should always involve human expertise."
  },
  {
    question: "How accurate is the Translation Assistant?",
    answer: "Our Translation Assistant provides high-quality translations across multiple languages. While it achieves a high degree of accuracy, translation involves nuance that AI systems continue to improve upon. For critical documents, we recommend having a human translator review the output, especially for legal or technical content."
  },
  {
    question: "What file formats are supported?",
    answer: "Currently, we only support PDF documents. For best results, we recommend using PDF files with searchable text. We're working to expand support for additional file formats in the future."
  },
  {
    question: "Is there a limit on document size or length?",
    answer: "Yes, there are some limitations. Free accounts can process documents up to 10 pages or 5MB in size. Premium subscriptions allow for larger documents up to 50 pages or 25MB. For exceptionally large documents, please contact our support team for custom solutions."
  },
  {
    question: "How can I get help if I have a problem?",
    answer: "For any issues or questions, you can reach our support team through the Contact page. We typically respond within 24 hours on business days. Premium users have access to expedited support through our dedicated support channel."
  }
];

const FAQ = () => {
  // Create the schema.org JSON-LD structured data for FAQPage
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqData.map(item => ({
      "@type": "Question",
      "name": item.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": item.answer
      }
    }))
  };

  return (
    <>
      <Helmet>
        <title>Frequently Asked Questions - SimpleInsights.ai</title>
        <meta name="description" content="Find answers to common questions about SimpleInsights.ai services, including legal document analysis, medical report interpretation, and translation assistance." />
        <link rel="canonical" href="https://simpleinsights.ai/faq" />
        <script type="application/ld+json">
          {JSON.stringify(faqSchema)}
        </script>
      </Helmet>
      
      <Navigation />
      
      <main className="container py-12 md:py-20">
        <div className="max-w-3xl mx-auto">
          <PageBreadcrumbs items={[{ label: "FAQ" }]} />
          
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">Frequently Asked Questions</h1>
            <p className="text-muted-foreground text-lg">
              Find answers to the most common questions about SimpleInsights.ai
            </p>
          </div>
          
          <Accordion type="single" collapsible className="w-full">
            {faqData.map((faq, index) => (
              <AccordionItem key={`item-${index + 1}`} value={`item-${index + 1}`}>
                <AccordionTrigger className="text-left">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent>
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </main>
      
      <Footer />
    </>
  );
};

export default FAQ;
