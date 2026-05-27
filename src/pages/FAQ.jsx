import { useState } from "react";
import "./FAQ.css";

const FAQS = [
  {
    category: "Orders & Delivery",
    icon: "📦",
    items: [
      {
        q: "How long does delivery take?",
        a: "We deliver within 24–48 hours of placing your order. Same-day delivery is available in Vijayawada for orders placed before 12 PM."
      },
      {
        q: "What is the minimum order value for free delivery?",
        a: "Orders above ₹499 qualify for free home delivery. A flat delivery charge of ₹49 applies for orders below this amount."
      },
      {
        q: "Can I track my order?",
        a: "Yes! Once your order is shipped, you'll receive a tracking link via email and SMS. You can also check order status in the 'My Orders' section."
      },
      {
        q: "Do you deliver on Sundays and holidays?",
        a: "We deliver Monday through Saturday. On public holidays, deliveries may be delayed by one business day."
      }
    ]
  },
  {
    category: "Products & Quality",
    icon: "🌿",
    items: [
      {
        q: "Are all products 100% organic?",
        a: "Absolutely. Every product on EchOrganics is certified organic and sourced directly from verified partner farms. We conduct regular third-party lab testing."
      },
      {
        q: "How do you ensure product freshness?",
        a: "Products are harvested within 24 hours of dispatch. We use eco-friendly cold-chain packaging to maintain freshness during transit."
      },
      {
        q: "Where are your products sourced from?",
        a: "We partner with 50+ farms across Andhra Pradesh, Telangana, and Karnataka. All farms follow certified organic cultivation practices."
      },
      {
        q: "Do you offer seasonal products?",
        a: "Yes! Our catalog changes seasonally to offer you the freshest produce. Subscribe to our newsletter to stay updated."
      }
    ]
  },
  {
    category: "Returns & Refunds",
    icon: "🔄",
    items: [
      {
        q: "What is your return policy?",
        a: "We offer hassle-free returns within 24 hours of delivery if the product is damaged, spoiled, or incorrect. Fresh produce must be reported on the same day."
      },
      {
        q: "How do I initiate a return?",
        a: "Go to My Orders, select the order, click 'Return/Issue', describe the problem and upload a photo. Our team will respond within 4 hours."
      },
      {
        q: "How long does the refund take?",
        a: "Approved refunds are processed within 3–5 business days back to your original payment method. UPI and wallet refunds are usually instant."
      },
      {
        q: "Can I cancel my order?",
        a: "Orders can be cancelled within 1 hour of placing them. After that, cancellation is not possible as items may already be packed."
      }
    ]
  },
  {
    category: "Payments & Offers",
    icon: "💳",
    items: [
      {
        q: "What payment methods do you accept?",
        a: "We accept UPI (GPay, PhonePe, Paytm), credit/debit cards, net banking, and cash on delivery (COD)."
      },
      {
        q: "Is COD available?",
        a: "Yes, Cash on Delivery is available for all orders up to ₹2,000. COD orders above this amount are not accepted."
      },
      {
        q: "How do I apply a coupon code?",
        a: "Add items to your cart, proceed to checkout, and enter your coupon code in the 'Promo Code' field. Valid discounts will be applied automatically."
      },
      {
        q: "Do you offer subscription discounts?",
        a: "Yes! Subscribe to weekly or monthly vegetable/fruit boxes and get up to 15% off regular pricing plus priority delivery."
      }
    ]
  },
  {
    category: "Account & Privacy",
    icon: "🔒",
    items: [
      {
        q: "How do I reset my password?",
        a: "Click 'Forgot Password' on the login page, enter your registered email, and follow the OTP verification steps."
      },
      {
        q: "Is my personal data safe?",
        a: "We take data security seriously. All personal information is encrypted and never sold to third parties. Read our Privacy Policy for full details."
      },
      {
        q: "Can I have multiple delivery addresses?",
        a: "Yes! You can save multiple addresses in your profile under 'My Addresses' and select the desired one at checkout."
      }
    ]
  }
];

export default function FAQ() {
  const [openItem, setOpenItem] = useState(null);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const categories = ["All", ...FAQS.map(f => f.category)];

  const filtered = FAQS.map(section => ({
    ...section,
    items: section.items.filter(
      item =>
        item.q.toLowerCase().includes(search.toLowerCase()) ||
        item.a.toLowerCase().includes(search.toLowerCase())
    )
  })).filter(
    section =>
      (activeCategory === "All" || section.category === activeCategory) &&
      section.items.length > 0
  );

  const toggleItem = key => setOpenItem(openItem === key ? null : key);

  return (
    <div className="faq-page container">
      <div className="faq-hero">
        <span style={{ fontSize: "3rem", display: "block", marginBottom: 12 }}>
          ❓
        </span>
        <h1 className="section-title">Frequently Asked Questions</h1>
        <p className="section-subtitle">
          Find answers to common questions about EchOrganics
        </p>

        <div className="faq-search">
          <span className="faq-search-icon">🔍</span>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search your question…"
          />
        </div>
      </div>

      {/* Category Tabs */}
      <div className="faq-tabs">
        {categories.map(cat => (
          <button
            key={cat}
            className={`faq-tab ${activeCategory === cat ? "active" : ""}`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* FAQ Sections */}
      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <h2>No Results Found</h2>
          <p>Try different keywords or browse all categories</p>
          <button
            className="btn btn-primary"
            onClick={() => {
              setSearch("");
              setActiveCategory("All");
            }}
          >
            Clear Search
          </button>
        </div>
      ) : (
        filtered.map(section => (
          <div key={section.category} className="faq-section">
            <h2 className="faq-section-title">
              <span>{section.icon}</span> {section.category}
            </h2>
            <div className="faq-list">
              {section.items.map((item, idx) => {
                const key = `${section.category}-${idx}`;
                const isOpen = openItem === key;
                return (
                  <div
                    key={key}
                    className={`faq-item card ${isOpen ? "open" : ""}`}
                  >
                    <button
                      className="faq-question"
                      onClick={() => toggleItem(key)}
                    >
                      <span>{item.q}</span>
                      <span className="faq-chevron">{isOpen ? "▲" : "▼"}</span>
                    </button>
                    {isOpen && <div className="faq-answer">{item.a}</div>}
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}

      {/* Still have questions? */}
      <div className="faq-contact-prompt card">
        <span style={{ fontSize: "2rem" }}>💬</span>
        <div>
          <h3>Still have questions?</h3>
          <p>Our support team is happy to help you personally.</p>
        </div>
        <a href="/contact-us" className="btn btn-primary">
          Contact Us →
        </a>
      </div>
    </div>
  );
}
