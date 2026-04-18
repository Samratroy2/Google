import React from 'react';
import { NavLink } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import styles from './Sidebar.module.css';

const NAV_ITEMS = [
  { to: '/dashboard',  icon: '📊', label: 'Dashboard' },
  { to: '/needs',      icon: '📋', label: 'Needs' },
  { to: '/volunteers', icon: '🙋', label: 'Volunteers' },
  { to: '/map',        icon: '🗺️', label: 'Live Map' },
  { to: '/chatbot',    icon: '🤖', label: 'AI Chat' },
  { to: '/admin',      icon: '⚙️', label: 'Admin' },
];

function Sidebar() {
  const { needs, volunteers } = useApp();
  const pending   = needs.filter(n => n.status === 'Pending').length;
  const available = volunteers.filter(v => v.available).length;

  return (
    <aside className={styles.sidebar}>
      <nav className={styles.nav}>
        {NAV_ITEMS.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `${styles.link} ${isActive ? styles.active : ''}`
            }
          >
            <span className={styles.icon}>{item.icon}</span>
            <span className={styles.label}>{item.label}</span>
            {item.to === '/needs' && pending > 0 && (
              <span className={styles.pill}>{pending}</span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className={styles.aiStatus}>
        <div className={styles.aiTitle}>🤖 AI STATUS</div>
        <div className={styles.aiRow}><span className={styles.dot} style={{ background: '#22c55e' }} /> Matching Engine</div>
        <div className={styles.aiRow}><span className={styles.dot} style={{ background: '#22c55e' }} /> NLP Classifier</div>
        <div className={styles.aiRow}><span className={styles.dot} style={{ background: '#f59e0b' }} /> Demand Predictor</div>
      </div>

      <div className={styles.stats}>
        <div className={styles.statRow}>
          <span className={styles.statLabel}>Pending needs</span>
          <span className={styles.statVal} style={{ color: '#f97316' }}>{pending}</span>
        </div>
        <div className={styles.statRow}>
          <span className={styles.statLabel}>Available vols</span>
          <span className={styles.statVal} style={{ color: '#22c55e' }}>{available}</span>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
