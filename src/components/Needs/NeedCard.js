import React from 'react';
import Badge from '../UI/Badge';
import Button from '../UI/Button';
import { URGENCY_COLORS, STATUS_COLORS, TYPE_ICONS } from '../../data/mockData';
import styles from './NeedCard.module.css';

function NeedCard({ need, onMatch, onDelete, onStatusChange }) {

  const needType = need.category || need.type || 'Other';
  const required = need.requiredVolunteers || 1;
  const assignedCount = need.assignedTo?.length || 0;
  const isFull = assignedCount >= required;
  const isCompleted = need.status === 'Completed';

  // ✅ MULTI RATING
  const handleComplete = () => {
    const volunteers = need.assignedTo || [];

    if (volunteers.length === 0) {
      alert("No volunteers assigned");
      return;
    }

    const ratings = [];

    for (let v of volunteers) {
      let rating = Number(prompt(`Rate ${v.name} (1-5):`));

      if (!rating || rating < 1 || rating > 5) {
        alert("Invalid rating");
        return;
      }

      ratings.push({
        uid: v.uid,
        rating
      });
    }

    onStatusChange && onStatusChange(need.id, 'Completed', ratings);
  };

  return (
    <div className={styles.card}>
      <div className={styles.top}>
        <div className={styles.left}>
          <span className={styles.typeIcon}>
            {TYPE_ICONS[needType] || '📦'}
          </span>

          <div>
            <div className={styles.title}>{need.title}</div>
            <div className={styles.meta}>
              📍 {need.location} · {need.timeAgo}
            </div>
          </div>
        </div>

        <div className={styles.badges}>
          <Badge text={need.urgency} color={URGENCY_COLORS[need.urgency]} />
          <Badge text={need.status} color={STATUS_COLORS[need.status]} />
        </div>
      </div>

      {need.description && (
        <p className={styles.desc}>{need.description}</p>
      )}

      <div className={styles.bottom}>
        <div className={styles.info}>
          Posted by -{" "}
          {typeof need.postedBy === 'object'
            ? need.postedBy.uid
            : need.postedBy}

          <span className={styles.dot}>·</span>

          <span>
            Qty: <strong>{need.qty || 0} {need.unit || ''}</strong>
          </span>

          <span className={styles.dot}>·</span>

          <span>
            👥 <strong>{assignedCount} / {required}</strong>
          </span>

          <span className={styles.dot}>·</span>

          <span className={styles.type}>{needType}</span>
        </div>

        <div className={styles.actions}>

          {/* ❌ HIDE EVERYTHING AFTER COMPLETE */}
          {!isCompleted && !isFull && (
            <>
              <Button size="sm" onClick={() => onMatch && onMatch(need)}>
                🤖 AI Match
              </Button>

              <Button
                size="sm"
                variant="success"
                onClick={() => onStatusChange && onStatusChange(need.id, 'Assigned')}
              >
                Assign
              </Button>
            </>
          )}

          {!isCompleted && isFull && (
            <Button
              size="sm"
              variant="success"
              onClick={handleComplete}
            >
              ✅ Complete
            </Button>
          )}

          {/* ✅ AFTER COMPLETE */}
          {isCompleted && (
            <span style={{ color: '#22c55e', fontWeight: 600 }}>
              ✅ Task Completed
            </span>
          )}

        </div>
      </div>
    </div>
  );
}

export default NeedCard;