import { useEffect, useMemo, useState } from "react";
import { FestivalRibbon } from "../../components/FestivalTheme";
import {
  FESTIVAL_THEMES,
  FESTIVAL_THEME_KEYS,
  MAX_FESTIVAL_MESSAGE
} from "../../constants/festivalThemes";
import { setCachedFestivalTheme } from "../../utils/useFestivalTheme";
import { getApiErrorMessage } from "../../utils/apiError";
import { fetchFestivalTheme, saveFestivalTheme } from "./adminShared";
import "./AdminFestivalTheme.css";

const EMPTY_FORM = { theme: "none", message: "", endDate: "", recolor: true, decorations: true };

// "2026-11-15T18:29:59.000Z" -> "2026-11-15" in the admin's local time zone.
const toDateInput = iso => {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = n => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

// The theme stays on until the end of the chosen day (local time).
const toEndOfDayIso = date => (date ? new Date(`${date}T23:59:59`).toISOString() : null);

const todayInput = () => toDateInput(new Date().toISOString());

const formFromSettings = s => ({
  theme: s?.theme || "none",
  message: s?.message || "",
  endDate: toDateInput(s?.endsAt),
  recolor: s?.recolor ?? true,
  decorations: s?.decorations ?? true
});

// Admin → Festival Theme: switch the storefront to a festival look.
export default function AdminFestivalTheme() {
  const [saved, setSaved] = useState(null); // settings as returned by the API
  const [form, setForm] = useState(EMPTY_FORM);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    let active = true;
    fetchFestivalTheme()
      .then(settings => {
        if (!active) return;
        setSaved(settings);
        setForm(formFromSettings(settings));
      })
      .catch(err => {
        if (active) {
          setMessage({ type: "error", text: getApiErrorMessage(err, "Couldn't load the festival theme") });
        }
      })
      .finally(() => active && setIsLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const savedForm = useMemo(() => formFromSettings(saved), [saved]);
  const isDirty = JSON.stringify(form) !== JSON.stringify(savedForm);
  const selected = FESTIVAL_THEMES[form.theme];
  const setField = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const handleSave = async e => {
    e.preventDefault();
    setIsSaving(true);
    setMessage({ type: "", text: "" });
    try {
      const settings = await saveFestivalTheme({
        theme: form.theme,
        message: form.message.trim(),
        endsAt: form.theme === "none" ? null : toEndOfDayIso(form.endDate),
        recolor: form.recolor,
        decorations: form.decorations
      });
      setSaved(settings);
      setForm(formFromSettings(settings));
      setCachedFestivalTheme(settings);
      setMessage({
        type: "success",
        text:
          settings.theme === "none"
            ? "Saved. The festival theme is switched off."
            : `Saved. The ${FESTIVAL_THEMES[settings.theme]?.name} theme is now live on the store.`
      });
    } catch (err) {
      setMessage({ type: "error", text: getApiErrorMessage(err, "Couldn't save the festival theme") });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="loading-wrap">
        <div className="spinner" />
      </div>
    );
  }

  const liveTheme = saved?.active ? FESTIVAL_THEMES[saved.theme] : null;
  const savedExpired = saved && saved.theme !== "none" && !saved.active;

  return (
    <div className="admin-stack">
      {/* Current status */}
      <section className="card admin-section">
        <h3>Festival Theme</h3>
        <p className="ft-intro">
          Give the store a festive look: a greeting strip above the menu, festival colours for
          buttons and highlights, and decorations that gently fall when a page opens.
        </p>
        <div className={`ft-status ${liveTheme ? "is-live" : ""}`}>
          {liveTheme ? (
            <>
              <strong>
                {liveTheme.emoji} {liveTheme.name} is live
              </strong>
              {saved.endsAt && (
                <span> · switches off automatically after {new Date(saved.endsAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</span>
              )}
            </>
          ) : savedExpired ? (
            <strong>
              The {FESTIVAL_THEMES[saved.theme]?.name} theme has ended. Pick a festival to start a new one.
            </strong>
          ) : (
            <strong>No festival theme is showing. The store uses its normal green look.</strong>
          )}
        </div>
      </section>

      <section className="card admin-section">
        {message.text && (
          <div className={`alert ${message.type === "error" ? "alert-error" : "alert-success"}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSave}>
          {/* Theme picker */}
          <h4 className="ft-group-title">1. Choose a festival</h4>
          <div className="ft-grid" role="radiogroup" aria-label="Festival theme">
            <button
              type="button"
              role="radio"
              aria-checked={form.theme === "none"}
              className={`ft-card ${form.theme === "none" ? "selected" : ""}`}
              onClick={() => setField("theme", "none")}
            >
              <span className="ft-card-emoji">🌿</span>
              <span className="ft-card-name">No theme</span>
              <span className="ft-swatches">
                <i style={{ background: "#2d6a4f" }} />
                <i style={{ background: "#52b788" }} />
                <i style={{ background: "#d8f3dc" }} />
              </span>
            </button>
            {FESTIVAL_THEME_KEYS.map(key => {
              const t = FESTIVAL_THEMES[key];
              return (
                <button
                  key={key}
                  type="button"
                  role="radio"
                  aria-checked={form.theme === key}
                  className={`ft-card ${form.theme === key ? "selected" : ""}`}
                  onClick={() => setField("theme", key)}
                >
                  <span className="ft-card-emoji">{t.emoji}</span>
                  <span className="ft-card-name">{t.name}</span>
                  <span className="ft-swatches">
                    <i style={{ background: t.palette.primary }} />
                    <i style={{ background: t.palette.primaryLight }} />
                    <i style={{ background: t.palette.accent }} />
                  </span>
                </button>
              );
            })}
          </div>

          {selected && (
            <>
              <h4 className="ft-group-title">2. Greeting & schedule</h4>
              <div className="admin-form-grid">
                <div className="form-group admin-form-full">
                  <label htmlFor="ft-message">
                    Greeting message{" "}
                    <small className="ft-muted">
                      ({form.message.length}/{MAX_FESTIVAL_MESSAGE}) · leave empty to use the suggested one
                    </small>
                  </label>
                  <input
                    id="ft-message"
                    type="text"
                    maxLength={MAX_FESTIVAL_MESSAGE}
                    value={form.message}
                    onChange={e => setField("message", e.target.value)}
                    placeholder={selected.greeting}
                    disabled={isSaving}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="ft-end">
                    Switch off after <small className="ft-muted">(optional)</small>
                  </label>
                  <input
                    id="ft-end"
                    type="date"
                    min={todayInput()}
                    value={form.endDate}
                    onChange={e => setField("endDate", e.target.value)}
                    disabled={isSaving}
                  />
                  <small className="ft-muted">
                    {form.endDate ? "The theme ends at midnight after this day." : "Stays on until you switch it off."}
                  </small>
                </div>
                <div className="form-group">
                  <label>Options</label>
                  <label className="ft-toggle">
                    <input
                      type="checkbox"
                      checked={form.recolor}
                      onChange={e => setField("recolor", e.target.checked)}
                      disabled={isSaving}
                    />
                    <span>Use festival colours across the store</span>
                  </label>
                  <label className="ft-toggle">
                    <input
                      type="checkbox"
                      checked={form.decorations}
                      onChange={e => setField("decorations", e.target.checked)}
                      disabled={isSaving}
                    />
                    <span>Falling decorations ({selected.decor.slice(0, 3).join(" ")})</span>
                  </label>
                </div>
              </div>

              <h4 className="ft-group-title">3. Preview</h4>
              <div className="ft-preview">
                <FestivalRibbon themeKey={form.theme} message={form.message.trim()} />
                <div
                  className="ft-preview-body"
                  style={
                    form.recolor
                      ? {
                          "--ft-primary": selected.palette.primary,
                          "--ft-primary-xlight": selected.palette.primaryXlight,
                          "--ft-accent": selected.palette.accent
                        }
                      : undefined
                  }
                >
                  <div className="ft-preview-decor" aria-hidden="true">
                    {form.decorations ? selected.decor.join("  ") : ""}
                  </div>
                  <div className="ft-preview-row">
                    <span className="ft-preview-btn">Add to cart</span>
                    <span className="ft-preview-btn ft-outline">View details</span>
                    <span className="ft-preview-badge">Fresh today</span>
                    <span className="ft-preview-price">₹120</span>
                  </div>
                  <small className="ft-muted">
                    {form.recolor
                      ? "Buttons, links and highlights use the festival colours."
                      : "Store colours stay green; only the greeting strip changes."}
                  </small>
                </div>
              </div>
            </>
          )}

          <div className="admin-form-actions ft-actions">
            <button className="btn btn-primary" type="submit" disabled={isSaving || !isDirty}>
              {isSaving ? "Saving…" : form.theme === "none" ? "Save (theme off)" : "Save & publish theme"}
            </button>
            <button
              className="btn btn-secondary"
              type="button"
              onClick={() => {
                setForm(savedForm);
                setMessage({ type: "", text: "" });
              }}
              disabled={isSaving || !isDirty}
            >
              Discard changes
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
