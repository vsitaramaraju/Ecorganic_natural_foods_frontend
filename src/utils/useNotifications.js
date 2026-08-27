import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import API from "../api/axios";
import { IMAGE_BASE_URL } from "../api/api";

/**
 * Customer-facing notification system.
 *
 * There is no dedicated notifications endpoint on the backend, so this hook
 * builds notifications on the client by periodically polling the existing
 * products / categories / coupons / orders endpoints and diffing the result
 * against a small "baseline" snapshot kept in localStorage. Whenever
 * something new shows up (a new product, a new category, a new active
 * coupon) or one of the signed-in user's own orders changes status
 * (confirmed / shipped / delivered / cancelled...), a notification entry is
 * generated and stored in localStorage so the badge count survives reloads.
 *
 * Opening the notification panel is treated as "read": the list shown to
 * the user is cleared out of localStorage (and the badge count drops to 0)
 * as soon as the panel is opened.
 */

const POLL_INTERVAL_MS = 25000;

const ORDER_STATUS_LABELS = {
  PENDING: "placed and is awaiting confirmation",
  CONFIRMED: "confirmed",
  SHIPPED: "shipped",
  OUT_FOR_DELIVERY: "out for delivery",
  DELIVERED: "delivered",
  CANCELLED: "cancelled"
};

const readJSON = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const writeJSON = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage may be unavailable (private mode / quota) - fail silently
  }
};

const toArray = payload => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.products)) return payload.products;
  if (Array.isArray(payload?.categories)) return payload.categories;
  if (Array.isArray(payload?.coupons)) return payload.coupons;
  if (Array.isArray(payload?.orders)) return payload.orders;
  return [];
};

const getId = item => String(item?.id ?? item?._id ?? "");

const makeNotifId = () =>
  `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

const resolveImage = raw => {
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) return raw;
  return `${IMAGE_BASE_URL}${raw}`;
};

const getProductImage = product => {
  const raw = product?.images?.[0]?.imageUrl || product?.imageUrl;
  return resolveImage(raw);
};

// Builds a friendly "what's in this order" summary so notifications can
// reference the product itself instead of a bare order id.
const getOrderSummary = order => {
  const items = Array.isArray(order?.items) ? order.items : [];
  if (items.length === 0) {
    return { name: `Order #${getId(order)}`, image: null, extraCount: 0 };
  }
  const first = items[0];
  const name = first?.productName || first?.product?.name || "Your item";
  const image =
    getProductImage(first?.product) || resolveImage(first?.productImage);
  return { name, image, extraCount: items.length - 1 };
};

export default function useNotifications() {
  const { user, isAdmin, isAuthenticated } = useContext(AuthContext);
  const userKey = user?.id ?? user?._id ?? user?.email ?? "guest";

  const notifStorageKey = `echorganics_notifications_${userKey}`;
  const baselineStorageKey = `echorganics_notif_baseline_${userKey}`;

  const [notifications, setNotifications] = useState(() =>
    isAuthenticated ? readJSON(notifStorageKey, []) : []
  );

  const notifStorageKeyRef = useRef(notifStorageKey);
  notifStorageKeyRef.current = notifStorageKey;

  // Reload the list whenever the signed-in user changes.
  useEffect(() => {
    setNotifications(isAuthenticated ? readJSON(notifStorageKey, []) : []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notifStorageKey, isAuthenticated]);

  const pushNotification = useCallback(notif => {
    setNotifications(prev => {
      const next = [
        {
          id: makeNotifId(),
          createdAt: new Date().toISOString(),
          ...notif
        },
        ...prev
      ].slice(0, 40); // keep it bounded
      writeJSON(notifStorageKeyRef.current, next);
      return next;
    });
  }, []);

  // Clears everything currently stored - called when the bell is opened.
  const clearNotifications = useCallback(() => {
    writeJSON(notifStorageKeyRef.current, []);
    setNotifications([]);
  }, []);

  // ---------------------------------------------------------------------
  // Poll for changes: new products, new categories, new coupons, and order
  // status changes on the signed-in user's own orders.
  // ---------------------------------------------------------------------
  useEffect(() => {
    if (!isAuthenticated || isAdmin) return undefined;

    let cancelled = false;

    const checkForUpdates = async () => {
      const baseline = readJSON(baselineStorageKey, null);
      const isFirstRun = !baseline;

      const nextBaseline = {
        productIds: baseline?.productIds || [],
        categoryIds: baseline?.categoryIds || [],
        couponCodes: baseline?.couponCodes || [],
        orderStatuses: baseline?.orderStatuses || {}
      };

      const [productsRes, categoriesRes, couponsRes, ordersRes] =
        await Promise.allSettled([
          API.get("/products"),
          API.get("/categories"),
          API.get("/coupons/active"),
          API.get("/orders")
        ]);

      if (cancelled) return;

      // ---- New products ----
      if (productsRes.status === "fulfilled") {
        const products = toArray(productsRes.value?.data);
        const currentIds = products.map(getId).filter(Boolean);

        if (!isFirstRun) {
          products
            .filter(
              p => getId(p) && !nextBaseline.productIds.includes(getId(p))
            )
            .forEach(p => {
              pushNotification({
                type: "product",
                title: "New product added",
                message: `"${p.name || "A new product"}" just landed in the store.`,
                image: getProductImage(p),
                link: `/products/${getId(p)}`
              });
            });
        }
        nextBaseline.productIds = currentIds;
      }

      // ---- New categories ----
      if (categoriesRes.status === "fulfilled") {
        const categories = toArray(categoriesRes.value?.data);
        const currentIds = categories.map(getId).filter(Boolean);

        if (!isFirstRun) {
          categories
            .filter(
              c => getId(c) && !nextBaseline.categoryIds.includes(getId(c))
            )
            .forEach(c => {
              pushNotification({
                type: "category",
                title: "New category added",
                message: `Check out the new "${c.name || "category"}" collection.`,
                image: getProductImage(c),
                link: `/categories`
              });
            });
        }
        nextBaseline.categoryIds = currentIds;
      }

      // ---- New active coupons ----
      if (couponsRes.status === "fulfilled") {
        const coupons = toArray(couponsRes.value?.data);
        const currentCodes = coupons
          .map(c => String(c?.code || ""))
          .filter(Boolean);

        if (!isFirstRun) {
          coupons
            .filter(
              c => c?.code && !nextBaseline.couponCodes.includes(String(c.code))
            )
            .forEach(c => {
              const discount = c.discountPercent
                ? `${c.discountPercent}% off`
                : c.maxDiscountAmount
                  ? `₹${c.maxDiscountAmount} off`
                  : "a special discount";
              pushNotification({
                type: "coupon",
                title: "New coupon added",
                message: `Use code ${c.code} for ${discount}${
                  c.description ? ` — ${c.description}` : ""
                }.`,
                link: "/coupons"
              });
            });
        }
        nextBaseline.couponCodes = currentCodes;
      }

      // ---- Order status changes (own orders only) ----
      if (ordersRes.status === "fulfilled") {
        const orders = toArray(ordersRes.value?.data);
        const statusMap = { ...nextBaseline.orderStatuses };

        orders.forEach(order => {
          const id = getId(order);
          if (!id) return;
          const status = String(order?.status || "").toUpperCase();
          const prevStatus = statusMap[id];

          if (!isFirstRun && prevStatus && prevStatus !== status) {
            const label = ORDER_STATUS_LABELS[status] || status.toLowerCase();
            const { name, image, extraCount } = getOrderSummary(order);
            const itemsSuffix =
              extraCount > 0
                ? ` + ${extraCount} more item${extraCount === 1 ? "" : "s"}`
                : "";
            pushNotification({
              type: "order",
              title: `${name}${itemsSuffix}`,
              message: `Your order has been ${label}.`,
              image,
              link: "/orders"
            });
          }
          statusMap[id] = status;
        });

        nextBaseline.orderStatuses = statusMap;
      }

      writeJSON(baselineStorageKey, nextBaseline);
    };

    checkForUpdates().catch(err =>
      console.error("Notification check failed:", err)
    );
    const interval = window.setInterval(() => {
      checkForUpdates().catch(err =>
        console.error("Notification check failed:", err)
      );
    }, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [isAuthenticated, isAdmin, baselineStorageKey, pushNotification]);

  return {
    notifications,
    count: notifications.length,
    clearNotifications
  };
}
