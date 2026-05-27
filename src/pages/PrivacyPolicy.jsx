import "./StaticPage.css";

const SECTIONS = [
  {
    title: "1. Information We Collect",
    content: `When you use EchOrganics, we may collect the following types of information:

• Personal Information: Name, email address, phone number, and delivery addresses provided during registration or checkout.
• Payment Information: We do not store card details. Payments are processed securely through third-party payment gateways (Razorpay, Stripe).
• Order Data: History of your purchases, returns, and wishlists.
• Device & Usage Data: IP address, browser type, pages visited, and referring URLs to improve our services.
• Communication Data: Messages sent to our support team.`
  },
  {
    title: "2. How We Use Your Information",
    content: `We use your information to:

• Process and fulfill your orders
• Send order confirmations, shipping updates, and delivery notifications
• Provide customer support and resolve disputes
• Personalize your shopping experience and recommend products
• Analyze usage patterns to improve our platform
• Send promotional offers (only if you've opted in)
• Comply with legal obligations`
  },
  {
    title: "3. Data Sharing & Disclosure",
    content: `We do not sell, trade, or rent your personal information. We may share data with:

• Delivery Partners: Name and address shared only for order fulfillment.
• Payment Processors: Transaction data shared securely with authorized payment gateways.
• Analytics Providers: Anonymized usage data for platform improvement.
• Legal Authorities: When required by law, court order, or to protect our rights.

All third-party partners are contractually bound to handle your data securely.`
  },
  {
    title: "4. Cookies & Tracking",
    content: `We use cookies and similar technologies to:

• Keep you logged in across sessions
• Remember cart contents and preferences
• Analyze traffic and user behavior
• Serve relevant promotions

You can disable cookies in your browser settings, but this may affect functionality. We use both session cookies (deleted when you close the browser) and persistent cookies (stored for a set duration).`
  },
  {
    title: "5. Data Security",
    content: `We implement industry-standard security measures:

• SSL/TLS encryption for all data transmission
• Encrypted storage of sensitive data
• Regular security audits and penetration testing
• Strict access controls — only authorized staff can access user data
• Two-factor authentication for admin accounts

Despite our best efforts, no system is completely secure. Please report any security concerns to security@echorganics.in.`
  },
  {
    title: "6. Your Rights",
    content: `You have the right to:

• Access: Request a copy of your personal data we hold.
• Correction: Update inaccurate or incomplete information via your Profile settings.
• Deletion: Request deletion of your account and associated data.
• Opt-out: Unsubscribe from marketing emails at any time.
• Portability: Request your data in a portable format.

To exercise these rights, contact us at privacy@echorganics.in.`
  },
  {
    title: "7. Data Retention",
    content: `We retain your data for as long as your account is active. After account deletion:

• Order records are retained for 7 years as required by Indian tax law.
• Personal identifiers are anonymized within 30 days.
• Backup data is permanently deleted within 90 days.`
  },
  {
    title: "8. Children's Privacy",
    content: `EchOrganics is not intended for users under the age of 13. We do not knowingly collect personal information from children. If we discover we have collected data from a child, it will be promptly deleted. Parents or guardians who believe their child has provided data should contact us immediately.`
  },
  {
    title: "9. Changes to This Policy",
    content: `We may update this Privacy Policy periodically. When we make significant changes, we'll notify you via email or a prominent notice on our website. Your continued use of EchOrganics after changes constitutes acceptance of the updated policy.`
  },
  {
    title: "10. Contact Us",
    content: `For privacy-related questions or concerns:

📧 Email: privacy@echorganics.in
📞 Phone: +91 98765 43210
📍 Address: EchOrganics Pvt Ltd, Vijayawada, Andhra Pradesh – 520001

We aim to respond to all privacy requests within 72 hours.`
  }
];

export default function PrivacyPolicy() {
  return (
    <div className="static-page container">
      <div className="static-hero">
        <span className="static-icon">🔒</span>
        <h1 className="section-title">Privacy Policy</h1>
        <p className="section-subtitle">Last updated: January 1, 2025</p>
        <div
          className="alert alert-info"
          style={{ maxWidth: 640, margin: "0 auto" }}
        >
          Your privacy matters deeply to us. This policy explains what data we
          collect, how we use it, and your rights.
        </div>
      </div>

      <div className="static-content card">
        {SECTIONS.map(section => (
          <div key={section.title} className="static-section">
            <h2>{section.title}</h2>
            <div className="static-text">
              {section.content.split("\n").map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
