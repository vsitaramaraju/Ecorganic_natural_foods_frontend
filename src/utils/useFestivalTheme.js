import { useEffect, useState } from "react";
import API from "../api/axios";

const OFF = {
  theme: "none",
  active: false,
  message: "",
  endsAt: null,
  recolor: true,
  decorations: true
};

// Last settings fetched in this tab, so later pages render them instantly.
let cached = null;
const listeners = new Set();

// Lets the admin page update the storefront in this tab right after saving.
export const setCachedFestivalTheme = settings => {
  cached = { ...OFF, ...settings };
  listeners.forEach(listener => listener(cached));
};

/**
 * The festival theme the admin chose (Admin → Festival Theme).
 * `active` is false when no theme is set or its end date has passed.
 */
export default function useFestivalTheme() {
  const [settings, setSettings] = useState(cached || OFF);

  useEffect(() => {
    listeners.add(setSettings);
    API.get("/settings/theme")
      .then(res => {
        if (res?.data) setCachedFestivalTheme(res.data);
      })
      .catch(() => {
        // No theme is better than a broken page: keep the cached/default settings.
      });
    return () => {
      listeners.delete(setSettings);
    };
  }, []);

  return settings;
}
