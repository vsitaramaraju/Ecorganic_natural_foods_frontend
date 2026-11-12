import { useEffect, useMemo, useRef, useState } from "react";
import HeroSection from "../../components/HeroSection";
import { CtaBanner, TrustBar, WhySection } from "../../components/HomeSections";
import {
  CARD_LIST_LIMITS,
  DEFAULT_BANNER,
  MAX_BANNER_HIGHLIGHTS,
  MAX_BANNER_STATS,
  resolveBannerImage
} from "../../constants/homeBanner";
import { fetchHomeBanner, resetHomeBanner, saveHomeBanner } from "./adminShared";
import "../Home.css"; // hero styles, so the live preview matches the home page

const TEXT_FIELDS = [
  "badge",
  "title",
  "description",
  "primaryButtonText",
  "primaryButtonLink",
  "secondaryButtonText",
  "secondaryButtonLink",
  "imageAlt",
  "whyTitle",
  "whySubtitle",
  "ctaTitle",
  "ctaText",
  "ctaButtonText",
  "ctaButtonLink"
];

const BOOLEAN_FIELDS = ["isVisible", "trustVisible", "whyVisible", "ctaVisible"];
const CARD_FIELDS = ["trustItems", "whyCards"];

const TABS = [
  { key: "hero", label: "Hero banner", visibleField: "isVisible" },
  { key: "trust", label: "Trust badges", visibleField: "trustVisible" },
  { key: "why", label: "Why-us cards", visibleField: "whyVisible" },
  { key: "cta", label: "Sign-up banner", visibleField: "ctaVisible" }
];

const ALLOWED_IMAGE_EXT = ["jpg", "jpeg", "png", "gif", "webp"];
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

const isSafeLink = link =>
  link === "" ||
  link === "#products" ||
  (link.startsWith("/") && !link.startsWith("//")) ||
  /^https?:\/\/\S+$/i.test(link);

// Keep only the fields the editor works with.
const toForm = banner => ({
  ...Object.fromEntries(BOOLEAN_FIELDS.map(f => [f, banner[f] !== false])),
  ...Object.fromEntries(
    CARD_FIELDS.map(f => [
      f,
      (banner[f] || []).map(c => ({ icon: c.icon || "", title: c.title || "", text: c.text || "" }))
    ])
  ),
  ...Object.fromEntries(TEXT_FIELDS.map(f => [f, banner[f] ?? ""])),
  stats: (banner.stats || []).map(s => ({ value: s.value || "", label: s.label || "" })),
  highlights: [...(banner.highlights || [])],
  imageUrl: banner.imageUrl || null
});

const hasCardContent = c => c.title.trim() || c.text.trim();

// Editor for a list of { icon, title, text } cards.
function CardListEditor({ label, cards, limits, onChange, textMultiline }) {
  const update = (index, key, value) =>
    onChange(cards.map((c, i) => (i === index ? { ...c, [key]: value } : c)));
  const move = (index, delta) => {
    const next = [...cards];
    const [card] = next.splice(index, 1);
    next.splice(index + delta, 0, card);
    onChange(next);
  };

  return (
    <div className="banner-list admin-form-full">
      {cards.map((card, i) => (
        <div className="banner-card-row" key={i}>
          <div className="banner-card-fields">
            <input
              className="banner-card-icon"
              aria-label={`${label} ${i + 1} icon`}
              value={card.icon}
              maxLength={limits.fields.icon}
              onChange={e => update(i, "icon", e.target.value)}
              placeholder="🌿"
            />
            <input
              aria-label={`${label} ${i + 1} title`}
              value={card.title}
              maxLength={limits.fields.title}
              onChange={e => update(i, "title", e.target.value)}
              placeholder="Title"
            />
            {textMultiline ? (
              <textarea
                className="banner-card-text"
                aria-label={`${label} ${i + 1} text`}
                rows={2}
                value={card.text}
                maxLength={limits.fields.text}
                onChange={e => update(i, "text", e.target.value)}
                placeholder="Description"
              />
            ) : (
              <input
                className="banner-card-text"
                aria-label={`${label} ${i + 1} text`}
                value={card.text}
                maxLength={limits.fields.text}
                onChange={e => update(i, "text", e.target.value)}
                placeholder="Short line under the title"
              />
            )}
          </div>
          <div className="banner-card-actions">
            <button
              type="button"
              className="banner-move"
              aria-label={`Move ${label} ${i + 1} up`}
              disabled={i === 0}
              onClick={() => move(i, -1)}
            >
              ↑
            </button>
            <button
              type="button"
              className="banner-move"
              aria-label={`Move ${label} ${i + 1} down`}
              disabled={i === cards.length - 1}
              onClick={() => move(i, 1)}
            >
              ↓
            </button>
            <button
              type="button"
              className="banner-remove"
              aria-label={`Remove ${label} ${i + 1}`}
              onClick={() => onChange(cards.filter((_, j) => j !== i))}
            >
              ×
            </button>
          </div>
        </div>
      ))}
      {cards.length < limits.max && (
        <button
          type="button"
          className="btn btn-secondary btn-small"
          onClick={() => onChange([...cards, { icon: "", title: "", text: "" }])}
        >
          + Add {label.toLowerCase()}
        </button>
      )}
    </div>
  );
}

const LINK_HINT = 'Use "#products" to scroll to products, a page like "/categories", or a full https:// URL.';

export default function AdminHomeBanner() {
  const [saved, setSaved] = useState(() => toForm(DEFAULT_BANNER));
  const [form, setForm] = useState(() => toForm(DEFAULT_BANNER));
  const [isDefault, setIsDefault] = useState(true);
  const [imageFile, setImageFile] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [tab, setTab] = useState("hero");
  const [message, setMessage] = useState({ type: "", text: "" });
  const fileInputRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const banner = await fetchHomeBanner();
        setSaved(toForm(banner));
        setForm(toForm(banner));
        setIsDefault(Boolean(banner?.isDefault));
      } catch (e) {
        setMessage({
          type: "error",
          text: e?.response?.data?.message || e?.message || "Failed to load banner"
        });
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // Local preview URL for a newly chosen image file.
  const filePreviewUrl = useMemo(
    () => (imageFile ? URL.createObjectURL(imageFile) : null),
    [imageFile]
  );
  useEffect(() => () => filePreviewUrl && URL.revokeObjectURL(filePreviewUrl), [filePreviewUrl]);

  const previewImage =
    filePreviewUrl || resolveBannerImage(removeImage ? null : form.imageUrl);

  const isDirty =
    Boolean(imageFile) || removeImage || JSON.stringify(form) !== JSON.stringify(saved);

  const setField = (field, value) => setForm(p => ({ ...p, [field]: value }));

  const setStat = (index, key, value) =>
    setForm(p => ({
      ...p,
      stats: p.stats.map((s, i) => (i === index ? { ...s, [key]: value } : s))
    }));

  const setHighlight = (index, value) =>
    setForm(p => ({
      ...p,
      highlights: p.highlights.map((h, i) => (i === index ? value : h))
    }));

  const handleImageChange = e => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!ALLOWED_IMAGE_EXT.includes(ext) || !file.type.startsWith("image/")) {
      setMessage({ type: "error", text: "Please choose a jpg, jpeg, png, gif or webp image." });
      e.target.value = "";
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setMessage({ type: "error", text: "Image must be 10 MB or smaller." });
      e.target.value = "";
      return;
    }
    setMessage({ type: "", text: "" });
    setImageFile(file);
    setRemoveImage(false);
  };

  const clearChosenFile = () => {
    setImageFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const discardChanges = () => {
    setForm(saved);
    clearChosenFile();
    setRemoveImage(false);
    setMessage({ type: "", text: "" });
  };

  const validate = () => {
    if (!form.title.trim()) return "Title is required.";
    if (!isSafeLink(form.primaryButtonLink.trim()))
      return `Primary button link is not valid. ${LINK_HINT}`;
    if (!isSafeLink(form.secondaryButtonLink.trim()))
      return `Secondary button link is not valid. ${LINK_HINT}`;
    if (!isSafeLink(form.ctaButtonLink.trim()))
      return `Sign-up banner button link is not valid. ${LINK_HINT}`;
    return "";
  };

  const handleSave = async e => {
    e.preventDefault();
    const error = validate();
    if (error) {
      setMessage({ type: "error", text: error });
      return;
    }

    const data = new FormData();
    TEXT_FIELDS.forEach(f => data.append(f, form[f].trim()));
    BOOLEAN_FIELDS.forEach(f => data.append(f, String(form[f])));
    CARD_FIELDS.forEach(f =>
      data.append(f, JSON.stringify(form[f].filter(hasCardContent)))
    );
    data.append(
      "stats",
      JSON.stringify(form.stats.filter(s => s.value.trim() || s.label.trim()))
    );
    data.append("highlights", JSON.stringify(form.highlights.filter(h => h.trim())));
    if (imageFile) data.append("image", imageFile);
    else if (removeImage) data.append("removeImage", "true");

    try {
      setIsSaving(true);
      setMessage({ type: "", text: "" });
      const banner = await saveHomeBanner(data);
      setSaved(toForm(banner));
      setForm(toForm(banner));
      setIsDefault(false);
      clearChosenFile();
      setRemoveImage(false);
      setMessage({ type: "success", text: "Saved. The home page now shows these changes." });
    } catch (e) {
      setMessage({
        type: "error",
        text: e?.response?.data?.message || e?.response?.data?.error || e?.message || "Failed to save banner"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    try {
      setIsSaving(true);
      const banner = await resetHomeBanner();
      setSaved(toForm(banner));
      setForm(toForm(banner));
      setIsDefault(true);
      clearChosenFile();
      setRemoveImage(false);
      setMessage({ type: "success", text: "Home page content restored to the default design." });
    } catch (e) {
      setMessage({
        type: "error",
        text: e?.response?.data?.message || e?.message || "Failed to reset banner"
      });
    } finally {
      setIsSaving(false);
      setConfirmReset(false);
    }
  };

  if (isLoading) return <p>Loading home banner...</p>;

  const hasCustomImage = Boolean(form.imageUrl) && !removeImage;
  const activeTab = TABS.find(t => t.key === tab);

  return (
    <div className="admin-stack">
      {/* Section tabs */}
      <div className="banner-tabs" role="tablist" aria-label="Home page sections">
        {TABS.map(t => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            className={`banner-tab ${tab === t.key ? "active" : ""}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
            {!form[t.visibleField] && <span className="banner-tab-off">hidden</span>}
          </button>
        ))}
      </div>

      {/* Live preview */}
      <section className="card admin-section">
        <div className="banner-editor-head">
          <h3>Live Preview</h3>
          <div className="banner-editor-tags">
            {isDefault && !isDirty && <span className="banner-tag">Default design</span>}
            {isDirty && <span className="banner-tag banner-tag-warn">Unsaved changes</span>}
            {!form[activeTab.visibleField] && (
              <span className="banner-tag banner-tag-muted">Hidden on home page</span>
            )}
            {tab === "cta" && (
              <span className="banner-tag banner-tag-muted">Shown to logged-out visitors</span>
            )}
          </div>
        </div>
        <div className={`banner-preview home ${form[activeTab.visibleField] ? "" : "is-hidden"}`}>
          {tab === "hero" && (
            <HeroSection banner={form} imageSrc={previewImage} onAction={() => {}} />
          )}
          {tab === "trust" && <TrustBar items={form.trustItems} />}
          {tab === "why" && (
            <WhySection title={form.whyTitle} subtitle={form.whySubtitle} cards={form.whyCards} />
          )}
          {tab === "cta" && (
            <CtaBanner
              title={form.ctaTitle}
              text={form.ctaText}
              buttonText={form.ctaButtonText}
              buttonLink={form.ctaButtonLink}
              onAction={() => {}}
            />
          )}
        </div>
      </section>

      {/* Editor */}
      <section className="card admin-section">
        <h3>Customize: {activeTab.label}</h3>
        {message.text && (
          <div className={`alert ${message.type === "error" ? "alert-error" : "alert-success"}`}>
            {message.text}
          </div>
        )}

        <form className="admin-form-grid" onSubmit={handleSave}>
          {tab === "hero" && (
            <>
          <label className="banner-toggle admin-form-full">
            <input
              type="checkbox"
              checked={form.isVisible}
              onChange={e => setField("isVisible", e.target.checked)}
            />
            <span>Show this banner on the home page</span>
          </label>

          <h4 className="banner-group-title admin-form-full">Text</h4>
          <div className="form-group">
            <label htmlFor="hb-badge">Badge</label>
            <input
              id="hb-badge"
              value={form.badge}
              maxLength={60}
              onChange={e => setField("badge", e.target.value)}
              placeholder="e.g. 🌱 100% Certified Organic"
            />
          </div>
          <div className="form-group">
            <label htmlFor="hb-title">Title *</label>
            <textarea
              id="hb-title"
              rows={2}
              value={form.title}
              maxLength={120}
              onChange={e => setField("title", e.target.value)}
              placeholder="Press Enter for a new line"
            />
          </div>
          <div className="form-group admin-form-full">
            <label htmlFor="hb-desc">Description</label>
            <textarea
              id="hb-desc"
              rows={3}
              value={form.description}
              maxLength={400}
              onChange={e => setField("description", e.target.value)}
            />
          </div>

          <h4 className="banner-group-title admin-form-full">Buttons</h4>
          <div className="form-group">
            <label htmlFor="hb-p-text">Primary button text</label>
            <input
              id="hb-p-text"
              value={form.primaryButtonText}
              maxLength={30}
              onChange={e => setField("primaryButtonText", e.target.value)}
              placeholder="Leave empty to hide"
            />
          </div>
          <div className="form-group">
            <label htmlFor="hb-p-link">Primary button link</label>
            <input
              id="hb-p-link"
              value={form.primaryButtonLink}
              maxLength={300}
              onChange={e => setField("primaryButtonLink", e.target.value)}
              placeholder="#products"
            />
          </div>
          <div className="form-group">
            <label htmlFor="hb-s-text">Secondary button text</label>
            <input
              id="hb-s-text"
              value={form.secondaryButtonText}
              maxLength={30}
              onChange={e => setField("secondaryButtonText", e.target.value)}
              placeholder="Leave empty to hide"
            />
          </div>
          <div className="form-group">
            <label htmlFor="hb-s-link">Secondary button link</label>
            <input
              id="hb-s-link"
              value={form.secondaryButtonLink}
              maxLength={300}
              onChange={e => setField("secondaryButtonLink", e.target.value)}
              placeholder="/categories"
            />
          </div>
          <small className="banner-hint admin-form-full">{LINK_HINT}</small>

          <h4 className="banner-group-title admin-form-full">
            Stats <span>({form.stats.length}/{MAX_BANNER_STATS})</span>
          </h4>
          <div className="banner-list admin-form-full">
            {form.stats.map((s, i) => (
              <div className="banner-list-row" key={i}>
                <input
                  aria-label={`Stat ${i + 1} value`}
                  value={s.value}
                  maxLength={20}
                  onChange={e => setStat(i, "value", e.target.value)}
                  placeholder="500+"
                />
                <input
                  aria-label={`Stat ${i + 1} label`}
                  value={s.label}
                  maxLength={40}
                  onChange={e => setStat(i, "label", e.target.value)}
                  placeholder="Products"
                />
                <button
                  type="button"
                  className="banner-remove"
                  aria-label={`Remove stat ${i + 1}`}
                  onClick={() => setField("stats", form.stats.filter((_, j) => j !== i))}
                >
                  ×
                </button>
              </div>
            ))}
            {form.stats.length < MAX_BANNER_STATS && (
              <button
                type="button"
                className="btn btn-secondary btn-small"
                onClick={() => setField("stats", [...form.stats, { value: "", label: "" }])}
              >
                + Add stat
              </button>
            )}
          </div>

          <h4 className="banner-group-title admin-form-full">
            Image highlight cards <span>({form.highlights.length}/{MAX_BANNER_HIGHLIGHTS})</span>
          </h4>
          <div className="banner-list admin-form-full">
            {form.highlights.map((h, i) => (
              <div className="banner-list-row banner-list-row-single" key={i}>
                <input
                  aria-label={`Highlight ${i + 1}`}
                  value={h}
                  maxLength={40}
                  onChange={e => setHighlight(i, e.target.value)}
                  placeholder="e.g. 🚚 Next Day Delivery"
                />
                <button
                  type="button"
                  className="banner-remove"
                  aria-label={`Remove highlight ${i + 1}`}
                  onClick={() => setField("highlights", form.highlights.filter((_, j) => j !== i))}
                >
                  ×
                </button>
              </div>
            ))}
            {form.highlights.length < MAX_BANNER_HIGHLIGHTS && (
              <button
                type="button"
                className="btn btn-secondary btn-small"
                onClick={() => setField("highlights", [...form.highlights, ""])}
              >
                + Add highlight
              </button>
            )}
          </div>

          <h4 className="banner-group-title admin-form-full">Image</h4>
          <div className="banner-image-row admin-form-full">
            <img src={previewImage} alt="" className="banner-image-thumb" />
            <div className="banner-image-actions">
              <input
                ref={fileInputRef}
                id="hb-image"
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handleImageChange}
              />
              <small className="banner-hint">
                jpg, png, gif or webp, up to 10 MB. A portrait image (4:5) fits best.
              </small>
              <div className="banner-image-buttons">
                {imageFile && (
                  <button type="button" className="btn btn-secondary btn-small" onClick={clearChosenFile}>
                    Cancel new image
                  </button>
                )}
                {!imageFile && hasCustomImage && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-small"
                    onClick={() => setRemoveImage(true)}
                  >
                    Use default image
                  </button>
                )}
                {removeImage && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-small"
                    onClick={() => setRemoveImage(false)}
                  >
                    Keep current image
                  </button>
                )}
              </div>
            </div>
          </div>
          <div className="form-group admin-form-full">
            <label htmlFor="hb-alt">Image description (for screen readers)</label>
            <input
              id="hb-alt"
              value={form.imageAlt}
              maxLength={150}
              onChange={e => setField("imageAlt", e.target.value)}
              placeholder="e.g. Fresh organic produce"
            />
          </div>
            </>
          )}

          {tab === "trust" && (
            <>
              <label className="banner-toggle admin-form-full">
                <input
                  type="checkbox"
                  checked={form.trustVisible}
                  onChange={e => setField("trustVisible", e.target.checked)}
                />
                <span>Show the trust badges (home page bar and product pages)</span>
              </label>
              <h4 className="banner-group-title admin-form-full">
                Badges{" "}
                <span>
                  ({form.trustItems.length}/{CARD_LIST_LIMITS.trustItems.max})
                </span>
              </h4>
              <CardListEditor
                label="Badge"
                cards={form.trustItems}
                limits={CARD_LIST_LIMITS.trustItems}
                onChange={v => setField("trustItems", v)}
              />
              <small className="banner-hint admin-form-full">
                These badges appear in the bar under the home page hero and in the box
                under "Add to Cart" on every product page. Badges with no title and no
                text are left out when you save.
              </small>
            </>
          )}

          {tab === "why" && (
            <>
              <label className="banner-toggle admin-form-full">
                <input
                  type="checkbox"
                  checked={form.whyVisible}
                  onChange={e => setField("whyVisible", e.target.checked)}
                />
                <span>Show the why-us section on the home page</span>
              </label>
              <div className="form-group">
                <label htmlFor="hb-why-title">Section title</label>
                <input
                  id="hb-why-title"
                  value={form.whyTitle}
                  maxLength={80}
                  onChange={e => setField("whyTitle", e.target.value)}
                  placeholder="e.g. Why EchOrganics?"
                />
              </div>
              <div className="form-group">
                <label htmlFor="hb-why-sub">Section subtitle</label>
                <input
                  id="hb-why-sub"
                  value={form.whySubtitle}
                  maxLength={200}
                  onChange={e => setField("whySubtitle", e.target.value)}
                />
              </div>
              <h4 className="banner-group-title admin-form-full">
                Cards{" "}
                <span>
                  ({form.whyCards.length}/{CARD_LIST_LIMITS.whyCards.max})
                </span>
              </h4>
              <CardListEditor
                label="Card"
                cards={form.whyCards}
                limits={CARD_LIST_LIMITS.whyCards}
                onChange={v => setField("whyCards", v)}
                textMultiline
              />
              <small className="banner-hint admin-form-full">
                Cards with no title and no text are left out when you save.
              </small>
            </>
          )}

          {tab === "cta" && (
            <>
              <label className="banner-toggle admin-form-full">
                <input
                  type="checkbox"
                  checked={form.ctaVisible}
                  onChange={e => setField("ctaVisible", e.target.checked)}
                />
                <span>Show the sign-up banner to logged-out visitors</span>
              </label>
              <div className="form-group">
                <label htmlFor="hb-cta-title">Title</label>
                <input
                  id="hb-cta-title"
                  value={form.ctaTitle}
                  maxLength={80}
                  onChange={e => setField("ctaTitle", e.target.value)}
                  placeholder="e.g. Ready to eat healthier?"
                />
              </div>
              <div className="form-group">
                <label htmlFor="hb-cta-text">Text</label>
                <input
                  id="hb-cta-text"
                  value={form.ctaText}
                  maxLength={200}
                  onChange={e => setField("ctaText", e.target.value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="hb-cta-btn">Button text</label>
                <input
                  id="hb-cta-btn"
                  value={form.ctaButtonText}
                  maxLength={40}
                  onChange={e => setField("ctaButtonText", e.target.value)}
                  placeholder="Leave empty to hide"
                />
              </div>
              <div className="form-group">
                <label htmlFor="hb-cta-link">Button link</label>
                <input
                  id="hb-cta-link"
                  value={form.ctaButtonLink}
                  maxLength={300}
                  onChange={e => setField("ctaButtonLink", e.target.value)}
                  placeholder="/register"
                />
              </div>
              <small className="banner-hint admin-form-full">{LINK_HINT}</small>
            </>
          )}

          <small className="banner-hint admin-form-full">
            Save applies changes from all tabs at once.
          </small>
          <div className="admin-form-actions admin-form-full">
            <div className="banner-image-buttons">
              <button className="btn btn-primary" type="submit" disabled={isSaving || !isDirty}>
                {isSaving ? "Saving…" : "Save changes"}
              </button>
              <button
                className="btn btn-secondary"
                type="button"
                onClick={discardChanges}
                disabled={isSaving || !isDirty}
              >
                Discard changes
              </button>
            </div>
            <button
              className="btn btn-secondary"
              type="button"
              onClick={() => setConfirmReset(true)}
              disabled={isSaving || isDefault}
            >
              Restore defaults
            </button>
          </div>
        </form>
      </section>

      {confirmReset && (
        <div className="modal-overlay" onClick={() => setConfirmReset(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h3>Restore default home page content?</h3>
            <p>
              This replaces the hero banner, trust badges, why-us cards and sign-up
              banner (including any uploaded image) with the original design. This
              cannot be undone.
            </p>
            <div className="admin-form-actions">
              <button className="btn btn-primary" onClick={handleReset} disabled={isSaving}>
                {isSaving ? "Restoring…" : "Yes, restore default"}
              </button>
              <button className="btn btn-secondary" onClick={() => setConfirmReset(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
