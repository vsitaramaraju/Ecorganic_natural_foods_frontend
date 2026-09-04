import { useCallback, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { AuthContext } from "../context/AuthContext";
import { IMAGE_BASE_URL, notificationAPI } from "../api/api";

/**
 * Customer-facing notification system. The database is the single source
 * of truth (no localStorage involved anywhere):
 *
 *  - On login/app load, GET /api/notifications fetches everything the user
 *    hasn't read yet - including anything that happened while they were
 *    logged out.
 *  - While the tab stays open and connected, a live Socket.IO connection
 *    pushes new events straight into memory the moment they happen:
 *     - "product:new"   a new product was added by an admin
 *     - "category:new"  a new category was added by an admin
 *     - "coupon:new"     a new active coupon was added by an admin
 *     - "order:status"   one of the signed-in user's own orders changed status
 *  - Opening the bell calls POST /api/notifications/read, which moves the
 *    user's "read" cursor forward on the server, and clears the in-memory
 *    list. A page refresh after that won't bring the same items back.
 */

const ORDER_STATUS_LABELS = {
  PENDING: "placed and is awaiting confirmation",
  CONFIRMED: "confirmed",
  SHIPPED: "shipped",
  OUT_FOR_DELIVERY: "out for delivery",
  DELIVERED: "delivered",
  CANCELLED: "cancelled"
};

const resolveImage = raw => {
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) return raw;
  return `${IMAGE_BASE_URL}${raw}`;
};

const makeNotifId = () =>
  `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

// A live-pushed notification and the same event later fetched from the
// server won't share an id (local ones are generated client-side, server
// ones use the DB row id) - so duplicates are matched on their content
// instead. type+title+message is specific enough per event (order id,
// product name, coupon code etc. all end up baked into the title/message).
const notifKey = n => `${n.type}|${n.title}|${n.message}`;

const mergeNotifications = (local, fetched) => {
  const localKeys = new Set(local.map(notifKey));
  const newFromServer = fetched.filter(n => !localKeys.has(notifKey(n)));
  return [...newFromServer, ...local]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 40);
};

export default function useNotifications() {
  const { token, isAdmin, isAuthenticated } = useContext(AuthContext);

  const [notifications, setNotifications] = useState([]);

  // Signed out (or switched accounts) - nothing to show.
  useEffect(() => {
    if (!isAuthenticated) setNotifications([]);
  }, [isAuthenticated]);

  // ---------------------------------------------------------------------
  // Fetch from the server on login/app load (and whenever the token
  // changes, e.g. after a fresh sign-in). This is the only place the list
  // gets hydrated from - there's no local cache to fall back on, so a user
  // who was logged out (or just not on the site) when an admin made a
  // change still sees it here, since the backend persisted it.
  // ---------------------------------------------------------------------
  useEffect(() => {
    if (!isAuthenticated || isAdmin || !token) return undefined;

    let cancelled = false;
    notificationAPI
      .getMyNotifications()
      .then(fetched => {
        if (cancelled || !Array.isArray(fetched)) return;
        setNotifications(prev =>
          mergeNotifications(
            prev,
            fetched.map(n => ({
              id: `server_${n.id}`,
              type: n.type,
              title: n.title,
              message: n.message,
              image: n.image,
              link: n.link,
              createdAt: n.createdAt
            }))
          )
        );
      })
      .catch(err => {
        console.error("Failed to fetch notifications:", err);
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, isAdmin, token]);

  // Adds a live-pushed notification straight into memory.
  const pushNotification = useCallback(notif => {
    setNotifications(
      prev =>
        [
          {
            id: makeNotifId(),
            createdAt: new Date().toISOString(),
            ...notif
          },
          ...prev
        ].slice(0, 40) // keep it bounded
    );
  }, []);

  // Clears the in-memory list - called when the bell is opened. Also tells
  // the server to move the user's "read" cursor forward, so a refresh
  // right after doesn't re-fetch the same items.
  const clearNotifications = useCallback(() => {
    setNotifications([]);
    if (isAuthenticated && !isAdmin) {
      notificationAPI.markRead().catch(err => {
        console.error("Failed to mark notifications read:", err);
      });
    }
  }, [isAuthenticated, isAdmin]);

  // ---------------------------------------------------------------------
  // Live socket connection for real-time delivery while the tab is open.
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
        extraCount > 0
          ? ` + ${extraCount} more item${extraCount === 1 ? "" : "s"}`
          : "";
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
