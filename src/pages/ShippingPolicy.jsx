import "./StaticPage.css";
import { Link } from "react-router-dom";

const SECTIONS = [
  {
    title: "1. Delivery Coverage",
    content: `We currently deliver to the following cities in Andhra Pradesh and Telangana:

• Vijayawada (same-day available)
• Guntur
• Hyderabad
• Visakhapatnam
• Tirupati
• Rajahmundry

We are rapidly expanding. Check the checkout page for delivery availability at your pincode.`
  },
  {
    title: "2. Delivery Timelines",
    content: `Standard Delivery: 24–48 hours from order placement.

Same-Day Delivery: Available in Vijayawada for orders placed before 12:00 PM (noon) on business days.

Express Delivery (4 Hours): Available in select pincodes in Vijayawada for ₹79 extra.

Business Days: Monday to Saturday, excluding public holidays. Orders placed on Sundays will be processed the next business day.`
  },
  {
    title: "3. Delivery Charges",
    content: `• Free Delivery: Orders above ₹499
• Standard Delivery Fee: ₹49 for orders below ₹499
• Same-Day Delivery: ₹29 extra (free for orders above ₹799 in Vijayawada)
• Express Delivery (4hr): ₹79 flat

We reserve the right to modify delivery charges during peak seasons or festivals.`
  },
  {
    title: "4. Order Tracking",
    content: `Once your order is dispatched, you will receive:

• An SMS with your tracking link
• An email confirmation with order details
• Real-time status updates in the 'My Orders' section of your account

If your tracking shows 'Delivered' but you haven't received the order, contact us within 24 hours.`
  },
  {
    title: "5. Return Policy",
    content: `We accept returns under the following conditions:

✅ Eligible for return:
• Damaged or spoiled products on delivery
• Wrong item delivered
• Missing items from order
• Products with broken seals

❌ Not eligible:
• Perishable produce reported after 24 hours of delivery
• Products that have been consumed or opened (unless defective)
• Items purchased during special/clearance sales (unless damaged)`
  },
  {
    title: "6. How to Request a Return",
    content: `Step 1: Go to 'My Orders' and select the order.
Step 2: Click 'Report Issue' or 'Request Return'.
Step 3: Select the item(s) and reason for return.
Step 4: Upload a clear photo of the damaged/incorrect product.
Step 5: Submit — our team will review within 4 hours.

For fresh produce, returns must be reported within 24 hours of delivery.`
  },
  {
    title: "7. Refund Policy",
    content: `Once a return is approved:

• UPI / Wallet: Refund within 1–2 hours
• Credit/Debit Card: 3–5 business days
• Net Banking: 2–4 business days
• COD: Store credit added to your EchOrganics wallet within 24 hours (bank transfer available on request)

Refund status can be tracked in your Orders section.`
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
    content: `📧 Email: support@echorganics.in
📞 Phone: +91 98765 43210 (Mon–Sat, 9 AM–6 PM)
💬 Live Chat: Available on app (Mon–Sat, 9 AM–8 PM)

For urgent delivery issues, call us — we prioritize delivery complaints.`
  }
];

export default function ShippingPolicy() {
  return (
    <div className="static-page container">
      <div className="static-hero">
        <span className="static-icon">🚚</span>
        <h1 className="section-title">Shipping & Return Policy</h1>
        <p className="section-subtitle">Last updated: January 1, 2025</p>
      </div>

      {/* Quick highlights */}
      <div
        className="shipping-highlight-grid"
        style={{ maxWidth: 800, margin: "0 auto var(--space-xl)" }}
      >
        <div className="shipping-highlight">
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
