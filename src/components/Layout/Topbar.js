import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useNavigate } from 'react-router-dom'; // ✅ added
import styles from './Topbar.module.css';

function Topbar() {
  const {
    theme,
    toggleTheme,
    notifications,
    markAllRead,
    unreadCount,
    user,
    logout // ✅ added
  } = useApp();

  const [open, setOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false); // ✅ added

  const ref = useRef(null);
  const userRef = useRef(null); // ✅ added

  const navigate = useNavigate(); // ✅ added

  // ✅ SAFE FALLBACKS
  const safeNotifications = notifications || [];
  const safeUnread = unreadCount || 0;

  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
      if (userRef.current && !userRef.current.contains(e.target)) setUserOpen(false); // ✅ added
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ✅ LOGOUT HANDLER (minimal)
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <header className={styles.bar}>
      <div className={styles.brand}>
        <img src="/image.png" alt="Logo" className={styles.logo}/>
        <span className={styles.name}>SmartAid</span>
        <span className={styles.tag}>v1.0</span>
      </div>

      <div className={styles.actions}>

        {/* 🔔 Notifications */}
        <div className={styles.notifWrap} ref={ref}>
          <button
            className={styles.iconBtn}
            onClick={() => {
              setOpen(o => !o);

              if (!open && typeof markAllRead === "function") {
                markAllRead();
              }
            }}
          >
            🔔
            {safeUnread > 0 && (
              <span className={styles.badge}>{safeUnread}</span>
            )}
          </button>

          {open && (
            <div className={styles.dropdown}>
              <div className={styles.dropHead}>Notifications</div>

              {safeNotifications.length === 0 && (
                <div className={styles.empty}>No notifications</div>
              )}

              {safeNotifications.map(n => (
                <div
                  key={n.id}
                  className={`${styles.notifItem} ${!n.read ? styles.unread : ''}`}
                >
                  <div className={styles.notifText}>{n.text}</div>
                  <div className={styles.notifTime}>{n.time}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 🌙 Theme */}
        <button className={styles.iconBtn} onClick={toggleTheme}>
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>

        {/* 👤 Avatar + Dropdown */}
        <div className={styles.userWrap} ref={userRef}>
          <div
            className={styles.avatar}
            onClick={() => setUserOpen((o) => !o)}
          >
            {user?.email?.charAt(0).toUpperCase() || "U"}
          </div>

          {userOpen && (
            <div className={styles.userDropdown}>
              <div className={styles.userInfo}>
                {user?.email || "User"}
              </div>

              <button
                className={styles.logoutItem}
                onClick={handleLogout}
              >
                🚪 Logout
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}

export default Topbar;