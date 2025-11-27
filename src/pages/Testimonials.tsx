import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";

const Testimonials = () => {
  const testimonials = [
    {
      name: "Dr. Sarah Mitchell",
      role: "Orthodontist, Seattle Dental",
      image: "/lovable-uploads/2450b74d-1c56-441f-9c90-f49d416bab18.png",
      rating: 5,
      text: "Ortho Scan Tool has revolutionized how I analyze patient X-rays. The AI insights are incredibly accurate and save me hours of analysis time."
    },
    {
      name: "Dr. James Chen",
      role: "Orthodontic Specialist, Bay Area Orthodontics",
      image: "/lovable-uploads/5c13581b-fcb9-4171-84c8-8fe704a7ed87.png",
      rating: 5,
      text: "The detailed analysis reports help me explain treatment plans to patients more effectively. This tool is now an essential part of my practice."
    },
    {
      name: "Dr. Emily Rodriguez",
      role: "Clinical Director, Smile Center",
      image: "/lovable-uploads/e5929e74-86fd-4bea-a10a-90ffc51ca1c8.png",
      rating: 5,
      text: "Outstanding accuracy and incredibly intuitive. Our entire team uses Ortho Scan Tool daily for case planning and patient consultations."
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      <main className="flex-1 container py-12 md:py-16">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold">What Orthodontists Say</h1>
            <p className="text-xl text-muted-foreground">
              Trusted by dental professionals worldwide
            </p>
          </div>

          <div className="grid gap-8 md:gap-12">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="overflow-hidden">
                <CardContent className="p-6 md:p-8">
                  <div className="flex gap-4 items-start">
                    <img
                      src={testimonial.image}
                      alt={testimonial.name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                    <div className="flex-1 space-y-4">
                      <div>
                        <div className="flex gap-1 mb-2">
                          {Array.from({ length: testimonial.rating }).map((_, i) => (
                            <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                          ))}
                        </div>
                        <p className="text-lg leading-relaxed">{testimonial.text}</p>
                      </div>
                      <div>
                        <p className="font-semibold">{testimonial.name}</p>
                        <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Testimonials;
