import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import VolunteerCard from '../components/Volunteers/VolunteerCard';
import Input from '../components/UI/Input';
import { getInitials } from '../utils/helpers';
import styles from './VolunteersPage.module.css';

function VolunteersPage() {
  const { users = [], user } = useApp();
  const [search, setSearch] = useState('');

  const currentUser = users.find(u => u.uid === user?.uid);

  // 🚫 BLOCKED
  if (currentUser?.status === 'blocked') {
    return (
      <div style={{ padding: 40 }}>
        <h2>🚫 Access Denied</h2>
        <p>Your account is blocked</p>
      </div>
    );
  }

  // 🔥 GET VOLUNTEERS (UNCHANGED)
  const volunteers = users.filter(u =>
    u.role === "Volunteer" &&
    u.status === "approved"
  );

  // 🔍 SEARCH (UNCHANGED)
  const filtered = volunteers.filter(v =>
    v.email?.toLowerCase().includes(search.toLowerCase()) ||
    v.location?.toLowerCase().includes(search.toLowerCase())
  );

  // ✅ FIX: SAFE AVAILABLE COUNT (handles undefined)
  const available = volunteers.filter(v => v.available !== false).length;

  return (
    <div>

      {/* HEADER */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Volunteers</h1>
          <p className={styles.sub}>
            {available} available · {volunteers.length} total
          </p>
        </div>
      </div>

      {/* SEARCH */}
      <div className={styles.filterBar}>
        <input
          className={styles.search}
          placeholder="Search by email or location..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 && (
        <div className={styles.empty}>No volunteers found</div>
      )}

      {/* LIST */}
      {filtered.map(v => (
        <VolunteerCard
          key={v.uid}
          volunteer={{
            ...v,

            // ✅ KEEP YOUR ORIGINAL LOGIC
            name: v.username || v.email?.split('@')[0],
            avatar: getInitials(v.username || v.email),

            // ✅ ADD SAFE DEFAULTS (IMPORTANT)
            available: v.available !== false,
            tasksCompleted: v.tasksCompleted || 0,
            rating: v.rating || 0
          }}
        />
      ))}

    </div>
  );
}

export default VolunteersPage;