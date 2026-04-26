import React from 'react';
import Badge from '../UI/Badge';
import Button from '../UI/Button';
import {
  URGENCY_COLORS,
  STATUS_COLORS,
  TYPE_ICONS
} from '../../data/mockData';
import styles from './NeedCard.module.css';

function NeedCard({ need, onStatusChange, currentUser }) {

  const needType = need.category || need.type || 'Other';
  const required = need.requiredVolunteers || 1;
  const assignedCount = need.assignedTo?.length || 0;
  const isFull = assignedCount >= required;
  const isCompleted = need.status === 'Completed';

  const userEmail = currentUser?.email;

  // ✅ CREATOR SAFE EXTRACTION
  const creator = need.postedBy || {};

  const creatorEmail =
    typeof creator === 'object'
      ? creator.email || need.email || ""
      : creator || "";

  const creatorName =
    typeof creator === 'object'
      ? creator.name || creator.email || "User"
      : creator;

  const isOwner = userEmail === creatorEmail;

  const assignedEmails = (need.assignedTo || []).map(v =>
    typeof v === 'object' ? v.email || v.name : v
  );

  const isVolunteer = assignedEmails.includes(userEmail);

  // 📧 EMAIL FUNCTION
  const sendEmailToCreator = async () => {
    try {
      if (!creatorEmail) {
        console.warn("⚠️ No creator email");
        return;
      }

      const res = await fetch("http://localhost:5000/api/chat/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          toEmail: creatorEmail,
          needTitle: need.title,
          volunteer: currentUser?.email
        })
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("❌ Email failed:", data);
      } else {
        console.log("📧 Email sent successfully");
      }

    } catch (err) {
      console.error("❌ Email error:", err);
    }
  };

  // ✅ COMPLETE FLOW (FINAL FIX)
  const handleComplete = async () => {

    if (!isOwner && !isVolunteer) {
      alert("Not allowed");
      return;
    }

    const volunteers = need.assignedTo || [];

    // 🧑‍💼 OWNER → collect ratings
    if (isOwner) {

      if (volunteers.length === 0) {
        alert("No volunteers assigned");
        return;
      }

      const ratings = [];

      for (let v of volunteers) {

        const uid  = typeof v === 'object' ? v.uid : v;
        const name = typeof v === 'object' ? v.name : v;

        let input = prompt(`Rate ${name} (1-5):`);

        if (input === null) {
          alert("Rating cancelled");
          return;
        }

        const rating = Number(input);

        if (!rating || rating < 1 || rating > 5) {
          alert("Invalid rating (1-5 only)");
          return;
        }

        ratings.push({
          uid: String(uid),   // 🔥 IMPORTANT
          rating
        });
      }

      // ✅ ALWAYS PASS RATINGS
      if (typeof onStatusChange === "function") {
        onStatusChange(need.id, "Completed", ratings);
      }
    }

    // 🙋 VOLUNTEER → no ratings
    else if (isVolunteer) {

      if (typeof onStatusChange === "function") {
        onStatusChange(need.id, "Completed", []); // ✅ MUST pass empty array
      }

      if (creatorEmail) {
        await sendEmailToCreator();
      }
    }
  };

  return (
    <div className={styles.card}>

      {/* HEADER */}
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

      {/* DESCRIPTION */}
      {need.description && (
        <p className={styles.desc}>{need.description}</p>
      )}

      {/* FOOTER */}
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

          {!isCompleted && !isFull && (
            <span style={{ color: '#f59e0b' }}>
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
            <span style={{ color: '#22c55e' }}>
              ✅ Task Completed
            </span>
          )}

        </div>
      </div>
    </div>
  );
}

export default NeedCard;