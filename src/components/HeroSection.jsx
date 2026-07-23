import React from "react";

const HeroSection = React.memo(({ scrollProducts, navigate }) => {
  return (
    <section className="hero">
      <div className="hero-content">
        <span className="hero-badge">🌱 100% Certified Organic</span>
        <h1 className="hero-title">
          Nature's Best,
          <br />
          Delivered Fresh
        </h1>
        <p className="hero-desc">
          From local farms to your table — hand-picked organic produce, dairy,
          grains and superfoods with zero compromises.
        </p>
        <div className="hero-cta">
          <button className="btn btn-primary hero-btn" onClick={scrollProducts}>
            Shop Now
          </button>
          <button
            className="btn btn-secondary hero-btn"
            onClick={() => navigate("/categories")}
          >
            Browse Categories
          </button>
        </div>
        <div className="hero-stats">
          <div className="stat">
            <strong>500+</strong>
            <span>Products</span>
          </div>
          <div className="stat">
            <strong>50+</strong>
            <span>Farms</span>
          </div>
          <div className="stat">
            <strong>10K+</strong>
            <span>Happy Customers</span>
          </div>
        </div>
      </div>
      <div className="hero-visual">
        <div className="hero-image-wrap">
          <img
            src="/images/hero.webp"
            alt="Fresh organic produce"
            width="700"
            height="700"
            fetchPriority="low"
            decoding="async"
          />
        </div>
        <div className="floating-card card-1">🥕 Freshly Harvested</div>
        <div className="floating-card card-2">✅ Chemical Free</div>
        <div className="floating-card card-3">🚚 Next Day Delivery</div>
      </div>
    </section>
  );
});

export default HeroSection;
