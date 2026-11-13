import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { FESTIVAL_THEMES, PALETTE_VARS, stripeGradient } from "../constants/festivalThemes";
import useFestivalTheme from "../utils/useFestivalTheme";
import "./FestivalTheme.css";

const DECOR_COUNT = 18;

/** Greeting strip shown above the navbar. Also used as the admin preview. */
export function FestivalRibbon({ themeKey, message, onClose, ribbonRef }) {
  const theme = FESTIVAL_THEMES[themeKey];
  if (!theme) return null;
  return (
    <div
      ref={ribbonRef}
      className="festival-ribbon"
      role="region"
      aria-label={`${theme.name} greeting`}
    >
      <div className="festival-ribbon-bar" style={{ background: theme.palette.primaryDark }}>
        <span className="festival-ribbon-emoji" aria-hidden="true">
          {theme.emoji}
        </span>
        <span className="festival-ribbon-text">{message || theme.greeting}</span>
        <span className="festival-ribbon-emoji" aria-hidden="true">
          {theme.emoji}
        </span>
        {onClose && (
          <button
            type="button"
            className="festival-ribbon-close"
            onClick={onClose}
            aria-label="Close festival greeting"
          >
            ×
          </button>
        )}
      </div>
      <div className="festival-ribbon-stripe" style={{ background: stripeGradient(theme.stripe) }} />
    </div>
  );
}

/** Festive emojis that drift down the screen once, then disappear. */
export function FestivalDecor({ themeKey }) {
  const theme = FESTIVAL_THEMES[themeKey];
  if (!theme) return null;
  // Spread out deterministically (no Math.random) so renders are stable.
  const pieces = Array.from({ length: DECOR_COUNT }, (_, i) => ({
    emoji: theme.decor[i % theme.decor.length],
    left: (i * 37 + 11) % 100,
    delay: ((i * 7) % 10) * 0.35,
    duration: 6 + ((i * 13) % 5),
    size: 1.1 + ((i * 5) % 4) * 0.25,
    drift: ((i % 2 ? 1 : -1) * (20 + ((i * 17) % 40))) + "px"
  }));
  return (
    <div className="festival-decor" aria-hidden="true">
      {pieces.map((p, i) => (
        <span
          key={i}
          className="festival-decor-piece"
          style={{
            left: `${p.left}%`,
            fontSize: `${p.size}rem`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            "--festival-drift": p.drift
          }}
        >
          {p.emoji}
        </span>
      ))}
    </div>
  );
}

/**
 * The strip is fixed to the top of the window, above the (also fixed) navbar.
 * Publishes its height as --festival-nav-top so the navbar sits right below it and
 * the page content, sticky elements and mobile drop-downs move down by the same amount.
 */
function useNavbarOffset(ribbonRef, enabled) {
  useLayoutEffect(() => {
    const root = document.documentElement;
    const ribbon = ribbonRef.current;
    if (!enabled || !ribbon) {
      root.style.removeProperty("--festival-nav-top");
      return undefined;
    }

    const update = () =>
      root.style.setProperty("--festival-nav-top", `${ribbon.offsetHeight}px`);
    // The strip can wrap to two lines on phones or when the window is resized.
    const observer = new ResizeObserver(update);

    update();
    observer.observe(ribbon);
    return () => {
      observer.disconnect();
      root.style.removeProperty("--festival-nav-top");
    };
  }, [ribbonRef, enabled]);
}

const dismissKey = (theme, message) => `festival-dismissed:${theme}:${message}`;

const readDismissed = key => {
  try {
    return sessionStorage.getItem(key) === "1";
  } catch {
    return false;
  }
};

/**
 * Applies the admin's festival theme to the storefront: greeting strip, brand
 * colours and a one-time shower of decorations. Renders nothing when no theme is on.
 */
export default function FestivalTheme() {
  const { active, theme: themeKey, message, recolor, decorations } = useFestivalTheme();
  const { pathname } = useLocation();
  const theme = active ? FESTIVAL_THEMES[themeKey] : null;
  const key = dismissKey(themeKey, message);
  const [dismissedKey, setDismissedKey] = useState(null);
  const isDismissed = dismissedKey === key || readDismissed(key);
  const isAdminPage = pathname.startsWith("/admin");
  const ribbonRef = useRef(null);
  const showRibbon = Boolean(theme) && !isAdminPage && !isDismissed;
  useNavbarOffset(ribbonRef, showRibbon);

  // Swap the brand colour variables while the theme is on; restore them when it ends.
  useEffect(() => {
    if (!theme || !recolor) return undefined;
    const root = document.documentElement;
    Object.entries(PALETTE_VARS).forEach(([name, cssVar]) => {
      root.style.setProperty(cssVar, theme.palette[name]);
    });
    root.dataset.festival = themeKey;
    return () => {
      Object.values(PALETTE_VARS).forEach(cssVar => root.style.removeProperty(cssVar));
      delete root.dataset.festival;
    };
  }, [theme, themeKey, recolor]);

  if (!theme || isAdminPage) return null;

  const close = () => {
    try {
      sessionStorage.setItem(key, "1");
    } catch {
      // Private mode etc.: it just stays closed until the next page load.
    }
    setDismissedKey(key);
  };

  return (
    <>
      {showRibbon && (
        <FestivalRibbon
          ribbonRef={ribbonRef}
          themeKey={themeKey}
          message={message}
          onClose={close}
        />
      )}
      {/* Keyed by theme so a new theme plays its decorations again. */}
      {decorations && <FestivalDecor key={themeKey} themeKey={themeKey} />}
    </>
  );
}
