import { useEffect, useState } from "react";
import API from "../api/axios";
import { DEFAULT_DELIVERY_FEE } from "../constants/delivery";

// Last fee fetched in this tab, so later pages show it instantly.
let cachedFee = null;
const listeners = new Set();

// Lets the admin page update every mounted page right after saving.
export const setCachedDeliveryFee = fee => {
  cachedFee = Number(fee);
  listeners.forEach(listener => listener(cachedFee));
};

/**
 * The delivery fee the admin set (₹, 0 = free). Returns the cached value (or the
 * default) right away, then refreshes from the API so admin changes show up on the
 * next page visit. The backend charges its own stored value, never this one.
 */
export default function useDeliveryFee() {
  const [deliveryFee, setDeliveryFee] = useState(cachedFee ?? DEFAULT_DELIVERY_FEE);
  const [isLoading, setIsLoading] = useState(cachedFee === null);

  useEffect(() => {
    let active = true;
    listeners.add(setDeliveryFee);

    API.get("/settings/delivery")
      .then(res => {
        const fee = Number(res?.data?.deliveryFee);
        if (Number.isFinite(fee)) setCachedDeliveryFee(fee);
      })
      .catch(() => {
        // Keep showing the cached/default fee; checkout uses the server's value anyway.
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
      listeners.delete(setDeliveryFee);
    };
  }, []);

  return { deliveryFee, isLoading };
}
