import React from "react";

// Home page content blocks whose text is set from the admin "Home Page" editor.

const hasContent = card => card?.title || card?.text;

export const TrustBar = React.memo(({ items = [] }) => {
  const visible = items.filter(hasContent);
  if (visible.length === 0) return null;
  return (
    <section className="trust-bar" style={{ "--trust-cols": visible.length }}>
      {visible.map((item, i) => (
        <div className="trust-item" key={i}>
          {item.icon && <span>{item.icon}</span>}
          {item.title && <strong>{item.title}</strong>}
          {item.text && <small>{item.text}</small>}
        </div>
      ))}
    </section>
  );
});

export const WhySection = React.memo(({ title, subtitle, cards = [] }) => {
  const visible = cards.filter(hasContent);
  if (!title && !subtitle && visible.length === 0) return null;
  return (
    <section className="home-section why-section">
      <div className="container">
        {title && (
          <h2 className="section-title" style={{ textAlign: "center" }}>
            {title}
          </h2>
        )}
        {subtitle && (
          <p className="section-subtitle" style={{ textAlign: "center" }}>
            {subtitle}
          </p>
        )}
        {visible.length > 0 && (
          <div className="why-grid">
            {visible.map((card, i) => (
              <div className="why-card" key={i}>
                {card.icon && <div className="why-icon">{card.icon}</div>}
                {card.title && <h3>{card.title}</h3>}
                {card.text && <p>{card.text}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
});

export const CtaBanner = React.memo(({ title, text, buttonText, buttonLink, onAction }) => {
  if (!title && !text && !buttonText) return null;
  return (
    <section className="cta-banner">
      <div className="cta-content">
        {title && <h2>{title}</h2>}
        {text && <p>{text}</p>}
        {buttonText && (
          <button
            type="button"
            className="btn btn-accent"
            onClick={() => onAction?.(buttonLink)}
          >
            {buttonText}
          </button>
        )}
      </div>
    </section>
  );
});
