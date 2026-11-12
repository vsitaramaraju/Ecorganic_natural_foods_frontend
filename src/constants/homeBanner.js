import { IMAGE_BASE_URL } from "../api/api";

// Built-in hero image used when the admin hasn't uploaded one.
export const DEFAULT_HERO_IMAGE = "/images/hero.webp";

// Mirrors DEFAULT_BANNER in the backend (controllers/homeBannerController.js).
// Used as a fallback if the banner API can't be reached.
export const DEFAULT_BANNER = {
  isVisible: true,
  badge: "🌱 100% Certified Organic",
  title: "Nature's Best,\nDelivered Fresh",
  description:
    "From local farms to your table — hand-picked organic produce, dairy, grains and superfoods with zero compromises.",
  primaryButtonText: "Shop Now",
  primaryButtonLink: "#products",
  secondaryButtonText: "Browse Categories",
  secondaryButtonLink: "/categories",
  stats: [
    { value: "500+", label: "Products" },
    { value: "50+", label: "Farms" },
    { value: "10K+", label: "Happy Customers" }
  ],
  highlights: ["🥕 Freshly Harvested", "✅ Chemical Free", "🚚 Next Day Delivery"],
  imageUrl: null,
  imageAlt: "Fresh organic produce",

  trustVisible: true,
  trustItems: [
    { icon: "🌿", title: "100% Organic", text: "Certified by APEDA" },
    { icon: "🚚", title: "Free Delivery", text: "On orders above ₹499" },
    { icon: "🔄", title: "Easy Returns", text: "No questions asked" },
    { icon: "🛡️", title: "Safe Payments", text: "100% secure checkout" }
  ],

  whyVisible: true,
  whyTitle: "Why EchOrganics?",
  whySubtitle: "We're not just a store — we're a movement for healthier living",
  whyCards: [
    {
      icon: "🌾",
      title: "Direct from Farm",
      text: "We partner directly with certified organic farmers, cutting out middlemen to deliver the freshest produce."
    },
    {
      icon: "🔬",
      title: "Lab Tested",
      text: "Every batch is tested for pesticides and chemicals. We guarantee what's on the label is what's in the pack."
    },
    {
      icon: "♻️",
      title: "Eco Packaging",
      text: "100% biodegradable packaging. We care about your health and the planet equally."
    },
    {
      icon: "💚",
      title: "Community First",
      text: "Every purchase supports local organic farmers and sustainable farming practices in India."
    }
  ],

  ctaVisible: true,
  ctaTitle: "Ready to eat healthier?",
  ctaText: "Join 10,000+ families who switched to organic with EchOrganics",
  ctaButtonText: "Create Free Account →",
  ctaButtonLink: "/register",

  isDefault: true
};

export const MAX_BANNER_STATS = 4;
export const MAX_BANNER_HIGHLIGHTS = 3;

// Card lists: max cards and per-field max lengths (must match the backend).
export const CARD_LIST_LIMITS = {
  trustItems: { max: 6, fields: { icon: 8, title: 40, text: 60 } },
  whyCards: { max: 8, fields: { icon: 8, title: 50, text: 250 } }
};

// Turns a stored image path ("/uploads/x.jpg") into a full URL.
export const resolveBannerImage = imageUrl => {
  if (!imageUrl) return DEFAULT_HERO_IMAGE;
  if (/^(https?:|blob:|data:)/.test(imageUrl)) return imageUrl;
  return IMAGE_BASE_URL + imageUrl;
};
