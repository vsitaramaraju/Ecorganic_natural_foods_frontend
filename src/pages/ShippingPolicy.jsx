import "./StaticPage.css";
import { Link } from "react-router-dom";

const SECTIONS = [
  {
    title: "1. Shipping Locations",
    content: `
•We currently ship orders across India.
•Shipping availability may vary for certain pin codes depending on courier service covergae.`
  },
  {
    title: "2. Order Processing Times",
    content: `• Orders are processed within 1-2 business days after payment confirmation.
    • Orders placed on weekends or public holidays will be processed on the next business day.`
  },
  {
    title: "3. Delivery Timeline",
    content: `• Estimated delivery time is 3-7 business days from the date of dispatch, depending on your destination.
    • Delivery timelines may be affected by courier delays, weather conditions, strikes, or other unforeseen circumstances.`
  },
  {
    title: "4. Shipping Charges",
    content: `• Shipping charges, if applicable, will be displayed at checkout before payment.
    • In some cases, free shipping may be offered during promotions.`
  },
  {
    title: "5. Tracking Orders",
    content: `• Once shipped, you will receive a tracking ID and courier details via SMS/email.`
  },
  {
    title: "6. Return Eligibility",
    content: `• Returns are provided only in the following situations:
    1. You received a damaged or defective product.
    2. You received the wrong product.`
  },
  {
    title: "7. Refund Process",
    content: `• Notify us within 24 hours of delivery by email at ecorganicplanet@gmail.com or call +91 9182536959.
    • Kindly provide 360 degrees unboxing video of the parcel received and additional add clear photos of the product and packaging.
    • Upon verification, the refund will be processed within 7-10 business days to your original payment method.`
  },
  {
    title: "8. Order Cancellation",
    content: `• Orders can be cancelled within 1 hour of placement.
• After 1 hour, cancellation is not possible as the order may have been packed.
• If the delivery partner is unable to deliver after 3 attempts, the order will be cancelled and a full refund issued.
• In case of natural disasters or extreme weather, we may cancel orders and issue full refunds.`
  },
  {
    title: "9. Damaged in Transit",
    content: `If a product is damaged during transit, please:

1. Do not accept the delivery if the outer box is severely damaged.
2. If you've accepted it, photograph the damage immediately.
3. Report via the app within 24 hours with photos.

We'll arrange a replacement or full refund within 24 hours of approval.`
  },
  {
    title: "10. Contact for Shipping Issues",
    content: `📧 Email: ecorganicplanet@gmail.com
📞 Phone: +91 9182536959 (Mon–Sat, 9 AM–6 PM)


For urgent delivery issues, call us — we prioritize delivery complaints.`
  }
];

export default function ShippingPolicy() {
  return (
    <div className="static-page container">
      <div className="static-hero">
        <span className="static-icon">🚚</span>
        <h1 className="section-title">Shipping & Return Policy</h1>
        <p className="section-subtitle">Last updated: August 27, 2026</p>
      </div>

      {/* Quick highlights */}
      <div
        className="shipping-highlight-grid"
        style={{ maxWidth: 800, margin: "0 auto var(--space-xl)" }}
      >
        {/* <div className="shipping-highlight">
          <span className="sh-icon">🚀</span>
          <h3>24–48 Hr Delivery</h3>
          <p>Same-day available in Vijayawada</p>
        </div>
        <div className="shipping-highlight">
          <span className="sh-icon">🆓</span>
          <h3>Free Delivery</h3>
          <p>On orders above ₹499</p>
        </div>
        <div className="shipping-highlight">
          <span className="sh-icon">🔄</span>
          <h3>Easy Returns</h3>
          <p>Report within 24 hours, refund in 5 days</p>
        </div> */}
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

      <div style={{ textAlign: "center", marginTop: "var(--space-xl)" }}>
        <p style={{ color: "var(--color-text-muted)", marginBottom: 12 }}>
          Still have questions about shipping or returns?
        </p>
        <Link to="/contact-us" className="btn btn-primary">
          Contact Support →
        </Link>
      </div>
    </div>
  );
}
