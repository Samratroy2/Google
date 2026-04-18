import React from 'react';
import Badge from '../UI/Badge';
import Button from '../UI/Button';
import { URGENCY_COLORS, STATUS_COLORS, TYPE_ICONS } from '../../data/mockData';
import styles from './NeedCard.module.css';

function NeedCard({ need, onMatch, onDelete, onStatusChange }) {
  return (
    <div className={styles.card}>
      <div className={styles.top}>
        <div className={styles.left}>
          <span className={styles.typeIcon}>{TYPE_ICONS[need.type] || '📦'}</span>
          <div>
            <div className={styles.title}>{need.title}</div>
            <div className={styles.meta}>📍 {need.location} &nbsp;·&nbsp; {need.timeAgo}</div>
          </div>
        </div>
        <div className={styles.badges}>
          <Badge text={need.urgency} color={URGENCY_COLORS[need.urgency]} />
          <Badge text={need.status}  color={STATUS_COLORS[need.status]} />
        </div>
      </div>

      {need.description && (
        <p className={styles.desc}>{need.description}</p>
      )}

      <div className={styles.bottom}>
        <div className={styles.info}>
          <span>By <strong>{need.postedBy}</strong></span>
          <span className={styles.dot}>·</span>
          <span>Qty: <strong>{need.qty} {need.unit}</strong></span>
          <span className={styles.dot}>·</span>
          <span className={styles.type}>{need.type}</span>
        </div>

        <div className={styles.actions}>
          {need.status === 'Pending' && (
            <>
              <Button size="sm" onClick={() => onMatch && onMatch(need)}>🤖 AI Match</Button>
              <Button size="sm" variant="success" onClick={() => onStatusChange && onStatusChange(need.id, 'Assigned')}>Assign</Button>
            </>
          )}
          {need.status === 'Assigned' && (
            <Button size="sm" variant="success" onClick={() => onStatusChange && onStatusChange(need.id, 'Completed')}>✅ Complete</Button>
          )}
          {onDelete && (
            <Button size="sm" variant="ghost" onClick={() => onDelete(need.id)}>🗑</Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default NeedCard;
