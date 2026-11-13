// The delivery fee is set by the admin (Admin → Delivery Fee) and fetched with
// useDeliveryFee(). This default is only shown until that request returns.
export const DEFAULT_DELIVERY_FEE = 49;
export const MAX_DELIVERY_FEE = 1000; // must match backend/src/utils/delivery.js

// "₹49", or "FREE" when the admin set the fee to 0.
export const formatDeliveryFee = fee => (Number(fee) > 0 ? `₹${Number(fee)}` : "FREE");

// Sentence for the FAQ / shipping policy.
export const deliveryChargeText = fee =>
  Number(fee) > 0
    ? `A flat delivery charge of ₹${Number(fee)} applies to every order.`
    : "Delivery is free on every order.";
