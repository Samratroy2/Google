import React, { useState } from 'react';
import Modal from '../UI/Modal';
import Badge from '../UI/Badge';
import Button from '../UI/Button';
import { URGENCY_COLORS, TYPE_ICONS, SKILL_COLORS } from '../../data/mockData';
import { formatScore, scoreColor } from '../../utils/helpers';
import styles from './MatchModal.module.css';

function MatchModal({ open, onClose, need, matches, onAssign }) {

  const [selected, setSelected] = useState([]);

  if (!need) return null;

  const toggleSelect = (vol) => {
    setSelected(prev => {
      const exists = prev.find(v => v.id === vol.id);
      if (exists) {
        return prev.filter(v => v.id !== vol.id);
      }
      return [...prev, vol];
    });
  };

  // 🔥 ONLY AVAILABLE VOLUNTEERS
  const availableMatches = matches.filter(v => v.available !== false);

  return (
    <Modal open={open} onClose={onClose} title="🤖 AI Match Results" width={520}>

      <div className={styles.needBox}>
        <span className={styles.needIcon}>{TYPE_ICONS[need.type]}</span>
        <div>
          <div className={styles.needTitle}>{need.title}</div>
          <div className={styles.needMeta}>
            {need.location} · 
            <Badge text={need.urgency} color={URGENCY_COLORS[need.urgency]} size="sm" />
          </div>
        </div>
      </div>

      <div className={styles.sectionLabel}>
        Best volunteer matches (AI ranked):
      </div>

      {availableMatches.length === 0 && (
        <div className={styles.empty}>
          No available volunteers found.
        </div>
      )}

      {availableMatches.slice(0, 6).map((v, i) => {
        const isSelected = selected.find(s => s.id === v.id);

        return (
          <div
            key={v.id}
            onClick={() => toggleSelect(v)}
            className={`
              ${styles.volRow} 
              ${i === 0 ? styles.top : ''} 
              ${isSelected ? styles.selected : ''}
            `}
          >
            {i === 0 && <div className={styles.bestTag}>⭐ BEST MATCH</div>}

            <div
              className={styles.avatar}
              style={{
                background: SKILL_COLORS[v.skill] + '33',
                color: SKILL_COLORS[v.skill]
              }}
            >
              {v.avatar}
            </div>

            <div className={styles.volInfo}>
              <div className={styles.volName}>{v.name}</div>

              <div className={styles.volMeta}>
                <span>@{v.username || 'unknown'}</span>
                <span>·</span>
                <span>{v.phone || 'No phone'}</span>
              </div>

              <div className={styles.volMeta}>
                <span>{v.skill}</span>
                <span>·</span>
                <span>{v.distance} km away</span>
                <span>·</span>
                <span>{v.tasksCompleted} tasks done</span>
              </div>

              <div className={styles.volMeta}>
                {v.skillMatch === 'exact' && '🎯 Perfect skill match'}
                {v.skillMatch === 'partial' && '⚡ Related skill'}
                {v.skillMatch === 'none' && '📍 Nearby support'}
              </div>
            </div>

            <div className={styles.scoreBox}>
              <div
                className={styles.score}
                style={{ color: scoreColor(v.matchScore) }}
              >
                {formatScore(v.matchScore)}
              </div>

              <div className={styles.scoreBar}>
                <div
                  className={styles.scoreFill}
                  style={{
                    width: formatScore(v.matchScore),
                    background: scoreColor(v.matchScore)
                  }}
                />
              </div>
            </div>
          </div>
        );
      })}

      {availableMatches.length > 0 && (
        <div className={styles.footer}>
          <Button
            fullWidth
            onClick={() => {

              const required = need.requiredVolunteers || 1;

              const selectedVols =
                selected.length > 0
                  ? selected
                  : availableMatches.slice(0, required);

              const finalVols = selectedVols.slice(0, required);

              onAssign && onAssign({
                needId: need.id,
                volunteers: finalVols,
                status: 'Assigned'
              });

              onClose();
            }}
          >
            ✅ Assign {selected.length || Math.min(availableMatches.length, need.requiredVolunteers || 1)} Volunteers
          </Button>
        </div>
      )}
    </Modal>
  );
}

export default MatchModal;