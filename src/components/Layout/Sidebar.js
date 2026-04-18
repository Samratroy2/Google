import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import styles from './Sidebar.module.css';

function Sidebar() {
  const { needs = [], users = [], user, logout } = useApp();
  const navigate = useNavigate();

  const pending = needs.filter(n => n.status === 'Pending').length;

  // 🔥 VOLUNTEERS FROM USERS
  const volunteers = users.filter(
    u => u.role === 'Volunteer' && u.status === 'approved'
  );

  const available = volunteers.filter(v => v.available).length;

  // ✅ LOGOUT HANDLER
  const handleLogout = async () => {
    try {
      await logout(); // 🔥 logs activity + signs out
      navigate('/login');
    } catch (err) {
      console.error(err);
    }
  };

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

        <NavLink to="/profile" className={styles.link}>
          👤 My Profile
        </NavLink>

        {/* 🔐 ADMIN */}
        {user?.role?.toLowerCase() === 'admin' && (
          <NavLink to="/admin" className={styles.link}>
            ⚙️ Admin
          </NavLink>
        )}

      </nav>

      {/* 📊 STATS */}
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

      {/* 🔥 LOGOUT BUTTON */}
      <div className={styles.logoutWrap}>
        <button className={styles.logoutBtn} onClick={handleLogout}>
          🚪 Logout
        </button>
      </div>

    </aside>
  );
}

export default Sidebar;