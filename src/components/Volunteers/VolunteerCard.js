import React from 'react';
import Badge from '../UI/Badge';
import { SKILL_COLORS } from '../../data/mockData';
import styles from './VolunteerCard.module.css';

function VolunteerCard({ volunteer: v, showScore, compact }) {
  const skillColor = SKILL_COLORS[v.skill] || '#64748b';

  if (compact) {
    return (
      <div className={styles.compact}>
        <div className={styles.avatar} style={{ background: skillColor + '33', color: skillColor }}>{v.avatar}</div>
        <div className={styles.compactInfo}>
          <div className={styles.name}>{v.name}</div>
          <div className={styles.meta}>{v.skill} · {v.distance}km</div>
        </div>
        <Badge text={v.available ? 'Available' : 'Busy'} color={v.available ? '#22c55e' : '#ef4444'} size="sm" />
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <div className={styles.top}>
        <div className={styles.avatar} style={{ background: skillColor + '33', color: skillColor }}>{v.avatar}</div>
        <div className={styles.info}>
          <div className={styles.name}>{v.name}</div>
          <div className={styles.meta}>{v.skill} · 📍 {v.location} · {v.distance} km away</div>
          <div className={styles.meta}>⭐ {v.rating} · ✅ {v.tasksCompleted} tasks · Joined {v.joinedDate}</div>
        </div>
        <div className={styles.right}>
          {showScore && v.matchScore !== undefined && (
            <div className={styles.score} style={{ color: v.matchScore >= 0.85 ? '#22c55e' : v.matchScore >= 0.65 ? '#f59e0b' : '#ef4444' }}>
              {Math.round(v.matchScore * 100)}%
            </div>
          )}
          <Badge text={v.available ? 'Available' : 'Busy'} color={v.available ? '#22c55e' : '#ef4444'} />
        </div>
      </div>
      {v.bio && <p className={styles.bio}>{v.bio}</p>}
      <div className={styles.subSkills}>
        {(v.subSkills || []).map(s => (
          <span key={s} className={styles.subSkill}>{s}</span>
        ))}
      </div>
    </div>
  );
}

export default VolunteerCard;
