import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaBell,
  FaBoxOpen,
  FaGift,
  FaLeaf,
  FaRegBellSlash
} from "react-icons/fa";
import useNotifications from "../utils/useNotifications";
import "./NotificationBell.css";

const ICONS = {
  order: <FaBoxOpen />,
  coupon: <FaGift />,
  product: <FaLeaf />,
  category: <FaLeaf />
};

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

export default function NotificationBell() {
  const { notifications, count, clearNotifications } = useNotifications();
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
        // Snapshot what's showing right now, then clear storage + badge
        // immediately - "read" means "removed" for this feature.
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
    <div className="notification-bell-wrapper" ref={wrapperRef}>
      <button
        type="button"
        className={`notification-bell-button ${count ? "has-unread" : ""}`}
        onClick={handleToggle}
        aria-label={`Notifications${count ? `, ${count} new` : ""}`}
        aria-expanded={isOpen}
      >
        <FaBell />
        {count > 0 && (
          <span className="notification-bell-count">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="notification-bell-panel">
          <div className="notification-bell-header">
            <div>
              <strong>Notifications</strong>
              <span>
                {displayedNotifications.length
                  ? `${displayedNotifications.length} update${displayedNotifications.length === 1 ? "" : "s"}`
                  : "You're all caught up"}
              </span>
            </div>
            <FaBell className="notification-bell-header-icon" />
          </div>

          {displayedNotifications.length === 0 ? (
            <div className="notification-bell-empty">
              <FaRegBellSlash />
              <span>No new notifications</span>
            </div>
          ) : (
            <div className="notification-bell-list">
              {displayedNotifications.map(notif => (
                <button
                  type="button"
                  key={notif.id}
                  className="notification-bell-item"
                  onClick={() => handleItemClick(notif.link)}
                >
                  <span className={`notification-bell-icon icon-${notif.type}`}>
                    {notif.image ? (
                      <img
                        src={notif.image}
                        alt=""
                        className="notification-bell-thumb"
                        loading="lazy"
                        onError={e => {
                          e.currentTarget.style.display = "none";
                          e.currentTarget.nextSibling.style.display = "flex";
                        }}
                      />
                    ) : null}
                    <span
                      className="notification-bell-icon-fallback"
                      style={notif.image ? { display: "none" } : undefined}
                    >
                      {ICONS[notif.type] || <FaBell />}
                    </span>
                  </span>
                  <span className="notification-bell-content">
                    <strong>{notif.title}</strong>
                    <span>{notif.message}</span>
                    <small>{getTimeAgo(notif.createdAt)}</small>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
