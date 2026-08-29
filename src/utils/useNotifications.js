import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { AuthContext } from "../context/AuthContext";
import { IMAGE_BASE_URL } from "../api/api";

/**
 * Customer-facing notification system, powered by a live Socket.IO
 * connection instead of periodic REST polling.
 *
 * The server pushes an event the moment something notification-worthy
 * happens:
 *  - "product:new"   a new product was added by an admin
 *  - "category:new"  a new category was added by an admin
 *  - "coupon:new"     a new active coupon was added by an admin
 *  - "order:status"   one of the signed-in user's own orders changed status
 *
 * Each pushed notification is stored in localStorage (so the badge count
 * survives a refresh) and the whole list is cleared - both from state and
 * localStorage - the moment the bell is opened, which is what "read" means
 * for this feature.
 */

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

const resolveImage = raw => {
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) return raw;
  return `${IMAGE_BASE_URL}${raw}`;
};

const makeNotifId = () =>
  `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

export default function useNotifications() {
  const { user, token, isAdmin, isAuthenticated } = useContext(AuthContext);
  const userKey = user?.id ?? user?._id ?? user?.email ?? "guest";

  const notifStorageKey = `echorganics_notifications_${userKey}`;

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
  // Live socket connection - replaces the old setInterval REST polling.
  // Only customers (not admins) need this, since the events it listens for
  // are things admins themselves create.
  // ---------------------------------------------------------------------
  useEffect(() => {
    if (!isAuthenticated || isAdmin || !token) return undefined;

    // Cap reconnection attempts so a genuinely unreachable server (wrong
    // env var, backend not running, etc.) fails gracefully instead of
    // retrying forever and hammering the network tab with endless
    // connection attempts - which would be worse than the polling this
    // replaced.
    const socket = io(IMAGE_BASE_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
      timeout: 8000
    });

    let hasWarned = false;
    socket.on("connect_error", err => {
      if (!hasWarned) {
        console.error(
          "Notification socket connection error:",
          err.message,
          "- will retry a few times, then give up quietly."
        );
        hasWarned = true;
      }
    });

    socket.on("reconnect_failed", () => {
      console.warn(
        "Notification socket: giving up after repeated failed attempts. " +
          "Live notifications are unavailable until the page is reloaded " +
          "(or the connection issue is fixed)."
      );
    });

    socket.on("product:new", data => {
      pushNotification({
        type: "product",
        title: "New product added",
        message: `"${data?.name || "A new product"}" just landed in the store.`,
        image: resolveImage(data?.image),
        link: data?.id ? `/product/${data.id}` : "/shop"
      });
    });

    socket.on("category:new", data => {
      pushNotification({
        type: "category",
        title: "New category added",
        message: `Check out the new "${data?.name || "category"}" collection.`,
        image: resolveImage(data?.image),
        link: "/categories"
      });
    });

    socket.on("coupon:new", data => {
      const discount = data?.discountPercent
        ? `${data.discountPercent}% off`
        : data?.maxDiscountAmount
          ? `₹${data.maxDiscountAmount} off`
          : "a special discount";
      pushNotification({
        type: "coupon",
        title: "New coupon added",
        message: `Use code ${data?.code} for ${discount}${
          data?.description ? ` — ${data.description}` : ""
        }.`,
        link: "/coupons"
      });
    });

    socket.on("order:status", data => {
      const status = String(data?.status || "").toUpperCase();
      const label = ORDER_STATUS_LABELS[status] || status.toLowerCase();
      const extraCount = data?.extraCount || 0;
      const itemsSuffix =
        extraCount > 0 ? ` + ${extraCount} more item${extraCount === 1 ? "" : "s"}` : "";
      pushNotification({
        type: "order",
        title: `${data?.productName || "Your order"}${itemsSuffix}`,
        message: `Your order has been ${label}.`,
        image: resolveImage(data?.image),
        link: "/orders"
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [isAuthenticated, isAdmin, token, pushNotification]);

  return {
    notifications,
    count: notifications.length,
    clearNotifications
  };
}