import "./StaticPage.css";

const SECTIONS = [
  {
    title: "1. Information We Collect",
    content: `We my collect:

• Personal details such as name, phone number, email address, and delivery address when you create an account or place an order.
• Payment Information for processing transactions.
• Order history and preferences.
• Website usage data through cookies and analytics tools.`
  },
  {
    title: "2. How We Use Your Information",
    content: `We use your information to:

• Process and deliver orders.
• Communicate about order updates, offers and promotions.
• Improve our products, services, and website.
• Comply with legal obligations.`
  },
  {
    title: "3. Sharing of information",
    content: `We may share your information with:

• We do not sell or rent your personal information.
• We may share data with trusted service providers (e.g., courier and payment gateways) for order fulfillment.
• We may disclose information if required by law or for frqaud prevention.`
  },
  {
    title: "4. Data Security",
    content: `
• We use secure payment gateways and encryption to protect your information.
• While we take all reasonable precautions, no online system is 100% secure.`
  },
  {
    title: "5. Cookies",
    content: `

• Our website uses cookies to enhance your browsing experience and analyze traffic.
• You may disable cookies in your browser settings, but some features may not function properly.`
  },
  {
    title: "6. Your Rights",
    content: `

• Request access to your personal data.
• Request correction or deletion of your data.
• Deletion: Request deletion of your account and associated data.
• Opt-out: Unsubscribe from marketing emails at any time.
• Portability: Request your data in a portable format.`
  },
  {
    title: "7. Contact Us",
    content: `For privacy-related questions or concerns:

📧 Email: ecorganicplanet@gmail.com
📞 Phone: +91 9182536959
📍 Address: V4/86-1,pamavatipuram,tirupati -517501`
  }
];

export default function PrivacyPolicy() {
  return (
    <div className="static-page container">
      <div className="static-hero">
        <span className="static-icon">🔒</span>
        <h1 className="section-title">Privacy Policy</h1>
        <p className="section-subtitle">Last updated: August 27, 2026</p>
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
