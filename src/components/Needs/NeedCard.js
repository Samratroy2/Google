import React from 'react';
import Badge from '../UI/Badge';
import Button from '../UI/Button';
import { URGENCY_COLORS, STATUS_COLORS, TYPE_ICONS } from '../../data/mockData';
import styles from './NeedCard.module.css';

function NeedCard({ need, onMatch, onDelete, onStatusChange, currentUser }) {

  const needType = need.category || need.type || 'Other';
  const required = need.requiredVolunteers || 1;
  const assignedCount = need.assignedTo?.length || 0;
  const isFull = assignedCount >= required;
  const isCompleted = need.status === 'Completed';

  const userEmail = currentUser?.email;

  const creator = need.postedBy || {};
  const creatorEmail =
    typeof creator === 'object'
      ? creator.email || ""
      : creator;

  const creatorName =
    typeof creator === 'object'
      ? creator.name || "User"
      : creator;

  const isOwner = userEmail === creatorEmail;

  const assignedEmails = (need.assignedTo || []).map(v =>
    typeof v === 'object' ? v.email || v.name : v
  );

  const isVolunteer = assignedEmails.includes(userEmail);

  // 📧 EMAIL API
  const sendEmailToCreator = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          toEmail: creatorEmail,
          needTitle: need.title
        })
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("❌ Email failed:", data);
      } else {
        console.log("✅ Email sent");
      }

    } catch (err) {
      console.error("Email error:", err);
    }
  };

  // ✅ COMPLETE FLOW (UNCHANGED)
  const handleComplete = async () => {

    if (!isOwner && !isVolunteer) {
      alert("Not allowed");
      return;
    }

    const volunteers = need.assignedTo || [];

    if (isOwner) {
      if (volunteers.length === 0) {
        alert("No volunteers assigned");
        return;
      }

      const ratings = [];

      for (let v of volunteers) {
        const name = typeof v === 'object' ? v.name : v;

        let rating = Number(prompt(`Rate ${name} (1-5):`));

        if (!rating || rating < 1 || rating > 5) {
          alert("Invalid rating");
          return;
        }

        ratings.push({
          uid: typeof v === 'object' ? v.uid : v,
          name,
          rating
        });
      }

      onStatusChange && onStatusChange(need.id, 'Completed', ratings);
    }

    else if (isVolunteer) {
      onStatusChange && onStatusChange(need.id, 'Completed');

      if (creatorEmail) {
        await sendEmailToCreator();
      }
    }
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
          Posted by - {creatorName}

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

          {/* ✅ ONLY CHANGE: buttons removed, feedback kept */}
          {!isCompleted && !isFull && (
            <span style={{ color: '#f59e0b', fontWeight: 500 }}>
              🤖 Finding Volunteers...
            </span>
          )}

          {!isCompleted && isFull && (
            <Button
              size="sm"
              variant="success"
              disabled={!isOwner && !isVolunteer}
              onClick={handleComplete}
            >
              ✅ Complete
            </Button>
          )}

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