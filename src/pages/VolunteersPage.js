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

  // 🔥 GET VOLUNTEERS
  const volunteers = users.filter(u =>
    u.role === "Volunteer" &&
    u.status === "approved"
  );

  // 🔍 SEARCH
  const filtered = volunteers.filter(v =>
    v.email?.toLowerCase().includes(search.toLowerCase()) ||
    v.location?.toLowerCase().includes(search.toLowerCase())
  );

  const available = volunteers.filter(v => v.available).length;

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
            name: v.username || v.email?.split('@')[0],
            avatar: getInitials(v.username || v.email)
          }}
        />
      ))}

    </div>
  );
}

export default VolunteersPage;