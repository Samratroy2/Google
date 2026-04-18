import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import styles from './Topbar.module.css';

function Topbar() {
  const { theme, toggleTheme, notifications, markAllRead, unreadCount } = useApp();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handler(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <header className={styles.bar}>
      <div className={styles.brand}>
        <img src="/image.png" alt="Logo" className={styles.logo}/>
        <span className={styles.name}>SmartAid</span>
        <span className={styles.tag}>v1.0</span>
      </div>

      <div className={styles.actions}>
        {/* Notification Bell */}
        <div className={styles.notifWrap} ref={ref}>
          <button className={styles.iconBtn} onClick={() => { setOpen(o => !o); if (!open) markAllRead(); }}>
            🔔
            {unreadCount > 0 && <span className={styles.badge}>{unreadCount}</span>}
          </button>
          {open && (
            <div className={styles.dropdown}>
              <div className={styles.dropHead}>Notifications</div>
              {notifications.length === 0 && <div className={styles.empty}>No notifications</div>}
              {notifications.map(n => (
                <div key={n.id} className={`${styles.notifItem} ${!n.read ? styles.unread : ''}`}>
                  <div className={styles.notifText}>{n.text}</div>
                  <div className={styles.notifTime}>{n.time}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Theme toggle */}
        <button className={styles.iconBtn} onClick={toggleTheme} title="Toggle theme">
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>

        {/* Avatar */}
        <div className={styles.avatar}>A</div>
      </div>
    </header>
  );
}

export default Topbar;
