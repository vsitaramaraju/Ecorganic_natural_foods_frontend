import { useEffect, useState } from "react";
import API from "../api/axios";
import { DEFAULT_BANNER } from "../constants/homeBanner";

// Last content fetched in this tab, so pages after the first render it instantly.
let cachedContent = null;

/**
 * Admin-editable home page content (hero, trust badges, why-us cards, sign-up banner).
 * Returns cached content right away (or the defaults), then refreshes from the API
 * so admin edits show up on the next page visit.
 */
export default function useHomeContent() {
  const [content, setContent] = useState(cachedContent || DEFAULT_BANNER);

  useEffect(() => {
    let active = true;
    API.get("/home-banner")
      .then(res => {
        if (!res?.data) return;
        cachedContent = { ...DEFAULT_BANNER, ...res.data };
        if (active) setContent(cachedContent);
      })
      .catch(() => {
        // Keep showing the cached/default content.
      });
    return () => {
      active = false;
    };
  }, []);

  return content;
}
