import { useCallback, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { AuthContext } from "../context/AuthContext";
import { IMAGE_BASE_URL, adminNotificationAPI } from "../api/api";

/**
 * Admin-facing notification system - the mirror of useNotifications.js, but
 * for events that come from the customer side that admins need to know
 * about (right now: new orders). Same architecture, same reasoning:
 *
 *  - On login/app load, GET /api/admin/notifications fetches everything
 *    this admin hasn't read yet - including anything that happened while
 *    every admin was logged out.
 *  - While the tab stays open and connected, a live Socket.IO connection
 *    pushes new events straight into memory the moment they happen
 *    ("order:new" - a customer placed an order).
 *  - Opening the bell calls POST /api/admin/notifications/read, which
 *    moves this admin's "read" cursor forward on the server, and clears
 *    the in-memory list.
 *
 * No localStorage anywhere - the database is the only source of truth.
 */

const formatCurrency = amount =>
  `₹${Number(amount || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;

const makeNotifId = () =>
  `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

// See useNotifications.js for why content (not id) is used to dedupe a
// live-pushed notification against the same event later fetched from the
// server.
const notifKey = n => `${n.type}|${n.title}|${n.message}`;

const mergeNotifications = (local, fetched) => {
  const localKeys = new Set(local.map(notifKey));
  const newFromServer = fetched.filter(n => !localKeys.has(notifKey(n)));
  return [...newFromServer, ...local]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 40);
};

export default function useAdminNotifications() {
  const { token, isAdmin, isAuthenticated } = useContext(AuthContext);

  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) setNotifications([]);
  }, [isAuthenticated, isAdmin]);

  // Fetch from the server on login/app load - the only place the list gets
  // hydrated from, so an admin who was logged out when an order came in
  // still sees it here.
  useEffect(() => {
    if (!isAuthenticated || !isAdmin || !token) return undefined;

    let cancelled = false;
    adminNotificationAPI
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
        console.error("Failed to fetch admin notifications:", err);
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, isAdmin, token]);

  const pushNotification = useCallback(notif => {
    setNotifications(prev =>
      [
        {
          id: makeNotifId(),
          createdAt: new Date().toISOString(),
          ...notif
        },
        ...prev
      ].slice(0, 40)
    );
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    if (isAuthenticated && isAdmin) {
      adminNotificationAPI.markRead().catch(err => {
        console.error("Failed to mark admin notifications read:", err);
      });
    }
  }, [isAuthenticated, isAdmin]);

  // Live socket connection - only admins need this, listening only for
  // events customers themselves trigger.
  useEffect(() => {
    if (!isAuthenticated || !isAdmin || !token) return undefined;

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
          "Admin notification socket connection error:",
          err.message,
          "- will retry a few times, then give up quietly."
        );
        hasWarned = true;
      }
    });

    socket.on("reconnect_failed", () => {
      console.warn(
        "Admin notification socket: giving up after repeated failed " +
          "attempts. Live notifications are unavailable until the page " +
          "is reloaded (or the connection issue is fixed)."
      );
    });

    socket.on("order:new", data => {
      const itemCount = data?.itemCount || 0;
      pushNotification({
        type: "new_order",
        title: `New order #${data?.orderId}`,
        message: `${data?.customerName || "A customer"} placed an order for ${formatCurrency(data?.amount)}${
          itemCount ? ` (${itemCount} item${itemCount === 1 ? "" : "s"})` : ""
        }.`,
        link: data?.orderId ? `/admin/orders?order=${data.orderId}` : "/admin/orders"
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
