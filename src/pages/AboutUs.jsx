import { Link } from "react-router-dom";
import "./AboutUs.css";

const TEAM = [
  {
    name: "Arjun Reddy",
    role: "Co-Founder & CEO",
    emoji: "👨‍🌾",
    bio: "Passionate about sustainable agriculture and connecting farmers directly to consumers."
  },
  {
    name: "Priya Sharma",
    role: "Head of Operations",
    emoji: "👩‍💼",
    bio: "Ensures every order reaches you fresh and on time, every single day."
  },
  {
    name: "Ravi Kumar",
    role: "Farm Relations Lead",
    emoji: "🧑‍🌱",
    bio: "Works directly with 50+ partner farms across Andhra Pradesh and Telangana."
  },
  {
    name: "Meena Nair",
    role: "Quality & Safety",
    emoji: "👩‍🔬",
    bio: "Certified organic food specialist ensuring every product meets our strict standards."
  }
];

const VALUES = [
  {
    icon: "🌱",
    title: "100% Organic",
    desc: "Every product is certified organic, free from harmful pesticides and chemicals."
  },
  {
    icon: "🤝",
    title: "Farmer First",
    desc: "We pay farmers fair prices and build long-term partnerships with local growers."
  },
  {
    icon: "♻️",
    title: "Eco Packaging",
    desc: "All packaging is biodegradable and compostable — zero plastic, zero guilt."
  },
  {
    icon: "🚚",
    title: "Fresh Delivery",
    desc: "From farm to your table in under 48 hours, preserving maximum nutrition."
  },
  {
    icon: "💚",
    title: "Community",
    desc: "We donate 1% of revenue to rural education programs in AP and Telangana."
  },
  {
    icon: "🔬",
    title: "Lab Tested",
    desc: "Every batch is third-party tested for quality, purity, and safety."
  }
];

const STATS = [
  { number: "50+", label: "Partner Farms" },
  { number: "10,000+", label: "Happy Customers" },
  { number: "200+", label: "Organic Products" },
  { number: "5 Cities", label: "Delivery Coverage" }
];

export default function AboutUs() {
  return (
    <div className="about-page">
      {/* Hero */}
      <section className="about-hero">
        <div className="about-hero-bg" />
        <div className="container about-hero-content">
          <span className="about-leaf">🌿</span>
          <h1 className="section-title">Our Story</h1>
          <p className="about-hero-desc">
            EchOrganics was born in 2022 from a simple belief — that everyone
            deserves access to clean, fresh, and truly organic food, sourced
            with respect for farmers and the earth.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="about-mission container">
        <div className="about-mission-grid">
          <div className="about-mission-text">
            <h2 className="section-title">Our Mission</h2>
            <p>
              We bridge the gap between organic farmers and conscious consumers,
              making healthy food accessible and affordable for every Indian
              household. By cutting out middlemen, we ensure farmers earn more
              while you pay less.
            </p>
            <p style={{ marginTop: 16 }}>
              From the lush farms of Andhra Pradesh to your kitchen, every
              product carries the care of the hand that grew it.
            </p>
            <Link
              to="/shop"
              className="btn btn-primary"
              style={{ marginTop: 24 }}
            >
              Explore Our Products →
            </Link>
          </div>
          <div className="about-mission-visual">
            <div className="about-mission-card">
              <span style={{ fontSize: "4rem" }}>🌾</span>
              <p>
                "Good food starts with good soil, good seeds, and good people."
              </p>
              <strong>— Arjun Reddy, Co-founder</strong>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="about-stats">
        <div className="container about-stats-grid">
          {STATS.map(s => (
            <div key={s.label} className="about-stat">
              <span className="about-stat-number">{s.number}</span>
              <span className="about-stat-label">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Values */}
      <section className="about-values container">
        <h2 className="section-title" style={{ textAlign: "center" }}>
          What We Stand For
        </h2>
        <p className="section-subtitle" style={{ textAlign: "center" }}>
          Our core values guide every decision we make
        </p>
        <div className="about-values-grid">
          {VALUES.map(v => (
            <div key={v.title} className="about-value-card card">
              <span className="about-value-icon">{v.icon}</span>
              <h3>{v.title}</h3>
              <p>{v.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Team */}
      <section className="about-team container">
        <h2 className="section-title" style={{ textAlign: "center" }}>
          Meet the Team
        </h2>
        <p className="section-subtitle" style={{ textAlign: "center" }}>
          Passionate people dedicated to organic living
        </p>
        <div className="about-team-grid">
          {TEAM.map(m => (
            <div key={m.name} className="about-team-card card">
              <div className="about-team-avatar">{m.emoji}</div>
              <h3>{m.name}</h3>
              <span className="tag">{m.role}</span>
              <p>{m.bio}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="about-cta">
        <div className="container about-cta-inner">
          <h2>Ready to Go Organic?</h2>
          <p>
            Join 10,000+ families already eating healthier with EchOrganics.
          </p>
          <div
            style={{
              display: "flex",
              gap: 12,
              justifyContent: "center",
              flexWrap: "wrap"
            }}
          >
            <Link to="/shop" className="btn btn-primary">
              Shop Now →
            </Link>
            <Link
              to="/contact-us"
              className="btn btn-secondary"
              style={{
                background: "rgba(255,255,255,0.15)",
                borderColor: "#fff",
                color: "#fff"
              }}
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
