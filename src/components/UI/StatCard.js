import React from 'react';
import styles from './StatCard.module.css';

function StatCard({ icon, label, value, color, trend }) {
  return (
    <div className={styles.card}>
      <div className={styles.iconBox} style={{ background: color + '22' }}>
        <span className={styles.icon}>{icon}</span>
      </div>
      <div className={styles.info}>
        <div className={styles.value}>{value}</div>
        <div className={styles.label}>{label}</div>
      </div>
      {trend !== undefined && (
        <div className={styles.trend} style={{ color: trend >= 0 ? '#22c55e' : '#ef4444' }}>
          {trend >= 0 ? '▲' : '▼'} {Math.abs(trend)}%
        </div>
      )}
    </div>
  );
}

export default StatCard;
