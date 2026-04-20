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

      const requiredVolunteers = r.qty ? Math.ceil(r.qty / 10) : 1;

      const finalResult = { ...r, urgencyScore, requiredVolunteers };

      setResult(finalResult);
      setLoading(false);

      if (onClassified) {
        onClassified({
          ...r,
          title: text,
          requiredVolunteers
        });
      }
    }, 600);
  };

  return (
    <div className={styles.box}>
      {/* HEADER */}
      <div className={styles.header}>
        <span className={styles.headerIcon}>🤖</span>
        <div>
          <div className={styles.headerTitle}>AI Need Classifier</div>
          <div className={styles.headerSub}>
            Describe your need — AI detects type, urgency & quantity
          </div>
        </div>
      </div>

      {/* INPUT */}
      <div className={styles.inputRow}>
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleClassify()}
          placeholder='e.g. "Need 3 teachers urgently for children education"'
          className={styles.input}
        />
        <Button onClick={handleClassify} disabled={loading || !text.trim()}>
          {loading ? '⏳ Analysing…' : 'Classify'}
        </Button>
      </div>

      {/* RESULT */}
      {result && (
        <div className={styles.result}>
          <div className={styles.resultLabel}>AI detected:</div>

          <div className={styles.resultBadges}>
            <Badge text={`📁 ${result.category}`} color="#6366f1" size="md" />

            <Badge
              text={`⚡ ${result.urgency}`}
              color={URGENCY_COLORS[result.urgency]}
              size="md"
            />

            {result.qty && (
              <Badge text={`📦 Qty ~${result.qty}`} color="#3b82f6" size="md" />
            )}

            <Badge
              text={`👥 ${result.requiredVolunteers} volunteers`}
              color="#10b981"
              size="md"
            />
          </div>

          {/* URGENCY BAR */}
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
            ✅ Form below auto-filled. Review before submitting.
          </div>
        </div>
      )}

      {/* 🔥 UPDATED SMART SUGGESTIONS */}
      <div className={styles.chips}>
        {[
          // Core
          'Urgent food packets needed for 50 families',
          'Need 2 doctors immediately at Block B',
          'Clean drinking water required urgently',
          'Shelter needed for 20 people',

          // 🆕 Education
          'Need 3 teachers for children education',
          'Tutor required for students',

          // 🆕 Legal
          'Legal help needed for documentation case',
          'Need a lawyer for emergency case',

          // 🆕 Technical
          'Need IT support for system setup',
          'Website developer needed urgently',

          // 🆕 Support
          'Counseling needed for affected people',
          'Childcare support required',

          // 🆕 Operations
          'Volunteers needed for event management',
          'Fundraising support required',

          // 🆕 Communication
          'Social media help needed for campaign',
          'Translator needed urgently',

          // 🆕 Remote
          'Online volunteers required for coordination'
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