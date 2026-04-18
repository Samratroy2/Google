import React from 'react';
import Modal from '../UI/Modal';
import Badge from '../UI/Badge';
import Button from '../UI/Button';
import { URGENCY_COLORS, TYPE_ICONS, SKILL_COLORS } from '../../data/mockData';
import { formatScore, scoreColor } from '../../utils/helpers';
import styles from './MatchModal.module.css';

function MatchModal({ open, onClose, need, matches, onAssign }) {
  if (!need) return null;
  return (
    <Modal open={open} onClose={onClose} title="🤖 AI Match Results" width={520}>
      {/* Need summary */}
      <div className={styles.needBox}>
        <span className={styles.needIcon}>{TYPE_ICONS[need.type]}</span>
        <div>
          <div className={styles.needTitle}>{need.title}</div>
          <div className={styles.needMeta}>{need.location} · <Badge text={need.urgency} color={URGENCY_COLORS[need.urgency]} size="sm" /></div>
        </div>
      </div>

      <div className={styles.sectionLabel}>Best volunteer matches (AI ranked):</div>

      {matches.length === 0 && (
        <div className={styles.empty}>No available volunteers found. Try registering more volunteers.</div>
      )}

      {matches.slice(0, 4).map((v, i) => (
        <div key={v.id} className={`${styles.volRow} ${i === 0 ? styles.top : ''}`}>
          {i === 0 && <div className={styles.bestTag}>⭐ BEST MATCH</div>}
          <div className={styles.avatar} style={{ background: SKILL_COLORS[v.skill] + '33', color: SKILL_COLORS[v.skill] }}>
            {v.avatar}
          </div>
          <div className={styles.volInfo}>
            <div className={styles.volName}>{v.name}</div>
            <div className={styles.volMeta}>
              <span>{v.skill}</span>
              <span>·</span>
              <span>{v.distance} km away</span>
              <span>·</span>
              <span>{v.tasksCompleted} tasks done</span>
            </div>
          </div>
          <div className={styles.scoreBox}>
            <div className={styles.score} style={{ color: scoreColor(v.matchScore) }}>
              {formatScore(v.matchScore)}
            </div>
            <div className={styles.scoreBar}>
              <div className={styles.scoreFill} style={{ width: formatScore(v.matchScore), background: scoreColor(v.matchScore) }} />
            </div>
          </div>
        </div>
      ))}

      {matches.length > 0 && (
        <div className={styles.footer}>
          <Button fullWidth onClick={() => { onAssign && onAssign(matches[0]); onClose(); }}>
            ✅ Assign Best Match: {matches[0]?.name}
          </Button>
        </div>
      )}
    </Modal>
  );
}

export default MatchModal;
