
import React from 'react';
import { Helmet } from 'react-helmet';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const Testimonials = () => {
  const testimonials = [
    {
      id: 1,
      name: "Sarah Johnson",
      role: "Corporate Lawyer",
      avatar: "SJ",
      quote: "SimpleInsights.ai has transformed the way I review contracts. What used to take hours now takes minutes, allowing me to focus on more strategic aspects of my work.",
    },
    {
      id: 2,
      name: "David Chen",
      role: "Healthcare Administrator",
      avatar: "DC",
      quote: "The medical reports analysis tool has been invaluable for our clinic. It helps us quickly identify key information from complex medical documents and improves our overall efficiency.",
    },
    {
      id: 3,
      name: "Maria Rodriguez",
      role: "International Business Consultant",
      avatar: "MR",
      quote: "As someone who works with clients across multiple countries, the translation assistant has been a game-changer. It provides accurate translations that capture the nuances of legal and business terms.",
    },
    {
      id: 4,
      name: "James Wilson",
      role: "Small Business Owner",
      avatar: "JW",
      quote: "I used to avoid complex legal documents because I found them intimidating. With SimpleInsights.ai, I can finally understand what I'm signing and make informed decisions for my business.",
    },
    {
      id: 5,
      name: "Emily Tanaka",
      role: "Research Scientist",
      avatar: "ET",
      quote: "The platform has helped me analyze research papers and medical studies much more efficiently. It extracts the key findings and presents them in a clear, concise manner.",
    },
    {
      id: 6,
      name: "Michael Okonkwo",
      role: "Compliance Officer",
      avatar: "MO",
      quote: "In the financial industry, staying compliant is critical. SimpleInsights.ai helps me quickly review regulatory documents and identify compliance requirements, saving me countless hours.",
    },
  ];

  return (
    <>
      <Helmet>
        <title>Testimonials - SimpleInsights.ai</title>
        <meta name="description" content="See what our customers are saying about SimpleInsights.ai" />
      </Helmet>
      
      <Navigation />
      
      <main className="container py-12 md:py-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">Customer Testimonials</h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Discover how SimpleInsights.ai is helping professionals across industries simplify complex documents and improve their productivity.
            </p>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2">
            {testimonials.map((testimonial) => (
              <Card key={testimonial.id} className="border shadow-sm">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-10 w-10 border">
                      <AvatarFallback className="bg-insights-blue text-white">
                        {testimonial.avatar}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <h3 className="font-medium">{testimonial.name}</h3>
                      <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="text-muted-foreground italic">"{testimonial.quote}"</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
      
      <Footer />
    </>
  );
};

export default Testimonials;
