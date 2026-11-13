// Festival themes the admin can switch on (Admin → Festival Theme).
// Keys must match backend/src/utils/festivalTheme.js.
//
// palette: replaces the site's green brand colours while the theme is on. `primary`
//          is used behind white button text, so keep it dark enough (≥ 4.5:1).
// stripe:  colours of the thin band under the greeting strip.
// decor:   emojis that drift down the page once when it loads.
export const FESTIVAL_THEMES = {
  diwali: {
    name: "Diwali",
    emoji: "🪔",
    greeting: "Happy Diwali! May your home glow with light, health and happiness ✨",
    palette: {
      primary: "#b5470f",
      primaryDark: "#7a2e0a",
      primaryLight: "#f4a340",
      primaryXlight: "#fff1dc",
      accent: "#c99a06"
    },
    stripe: ["#7a1f1f", "#d4a017", "#f97316", "#d4a017", "#7a1f1f"],
    decor: ["🪔", "✨", "🪔", "🎆", "✨"]
  },
  sankranti: {
    name: "Sankranti / Pongal",
    emoji: "🪁",
    greeting: "Happy Makar Sankranti & Pongal! Wishing you a sweet and bountiful harvest 🌾",
    palette: {
      primary: "#c2410c",
      primaryDark: "#7c2d12",
      primaryLight: "#fb923c",
      primaryXlight: "#ffedd5",
      accent: "#0284c7"
    },
    stripe: ["#f97316", "#facc15", "#0ea5e9", "#facc15", "#f97316"],
    decor: ["🪁", "🌾", "☀️", "🪁", "🍚"]
  },
  ugadi: {
    name: "Ugadi",
    emoji: "🥭",
    greeting: "Ugadi Subhakankshalu! Wishing you a fresh and prosperous new year 🌿",
    palette: {
      primary: "#15803d",
      primaryDark: "#14532d",
      primaryLight: "#84cc16",
      primaryXlight: "#ecfccb",
      accent: "#ca8a04"
    },
    stripe: ["#15803d", "#eab308", "#84cc16", "#eab308", "#15803d"],
    decor: ["🥭", "🌿", "🌼", "🥭", "🌸"]
  },
  holi: {
    name: "Holi",
    emoji: "🎨",
    greeting: "Happy Holi! Celebrate the colours of spring with fresh organic goodness 🌈",
    palette: {
      primary: "#be185d",
      primaryDark: "#831843",
      primaryLight: "#f472b6",
      primaryXlight: "#fce7f3",
      accent: "#7c3aed"
    },
    stripe: ["#ec4899", "#f59e0b", "#22c55e", "#3b82f6", "#a855f7"],
    decor: ["🎨", "💜", "💛", "💚", "🩷"]
  },
  ganesh: {
    name: "Ganesh Chaturthi",
    emoji: "🌺",
    greeting: "Happy Ganesh Chaturthi! May Lord Ganesha bless you with wisdom and joy 🙏",
    palette: {
      primary: "#b45309",
      primaryDark: "#78350f",
      primaryLight: "#f59e0b",
      primaryXlight: "#fef3c7",
      accent: "#dc2626"
    },
    stripe: ["#dc2626", "#f59e0b", "#facc15", "#f59e0b", "#dc2626"],
    decor: ["🌺", "🪔", "🌼", "🙏", "🌺"]
  },
  dussehra: {
    name: "Dussehra",
    emoji: "🏹",
    greeting: "Happy Dussehra! May good always triumph — wishing you a joyful Vijayadashami 🌼",
    palette: {
      primary: "#9a3412",
      primaryDark: "#7c2d12",
      primaryLight: "#fb923c",
      primaryXlight: "#ffedd5",
      accent: "#ca8a04"
    },
    stripe: ["#9a3412", "#facc15", "#dc2626", "#facc15", "#9a3412"],
    decor: ["🏹", "🌼", "✨", "🪔", "🌼"]
  },
  christmas: {
    name: "Christmas",
    emoji: "🎄",
    greeting: "Merry Christmas! Wishing you a season full of warmth and wholesome food 🎁",
    palette: {
      primary: "#b91c1c",
      primaryDark: "#7f1d1d",
      primaryLight: "#f87171",
      primaryXlight: "#fee2e2",
      accent: "#15803d"
    },
    stripe: ["#b91c1c", "#ffffff", "#15803d", "#ffffff", "#b91c1c"],
    decor: ["❄️", "🎄", "⭐", "❄️", "🎁"]
  },
  newyear: {
    name: "New Year",
    emoji: "🎉",
    greeting: "Happy New Year! Start the year fresh, healthy and organic 🥂",
    palette: {
      primary: "#4338ca",
      primaryDark: "#312e81",
      primaryLight: "#818cf8",
      primaryXlight: "#e0e7ff",
      accent: "#c99a06"
    },
    stripe: ["#312e81", "#d4a017", "#818cf8", "#d4a017", "#312e81"],
    decor: ["🎉", "✨", "🎆", "🥂", "🎊"]
  },
  national: {
    name: "Independence / Republic Day",
    emoji: "🇮🇳",
    greeting: "Happy Independence Day! Proudly supporting Indian farmers 🇮🇳",
    palette: {
      primary: "#c2410c",
      primaryDark: "#7c2d12",
      primaryLight: "#fdba74",
      primaryXlight: "#fff7ed",
      accent: "#15803d"
    },
    stripe: ["#ff9933", "#ffffff", "#138808"],
    decor: ["🇮🇳", "🧡", "🤍", "💚", "🇮🇳"]
  },
  eid: {
    name: "Eid",
    emoji: "🌙",
    greeting: "Eid Mubarak! Wishing you peace, joy and blessings 🌙",
    palette: {
      primary: "#047857",
      primaryDark: "#064e3b",
      primaryLight: "#34d399",
      primaryXlight: "#d1fae5",
      accent: "#ca8a04"
    },
    stripe: ["#064e3b", "#d4a017", "#34d399", "#d4a017", "#064e3b"],
    decor: ["🌙", "⭐", "✨", "🌙", "⭐"]
  }
};

export const FESTIVAL_THEME_KEYS = Object.keys(FESTIVAL_THEMES);
export const MAX_FESTIVAL_MESSAGE = 120; // must match the backend

// Brand colour variables (global.css) a theme's palette replaces.
export const PALETTE_VARS = {
  primary: "--color-primary",
  primaryDark: "--color-primary-dark",
  primaryLight: "--color-primary-light",
  primaryXlight: "--color-primary-xlight",
  accent: "--color-accent"
};

export const stripeGradient = colors => `linear-gradient(90deg, ${colors.join(", ")})`;
