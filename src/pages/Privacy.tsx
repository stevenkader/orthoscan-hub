import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const Privacy = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      <main className="flex-1 container py-12 md:py-16">
        <div className="max-w-3xl mx-auto prose prose-slate dark:prose-invert">
          <h1>Privacy Policy</h1>
          <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>

          <h2>Introduction</h2>
          <p>
            At Ortho Scan Tool, we take your privacy seriously. This Privacy Policy explains how we collect, 
            use, disclose, and safeguard your information when you use our orthodontic image analysis service.
          </p>

          <h2>Information We Collect</h2>
          <h3>Images and Medical Data</h3>
          <p>
            When you upload panoramic X-ray images for analysis, we temporarily process these images using 
            our AI system. We do not permanently store patient images on our servers. Images are deleted 
            immediately after analysis is complete.
          </p>

          <h3>Usage Information</h3>
          <p>
            We collect anonymous usage statistics to improve our service, including:
          </p>
          <ul>
            <li>Number of analyses performed</li>
            <li>System performance metrics</li>
            <li>Error logs for troubleshooting</li>
          </ul>

          <h3>Account Information</h3>
          <p>
            If you create an account, we collect your email address and any information you provide 
            in your profile.
          </p>

          <h2>How We Use Your Information</h2>
          <p>We use the information we collect to:</p>
          <ul>
            <li>Provide and improve our AI analysis services</li>
            <li>Send you service updates and technical notices</li>
            <li>Respond to your requests and support needs</li>
            <li>Monitor and analyze usage patterns</li>
            <li>Ensure the security of our platform</li>
          </ul>

          <h2>Data Security</h2>
          <p>
            We implement appropriate technical and organizational measures to protect your information, 
            including encryption of data in transit and at rest. However, no method of transmission over 
            the internet is 100% secure.
          </p>

          <h2>HIPAA Compliance</h2>
          <p>
            While we implement security measures consistent with healthcare data protection standards, 
            users are responsible for ensuring their use of the service complies with applicable regulations 
            including HIPAA. We recommend de-identifying patient images before upload when possible.
          </p>

          <h2>Third-Party Services</h2>
          <p>
            We use third-party services for AI processing and infrastructure. These providers are 
            carefully selected and bound by strict confidentiality agreements.
          </p>

          <h2>Your Rights</h2>
          <p>You have the right to:</p>
          <ul>
            <li>Access your personal information</li>
            <li>Correct inaccurate data</li>
            <li>Request deletion of your account</li>
            <li>Opt-out of non-essential communications</li>
          </ul>

          <h2>Children's Privacy</h2>
          <p>
            Our service is not intended for use by children under 18. We do not knowingly collect 
            information from children.
          </p>

          <h2>Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of any changes by 
            posting the new policy on this page and updating the "Last updated" date.
          </p>

          <h2>Contact Us</h2>
          <p>
            If you have questions about this Privacy Policy, please contact us at privacy@orthoscantool.com
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Privacy;
