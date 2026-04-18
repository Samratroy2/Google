import React from 'react';
import { NavLink } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import styles from './Sidebar.module.css';

function Sidebar() {
  const { needs = [], users = [], user } = useApp();

  const pending = needs.filter(n => n.status === 'Pending').length;

  // 🔥 VOLUNTEERS FROM USERS
  const volunteers = users.filter(u =>
    u.role === 'Volunteer' && u.status === 'approved'
  );

  const available = volunteers.filter(v => v.available).length;

  return (
    <aside className={styles.sidebar}>
      <nav className={styles.nav}>

        <NavLink to="/dashboard" className={styles.link}>
          📊 Dashboard
        </NavLink>

        <NavLink to="/needs" className={styles.link}>
          📋 Needs
          {pending > 0 && <span className={styles.pill}>{pending}</span>}
        </NavLink>

        <NavLink to="/volunteers" className={styles.link}>
          🙋 Volunteers
        </NavLink>

        <NavLink to="/map" className={styles.link}>
          🗺️ Live Map
        </NavLink>

        <NavLink to="/chatbot" className={styles.link}>
          🤖 AI Chat
        </NavLink>

        {/* 🔥 NEW PROFILE PAGE */}
        <NavLink to="/profile" className={styles.link}>
          👤 My Profile
        </NavLink>

        {/* 🔐 ADMIN ONLY */}
        {user?.role?.toLowerCase() === 'admin' && (
          <NavLink to="/admin" className={styles.link}>
            ⚙️ Admin
          </NavLink>
        )}

      </nav>

      {/* STATS */}
      <div className={styles.stats}>
        <div className={styles.statRow}>
          <span>Pending needs</span>
          <span style={{ color: '#f97316' }}>{pending}</span>
        </div>

        <div className={styles.statRow}>
          <span>Available vols</span>
          <span style={{ color: '#22c55e' }}>{available}</span>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;