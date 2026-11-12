import React from "react";
import { DEFAULT_BANNER, resolveBannerImage } from "../constants/homeBanner";

/**
 * Home page hero banner. Content comes from the admin "Home Banner" page.
 *
 * Props:
 *  - banner:   banner settings (falls back to DEFAULT_BANNER)
 *  - onAction: called with a button's link ("#products", "/path" or "https://…")
 *  - imageSrc: optional image override (used by the admin live preview)
 */
const HeroSection = React.memo(({ banner = DEFAULT_BANNER, onAction, imageSrc }) => {
  const titleLines = String(banner.title || "").split("\n");
  const stats = (banner.stats || []).filter(s => s?.value || s?.label);
  const highlights = (banner.highlights || []).filter(Boolean);
  const buttons = [
    {
      text: banner.primaryButtonText,
      link: banner.primaryButtonLink,
      className: "btn btn-primary hero-btn"
    },
    {
      text: banner.secondaryButtonText,
      link: banner.secondaryButtonLink,
      className: "btn btn-secondary hero-btn"
    }
  ].filter(b => b.text);

  return (
    <section className="hero">
      <div className="hero-content">
        {banner.badge && <span className="hero-badge">{banner.badge}</span>}
        <h1 className="hero-title">
          {titleLines.map((line, i) => (
            <React.Fragment key={i}>
              {i > 0 && <br />}
              {line}
            </React.Fragment>
          ))}
        </h1>
        {banner.description && <p className="hero-desc">{banner.description}</p>}
        {buttons.length > 0 && (
          <div className="hero-cta">
            {buttons.map(b => (
              <button
                key={b.className}
                type="button"
                className={b.className}
                onClick={() => onAction?.(b.link)}
              >
                {b.text}
              </button>
            ))}
          </div>
        )}
        {stats.length > 0 && (
          <div className="hero-stats">
            {stats.map((s, i) => (
              <div className="stat" key={i}>
                <strong>{s.value}</strong>
                <span>{s.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="hero-visual">
        <div className="hero-image-wrap">
          <img
            src={imageSrc || resolveBannerImage(banner.imageUrl)}
            alt={banner.imageAlt || ""}
            width="700"
            height="700"
            fetchPriority="low"
            decoding="async"
          />
        </div>
        {highlights.map((text, i) => (
          <div className={`floating-card card-${i + 1}`} key={i}>
            {text}
          </div>
        ))}
      </div>
    </section>
  );
});

export default HeroSection;
