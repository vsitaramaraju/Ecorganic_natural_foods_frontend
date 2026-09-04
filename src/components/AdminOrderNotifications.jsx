import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaBell, FaBoxOpen, FaRegBellSlash } from "react-icons/fa";
import useAdminNotifications from "../utils/useAdminNotifications";
import "./AdminOrderNotifications.css";

const getTimeAgo = value => {
  if (!value) return "Just now";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Just now";
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
};

export default function AdminOrderNotifications() {
  const { notifications, count, clearNotifications } = useAdminNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const [displayedNotifications, setDisplayedNotifications] = useState([]);
  const wrapperRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleOutsideClick = event => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const handleToggle = () => {
    setIsOpen(open => {
      const next = !open;
      if (next) {
        // Snapshot what's showing right now, then clear + mark read on the
        // server - "read" means "removed" for this feature, same as the
        // customer-facing bell.
        setDisplayedNotifications(notifications);
        clearNotifications();
      }
      return next;
    });
  };

  const handleItemClick = link => {
    setIsOpen(false);
    if (link) navigate(link);
  };

  return (
    <div className="admin-notification-wrapper" ref={wrapperRef}>
      <button
        type="button"
        className={`admin-notification-button ${count ? "has-pending" : ""}`}
        onClick={handleToggle}
        aria-label={`Notifications${count ? `, ${count} new` : ""}`}
        aria-expanded={isOpen}
      >
        <FaBell />
        {count > 0 && (
          <span className="admin-notification-count">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="admin-notification-panel">
          <div className="admin-notification-header">
            <div>
              <strong>Notifications</strong>
              <span>
                {displayedNotifications.length
                  ? `${displayedNotifications.length} update${displayedNotifications.length === 1 ? "" : "s"}`
                  : "You're all caught up"}
              </span>
            </div>
            <FaBell className="admin-notification-header-icon" />
          </div>

          {displayedNotifications.length === 0 ? (
            <div className="admin-notification-empty">
              <FaRegBellSlash />
              <span>No new notifications</span>
            </div>
          ) : (
            <div className="admin-notification-list">
              {displayedNotifications.map(notif => (
                <button
                  type="button"
                  className="admin-order-notification-item"
                  key={notif.id}
                  onClick={() => handleItemClick(notif.link)}
                >
                  <span className="admin-order-notification-icon">
                    <FaBoxOpen />
                  </span>
                  <span className="admin-order-notification-content">
                    <strong>{notif.title}</strong>
                    <span>{notif.message}</span>
                    <small>{getTimeAgo(notif.createdAt)}</small>
                  </span>
                  <span className="admin-order-notification-arrow">›</span>
                </button>
              ))}
            </div>
          )}

          <button
            type="button"
            className="admin-notification-footer"
            onClick={() => {
              setIsOpen(false);
              navigate("/admin/orders?status=PENDING");
            }}
          >
            Review pending orders
          </button>
        </div>
      )}
    </div>
  );
}
