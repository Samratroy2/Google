import React from 'react';
import Badge from '../UI/Badge';
import Button from '../UI/Button'; // ✅ add this
import { SKILL_COLORS } from '../../data/mockData';
import styles from './VolunteerCard.module.css';

function VolunteerCard({ volunteer: v, showScore, compact, onDelete }) {
  const skillColor = SKILL_COLORS[v.skill] || '#64748b';

  // ✅ SAFE FIX: normalize subSkills
  const subSkills = Array.isArray(v.subSkills)
    ? v.subSkills
    : (v.subSkills || '')
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

  // ✅ SAFE FALLBACKS
  const name = v.name || 'Unknown';
  const location = v.location || 'Unknown';
  const distance = v.distance ?? 0;
  const rating = v.rating ?? 0;
  const tasks = v.tasksCompleted ?? 0;
  const joined = v.joinedDate || '-';
  const avatar = v.avatar || '?';
  const available = v.available ?? false;

  if (compact) {
    return (
      <div className={styles.compact}>
        <div
          className={styles.avatar}
          style={{ background: skillColor + '33', color: skillColor }}
        >
          {avatar}
        </div>

        <div className={styles.compactInfo}>
          <div className={styles.name}>{name}</div>
          <div className={styles.meta}>{v.skill} · {distance}km</div>
        </div>

        <Badge
          text={available ? 'Available' : 'Busy'}
          color={available ? '#22c55e' : '#ef4444'}
          size="sm"
        />

        {/* ✅ Delete button (compact) */}
        {onDelete && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDelete(v.id)}
          >
            🗑
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <div className={styles.top}>
        <div
          className={styles.avatar}
          style={{ background: skillColor + '33', color: skillColor }}
        >
          {avatar}
        </div>

        <div className={styles.info}>
          <div className={styles.name}>{name}</div>

          <div className={styles.meta}>
            {v.skill} · 📍 {location} · {distance} km away
          </div>

          <div className={styles.meta}>
            ⭐ {rating} · ✅ {tasks} tasks · Joined {joined}
          </div>
        </div>

        <div className={styles.right}>
          {showScore && v.matchScore !== undefined && (
            <div
              className={styles.score}
              style={{
                color:
                  v.matchScore >= 0.85
                    ? '#22c55e'
                    : v.matchScore >= 0.65
                    ? '#f59e0b'
                    : '#ef4444',
              }}
            >
              {Math.round(v.matchScore * 100)}%
            </div>
          )}

          <Badge
            text={available ? 'Available' : 'Busy'}
            color={available ? '#22c55e' : '#ef4444'}
          />

          {/* ✅ Delete button */}
          {onDelete && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onDelete(v.id)}
            >
              🗑
            </Button>
          )}
        </div>
      </div>

      {v.bio && <p className={styles.bio}>{v.bio}</p>}

      <div className={styles.subSkills}>
        {subSkills.length > 0 ? (
          subSkills.map((s, i) => (
            <span key={i} className={styles.subSkill}>
              {s}
            </span>
          ))
        ) : (
          <span className={styles.noSkills}>No skills listed</span>
        )}
      </div>
    </div>
  );
}

export default VolunteerCard;