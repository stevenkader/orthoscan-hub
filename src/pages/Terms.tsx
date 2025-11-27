
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const Terms = () => {
  return (
    <div className="flex min-h-screen flex-col">
      <Navigation />
      
      <main className="flex-1 container py-12 md:py-16">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl mb-6">Terms of Service</h1>
          
          <div className="prose prose-slate max-w-none">
            <p className="text-lg mb-4 text-muted-foreground">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
              <p>
                Welcome to SimpleInsights.ai. These Terms of Service ("Terms") govern your use of our website, services, and applications (collectively, the "Services"). By accessing or using our Services, you agree to be bound by these Terms.
              </p>
              <p>
                Please read these Terms carefully. If you do not agree to all of these Terms, you may not access or use our Services.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">2. Use of Services</h2>
              
              <h3 className="text-xl font-medium mb-2">2.1 Account Registration</h3>
              <p>
                To access certain features of our Services, you may be required to register for an account. You must provide accurate and complete information and keep your account information updated.
              </p>
              
              <h3 className="text-xl font-medium mb-2 mt-4">2.2 Account Security</h3>
              <p>
                You are responsible for safeguarding the password that you use to access our Services and for any activities or actions under your account. We encourage you to use strong passwords and to keep your account information secure.
              </p>
              
              <h3 className="text-xl font-medium mb-2 mt-4">2.3 Acceptable Use</h3>
              <p>
                You agree not to use our Services:
              </p>
              <ul className="list-disc pl-6 mt-2">
                <li>In any way that violates any applicable local, state, national, or international law or regulation</li>
                <li>To transmit or upload any material that contains viruses, Trojan horses, worms, or any other harmful programs</li>
                <li>To attempt to gain unauthorized access to our servers, systems, or networks</li>
                <li>To interfere with or disrupt the integrity or performance of our Services</li>
                <li>To collect or track the personal information of others</li>
              </ul>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">3. Subscription and Payment</h2>
              
              <h3 className="text-xl font-medium mb-2">3.1 Free Trial</h3>
              <p>
                We may offer a free trial period for our Services. At the end of the trial period, you will be charged for the subscription plan you selected unless you cancel before the trial ends.
              </p>
              
              <h3 className="text-xl font-medium mb-2 mt-4">3.2 Payment</h3>
              <p>
                You agree to pay all fees associated with your subscription plan. All payments are non-refundable unless otherwise specified in our refund policy.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">4. Intellectual Property</h2>
              <p>
                Our Services and its original content, features, and functionality are owned by SimpleInsights.ai and are protected by international copyright, trademark, patent, trade secret, and other intellectual property or proprietary rights laws.
              </p>
              <p>
                You retain all rights to your data. By uploading or sharing data through our Services, you grant us a worldwide, non-exclusive, royalty-free license to use, copy, process, and display your data for the purpose of providing and improving our Services.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">5. Disclaimer of Warranties</h2>
              <p>
                Our Services are provided "as is" and "as available" without warranties of any kind, either express or implied, including, but not limited to, implied warranties of merchantability, fitness for a particular purpose, or non-infringement.
              </p>
              <p>
                We do not warrant that our Services will be uninterrupted, secure, or error-free, that defects will be corrected, or that our Services or the server that makes it available are free of viruses or other harmful components.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">6. Limitation of Liability</h2>
              <p>
                In no event shall SimpleInsights.ai, its officers, directors, employees, or agents be liable for any indirect, punitive, incidental, special, or consequential damages arising out of or in any way connected with the use of our Services.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">7. Changes to Terms</h2>
              <p>
                We reserve the right to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.
              </p>
              <p>
                By continuing to access or use our Services after any revisions become effective, you agree to be bound by the revised terms.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">8. Governing Law</h2>
              <p>
                These Terms shall be governed and construed in accordance with the laws of [Your Jurisdiction], without regard to its conflict of law provisions.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">9. Contact Us</h2>
              <p>
                If you have any questions about these Terms, please contact us at:
              </p>
              <p className="mt-2">
                <strong>Email:</strong> legal@simpleinsights.ai
              </p>
            </section>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Terms;
