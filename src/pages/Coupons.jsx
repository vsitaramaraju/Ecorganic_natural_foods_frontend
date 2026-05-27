import { useState } from "react";
import "./Coupons.css";

const COUPONS = [
  {
    code: "WELCOME20",
    discount: "20% OFF",
    description: "First order discount for new customers",
    minOrder: 299,
    maxDiscount: 100,
    validity: "31 Dec 2025",
    type: "percent",
    category: "New User",
    emoji: "🎁",
    color: "green"
  },
  {
    code: "FRESH50",
    discount: "₹50 OFF",
    description: "Flat ₹50 off on fresh vegetables orders",
    minOrder: 499,
    maxDiscount: 50,
    validity: "31 Mar 2025",
    type: "flat",
    category: "Vegetables",
    emoji: "🥦",
    color: "teal"
  },
  {
    code: "ORGANIC15",
    discount: "15% OFF",
    description: "15% off on all certified organic products",
    minOrder: 599,
    maxDiscount: 150,
    validity: "28 Feb 2025",
    type: "percent",
    category: "Organic",
    emoji: "🌿",
    color: "green"
  },
  {
    code: "FREEDEL",
    discount: "FREE Delivery",
    description: "Free delivery on any order, any value",
    minOrder: 0,
    maxDiscount: null,
    validity: "15 Jan 2025",
    type: "delivery",
    category: "Delivery",
    emoji: "🚚",
    color: "blue"
  },
  {
    code: "FRUITS10",
    discount: "10% OFF",
    description: "10% off on all seasonal fruits",
    minOrder: 299,
    maxDiscount: 80,
    validity: "28 Feb 2025",
    type: "percent",
    category: "Fruits",
    emoji: "🍎",
    color: "orange"
  },
  {
    code: "DAIRY25",
    discount: "₹25 OFF",
    description: "Flat ₹25 off on dairy & eggs category",
    minOrder: 200,
    maxDiscount: 25,
    validity: "31 Jan 2025",
    type: "flat",
    category: "Dairy",
    emoji: "🥛",
    color: "yellow"
  }
];

const OFFERS = [
  {
    emoji: "📦",
    title: "Buy 2 Get 1 Free",
    desc: "On select grocery combos — add 3 items, pay for 2!",
    badge: "HOT"
  },
  {
    emoji: "🌾",
    title: "Subscription Box — 15% Off",
    desc: "Subscribe to weekly veggie or fruit box and save 15% every week.",
    badge: "SAVE"
  },
  {
    emoji: "👥",
    title: "Refer & Earn ₹100",
    desc: "Refer a friend. When they place their first order, you both get ₹100 wallet credit!",
    badge: "NEW"
  },
  {
    emoji: "🎂",
    title: "Birthday Bonus",
    desc: "Get 25% off on your birthday month! Update your birthday in Profile settings.",
    badge: "🎉"
  }
];

export default function Coupons() {
  const [copied, setCopied] = useState(null);
  const [activeTab, setActiveTab] = useState("coupons");

  const handleCopy = code => {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="coupons-page container">
      <div className="coupons-hero">
        <span style={{ fontSize: "3rem", display: "block", marginBottom: 12 }}>
          🎉
        </span>
        <h1 className="section-title">Coupons & Offers</h1>
        <p className="section-subtitle">
          Exclusive deals to make organic living more affordable
        </p>
      </div>

      <div className="coupons-tabs">
        <button
          className={`faq-tab ${activeTab === "coupons" ? "active" : ""}`}
          onClick={() => setActiveTab("coupons")}
        >
          🏷️ Coupon Codes
        </button>
        <button
          className={`faq-tab ${activeTab === "offers" ? "active" : ""}`}
          onClick={() => setActiveTab("offers")}
        >
          🔥 Special Offers
        </button>
      </div>

      {activeTab === "coupons" && (
        <>
          <div className="coupons-note alert alert-info">
            💡 Copy any coupon code and paste it at checkout to apply the
            discount.
          </div>
          <div className="coupons-grid">
            {COUPONS.map(coupon => (
              <div
                key={coupon.code}
                className={`coupon-card coupon-${coupon.color}`}
              >
                <div className="coupon-left">
                  <span className="coupon-emoji">{coupon.emoji}</span>
                  <span className="coupon-category badge badge-primary">
                    {coupon.category}
                  </span>
                </div>
                <div className="coupon-body">
                  <div className="coupon-discount">{coupon.discount}</div>
                  <p className="coupon-desc">{coupon.description}</p>
                  <div className="coupon-meta">
                    {coupon.minOrder > 0 && (
                      <span>Min. order: ₹{coupon.minOrder}</span>
                    )}
                    {coupon.maxDiscount && (
                      <span>Max. discount: ₹{coupon.maxDiscount}</span>
                    )}
                    <span>Valid till: {coupon.validity}</span>
                  </div>
                </div>
                <div className="coupon-right">
                  <div className="coupon-code-box">
                    <span className="coupon-code">{coupon.code}</span>
                    <button
                      className={`btn btn-primary btn-small ${copied === coupon.code ? "copied" : ""}`}
                      onClick={() => handleCopy(coupon.code)}
                    >
                      {copied === coupon.code ? "✅ Copied!" : "Copy"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {activeTab === "offers" && (
        <div className="offers-grid">
          {OFFERS.map(offer => (
            <div key={offer.title} className="offer-card card">
              <div className="offer-header">
                <span className="offer-emoji">{offer.emoji}</span>
                <span className="offer-badge badge badge-warning">
                  {offer.badge}
                </span>
              </div>
              <h3>{offer.title}</h3>
              <p>{offer.desc}</p>
              <a
                href="/shop"
                className="btn btn-secondary btn-small"
                style={{ marginTop: "auto" }}
              >
                Shop Now →
              </a>
            </div>
          ))}
        </div>
      )}

      <div
        className="coupons-terms card"
        style={{ marginTop: "var(--space-xl)" }}
      >
        <h3>📋 Terms & Conditions</h3>
        <ul>
          <li>Coupon codes are single-use unless stated otherwise.</li>
          <li>Only one coupon can be applied per order.</li>
          <li>Coupons cannot be combined with other ongoing offers.</li>
          <li>
            EchOrganics reserves the right to modify or cancel offers without
            prior notice.
          </li>
          <li>Cashback and wallet credits expire 6 months from issue date.</li>
          <li>
            Referral credits are awarded only after the referee places and
            completes their first order.
          </li>
        </ul>
      </div>
    </div>
  );
}
