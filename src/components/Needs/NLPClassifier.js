import React, { useState } from 'react';
import { nlpClassify, detectUrgencyScore } from '../../utils/aiEngine';
import { URGENCY_COLORS } from '../../data/mockData';
import Badge from '../UI/Badge';
import Button from '../UI/Button';
import styles from './NLPClassifier.module.css';

function NLPClassifier({ onClassified }) {
  const [text, setText] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleClassify = () => {
    if (!text.trim()) return;
    setLoading(true);

    setTimeout(() => {
      const r = nlpClassify(text);
      const urgencyScore = detectUrgencyScore(text);

      // ✅ NEW: derive required volunteers from qty (basic logic)
      const requiredVolunteers = r.qty ? Math.ceil(r.qty / 10) : 1;

      const finalResult = { ...r, urgencyScore, requiredVolunteers };

      setResult(finalResult);
      setLoading(false);

      if (onClassified) {
        onClassified({
          ...r,
          title: text,
          requiredVolunteers // ✅ PASS TO FORM
        });
      }

    }, 600);
  };

  return (
    <div className={styles.box}>
      <div className={styles.header}>
        <span className={styles.headerIcon}>🤖</span>
        <div>
          <div className={styles.headerTitle}>AI Need Classifier</div>
          <div className={styles.headerSub}>
            Describe your need in plain language — AI extracts category & urgency
          </div>
        </div>
      </div>

      <div className={styles.inputRow}>
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleClassify()}
          placeholder='e.g. "We urgently need medicines and a doctor in Block B"'
          className={styles.input}
        />
        <Button onClick={handleClassify} disabled={loading || !text.trim()}>
          {loading ? '⏳ Analysing…' : 'Classify'}
        </Button>
      </div>

      {result && (
        <div className={styles.result}>
          <div className={styles.resultLabel}>AI detected:</div>

          <div className={styles.resultBadges}>
            <Badge text={`📁 ${result.category}`} color="#6366f1" size="md" />
            <Badge text={`⚡ ${result.urgency}`} color={URGENCY_COLORS[result.urgency]} size="md" />
            {result.qty && (
              <Badge text={`Qty ~${result.qty}`} color="#3b82f6" size="md" />
            )}

            {/* ✅ NEW BADGE */}
            <Badge
              text={`👥 ${result.requiredVolunteers} volunteers`}
              color="#10b981"
              size="md"
            />
          </div>

          <div className={styles.urgencyBar}>
            <span className={styles.urgencyLabel}>Urgency Score</span>
            <div className={styles.bar}>
              <div
                className={styles.fill}
                style={{
                  width: `${result.urgencyScore}%`,
                  background: URGENCY_COLORS[result.urgency]
                }}
              />
            </div>
            <span className={styles.urgencyVal}>
              {result.urgencyScore}/100
            </span>
          </div>

          <div className={styles.hint}>
            ✅ Form below has been pre-filled. Review and submit.
          </div>
        </div>
      )}

      <div className={styles.chips}>
        {[
          'Urgent food packets needed for 50 families',
          'Need 2 doctors emergency at Block B',
          'Shelter required for displaced people',
          'Clean drinking water supply critical',
        ].map(q => (
          <button
            key={q}
            className={styles.chip}
            onClick={() => {
              setText(q);
              setResult(null);
            }}
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}

export default NLPClassifier;