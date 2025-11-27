import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const Terms = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      <main className="flex-1 container py-12 md:py-16">
        <div className="max-w-3xl mx-auto prose prose-slate dark:prose-invert">
          <h1>Terms of Service</h1>
          <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>

          <h2>Agreement to Terms</h2>
          <p>
            By accessing or using Ortho Scan Tool, you agree to be bound by these Terms of Service. 
            If you disagree with any part of these terms, you may not access the service.
          </p>

          <h2>Description of Service</h2>
          <p>
            Ortho Scan Tool provides AI-powered analysis of orthodontic panoramic X-ray images. 
            The service is designed to assist dental professionals in their clinical assessments 
            but does not replace professional judgment.
          </p>

          <h2>Professional Use Only</h2>
          <p>
            This service is intended for use by licensed dental and orthodontic professionals only. 
            By using this service, you represent that you are a qualified healthcare professional.
          </p>

          <h2>Medical Disclaimer</h2>
          <p>
            <strong>IMPORTANT:</strong> The AI analysis provided by Ortho Scan Tool is for informational 
            purposes only and should not be considered a substitute for professional medical advice, 
            diagnosis, or treatment. All analyses should be reviewed and verified by a qualified orthodontist 
            before making any treatment decisions.
          </p>

          <h2>User Responsibilities</h2>
          <p>You agree to:</p>
          <ul>
            <li>Provide accurate information when using the service</li>
            <li>Maintain the confidentiality of your account credentials</li>
            <li>Comply with all applicable laws and regulations, including HIPAA</li>
            <li>Use the service only for its intended professional purpose</li>
            <li>Not attempt to reverse engineer or compromise the service</li>
            <li>Ensure proper patient consent before uploading images</li>
          </ul>

          <h2>Intellectual Property</h2>
          <p>
            The service, including all content, features, and functionality, is owned by Ortho Scan Tool 
            and is protected by international copyright, trademark, and other intellectual property laws.
          </p>

          <h2>Limitation of Liability</h2>
          <p>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, ORTHO SCAN TOOL SHALL NOT BE LIABLE FOR ANY INDIRECT, 
            INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF 
            PROFITS, DATA, USE, OR OTHER INTANGIBLE LOSSES RESULTING FROM YOUR USE OF THE SERVICE.
          </p>

          <h2>Accuracy and Reliability</h2>
          <p>
            While we strive for high accuracy, we do not guarantee that the AI analysis will be error-free 
            or uninterrupted. Users are responsible for verifying all information before making clinical decisions.
          </p>

          <h2>Account Termination</h2>
          <p>
            We reserve the right to terminate or suspend your account immediately, without prior notice, 
            for any violation of these Terms of Service.
          </p>

          <h2>Changes to Service</h2>
          <p>
            We reserve the right to modify or discontinue the service at any time without notice. We shall 
            not be liable to you or any third party for any modification, suspension, or discontinuance 
            of the service.
          </p>

          <h2>Governing Law</h2>
          <p>
            These Terms shall be governed by and construed in accordance with the laws of the jurisdiction 
            in which Ortho Scan Tool operates, without regard to its conflict of law provisions.
          </p>

          <h2>Changes to Terms</h2>
          <p>
            We reserve the right to update these Terms of Service at any time. We will notify users of 
            any material changes by posting the new terms on this page.
          </p>

          <h2>Contact Information</h2>
          <p>
            If you have any questions about these Terms of Service, please contact us at legal@orthoscantool.com
          </p>

          <h2>Acceptance of Terms</h2>
          <p>
            By using Ortho Scan Tool, you acknowledge that you have read, understood, and agree to be 
            bound by these Terms of Service.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Terms;
