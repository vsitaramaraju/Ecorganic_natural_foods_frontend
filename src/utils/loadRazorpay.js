const RAZORPAY_SCRIPT_URL = "https://checkout.razorpay.com/v1/checkout.js";

let loadPromise = null;

/**
 * Injects Razorpay Checkout once. Resolves true when window.Razorpay is ready,
 * false if the script couldn't be loaded. A failed load isn't cached, so the
 * next attempt (e.g. after the connection comes back) tries again.
 */
export default function loadRazorpay() {
  if (window.Razorpay) return Promise.resolve(true);
  if (loadPromise) return loadPromise;

  loadPromise = new Promise(resolve => {
    const script = document.createElement("script");
    script.src = RAZORPAY_SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve(Boolean(window.Razorpay));
    script.onerror = () => {
      script.remove();
      loadPromise = null;
      resolve(false);
    };
    document.body.appendChild(script);
  });

  return loadPromise;
}
