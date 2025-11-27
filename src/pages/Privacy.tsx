
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const Privacy = () => {
  return (
    <div className="flex min-h-screen flex-col">
      <Navigation />
      
      <main className="flex-1 container py-12 md:py-16">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl mb-6">Privacy Policy</h1>
          
          <div className="prose prose-slate max-w-none">
            <p className="text-lg mb-4 text-muted-foreground">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Introduction</h2>
              <p>
                SimpleInsights.ai ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our free services.
              </p>
              <p>
                Please read this Privacy Policy carefully. By accessing or using our services, you acknowledge that you have read, understood, and agree to be bound by all the terms of this Privacy Policy.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Information We Collect</h2>
              
              <h3 className="text-xl font-medium mb-2">Personal Information</h3>
              <p>
                We may collect personally identifiable information, such as your name and email address when you register for an account to use our free services.
              </p>
              
              <h3 className="text-xl font-medium mb-2 mt-4">Personal Data Insights</h3>
              <p>
                When you use our analytics services, we collect and process the data you provide to generate insights. This data may include personal spending, fitness metrics, productivity statistics, and other information you choose to analyze.
              </p>
              
              <h3 className="text-xl font-medium mb-2 mt-4">Usage Information</h3>
              <p>
                We automatically collect certain information about your device and how you interact with our services, including:
              </p>
              <ul className="list-disc pl-6 mt-2">
                <li>Log and usage data (e.g., access times, pages viewed)</li>
                <li>Device information (e.g., hardware model, operating system)</li>
                <li>IP address and browser type</li>
                <li>Cookies and similar tracking technologies</li>
              </ul>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">How We Use Your Information</h2>
              <p>We may use the information we collect for various purposes, including to:</p>
              <ul className="list-disc pl-6 mt-2">
                <li>Provide, maintain, and improve our free services</li>
                <li>Process your data to generate personal insights</li>
                <li>Send administrative information, such as updates, security alerts, and support messages</li>
                <li>Respond to your comments, questions, and requests</li>
                <li>Understand how users interact with our services</li>
                <li>Personalize your experience and provide content recommendations</li>
                <li>Deliver service updates and important notifications</li>
                <li>Monitor and analyze trends, usage, and activities</li>
                <li>Detect, investigate, and prevent fraudulent transactions and other illegal activities</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Our Free Service Commitment</h2>
              <p>
                SimpleInsights.ai is committed to providing our service completely free of charge to individual users. We do not sell your personal data to third parties to monetize our service.
              </p>
              <p>
                To maintain our free service, we may display non-personalized ads or seek voluntary donations from users who find our service valuable, but these are completely optional and do not affect your access to our core features.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Data Security</h2>
              <p>
                We use administrative, technical, and physical security measures to protect your personal information. While we strive to use commercially acceptable means to protect your personal information, we cannot guarantee its absolute security.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Changes to This Privacy Policy</h2>
              <p>
                We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date at the top.
              </p>
              <p>
                You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy are effective when they are posted on this page.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
              <p>
                If you have any questions about this Privacy Policy, please contact us at:
              </p>
              <p className="mt-2">
                <strong>Email:</strong> privacy@simpleinsights.ai
              </p>
            </section>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Privacy;
