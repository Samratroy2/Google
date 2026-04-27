import React, { useState } from 'react';
import Badge from '../UI/Badge';
import Button from '../UI/Button';
import {
  URGENCY_COLORS,
  STATUS_COLORS,
  TYPE_ICONS
} from '../../data/mockData';
import styles from './NeedCard.module.css';

function NeedCard({ need, onStatusChange, currentUser }) {

  // 🔥 LOCAL STATE FOR INSTANT UI UPDATE
  const [localCompleted, setLocalCompleted] = useState(false);

  const needType = need.category || need.type || 'Other';
  const required = need.requiredVolunteers || 1;
  const assignedCount = need.assignedTo?.length || 0;
  const isFull = assignedCount >= required;

  // ✅ FIXED STATUS CHECK (CASE SAFE + LOCAL STATE)
  const isCompleted =
    localCompleted || (need.status || "").toLowerCase() === "completed";

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

  // 📧 EMAIL FUNCTION (PRODUCTION SAFE)
  const sendEmailToCreator = async () => {
    try {
      if (!creatorEmail) return;

      const API_BASE = process.env.REACT_APP_API_URL;

      const res = await fetch(`${API_BASE}/api/chat/send-email`, {
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

      if (!res.ok) {
        console.error("❌ Email failed");
      } else {
        console.log("📧 Email sent successfully");
      }

    } catch (err) {
      console.error("❌ Email error:", err);
    }
  };

  // ✅ COMPLETE HANDLER (FINAL FIX)
  const handleComplete = async () => {

    // 🔥 PREVENT DOUBLE CLICK
    if (isCompleted) return;

    if (!isOwner && !isVolunteer) {
      alert("Not allowed");
      return;
    }

    // ⚡ INSTANT UI UPDATE
    setLocalCompleted(true);

    const volunteers = need.assignedTo || [];

    // 🧑‍💼 OWNER → GIVE RATINGS
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
          setLocalCompleted(false); // rollback
          return;
        }

        const rating = Number(input);

        if (!rating || rating < 1 || rating > 5) {
          alert("Invalid rating (1-5 only)");
          setLocalCompleted(false); // rollback
          return;
        }

        ratings.push({
          uid: String(uid),
          rating
        });
      }

      if (typeof onStatusChange === "function") {
        onStatusChange(need.id, "Completed", ratings);
      }
    }

    // 🙋 VOLUNTEER → COMPLETE + EMAIL
    else if (isVolunteer) {

      if (typeof onStatusChange === "function") {
        onStatusChange(need.id, "Completed", []);
      }

      await sendEmailToCreator();
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
              Finding Volunteers...
            </span>
          )}

          {!isCompleted && isFull && (
            <Button
              size="sm"
              variant="success"
              disabled={isCompleted || (!isOwner && !isVolunteer)}
              onClick={handleComplete}
            >
              Complete
            </Button>
          )}

          {isCompleted && (
            <span style={{ color: '#22c55e' }}>
              ✔ Task Completed
            </span>
          )}

        </div>
      </div>
    </div>
  );
}

export default NeedCard;