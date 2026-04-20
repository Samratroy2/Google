import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useFilters } from '../hooks/useFilters';
import NeedCard from '../components/Needs/NeedCard';
import MatchModal from '../components/Needs/MatchModal';
import Button from '../components/UI/Button';
import { aiMatchVolunteers } from '../utils/aiEngine';
import { toast } from 'react-toastify';
import styles from './NeedsPage.module.css';

const STATUSES  = ['All', 'Pending', 'Assigned', 'Completed'];
const TYPES     = ['All', 'Food', 'Medical', 'Shelter', 'Water', 'Other'];
const URGENCIES = ['All', 'Critical', 'High', 'Medium', 'Low'];

function NeedsPage() {

  // ✅ ONLY ADD THESE (no removal)
  const { 
    needs, 
    users, 
    currentUser, 
    updateNeedStatus, 
    deleteNeed,
    assignVolunteer,
    completeTask
  } = useApp();

  const navigate = useNavigate();
  const { filters, setFilter, filtered } = useFilters(needs, ['title', 'location']);

  const [matchState, setMatchState] = useState({
    open: false,
    need: null,
    matches: []
  });

  // 🤖 AI match (prevent busy users)
  const handleMatch = (need) => {
    const availableUsers = users.filter(u => u.available !== false); // ✅ safe filter
    const matches = aiMatchVolunteers(need, availableUsers);
    setMatchState({ open: true, need, matches });
  };

  // ✅ Assign volunteer (UPDATED)
  const handleAssign = (volunteer) => {

    // ❗ prevent assigning busy volunteer
    if (volunteer.available === false) {
      toast.error("Volunteer is busy");
      return;
    }

    // ✅ NEW LOGIC
    if (assignVolunteer) {
      assignVolunteer(matchState.need.id, volunteer);
    } else {
      updateNeedStatus(matchState.need.id, 'Assigned');
    }

    toast.success(`✅ ${volunteer.name} assigned to "${matchState.need.title}"`);
  };

  // 🔄 Status change (UPDATED ONLY FOR COMPLETE)
  const handleStatusChange = (id, status) => {

    // ✅ intercept completion
    if (status === "Completed" && completeTask) {
      const need = needs.find(n => n.id === id);

      const rating = Number(prompt("Rate volunteer (1-5):"));

      if (!rating || rating < 1 || rating > 5) {
        toast.error("Invalid rating");
        return;
      }

      completeTask(need, rating);
      toast.success("Task completed & rated ⭐");
      return;
    }

    // 🔁 fallback (UNCHANGED)
    updateNeedStatus(id, status);
    toast.success(`Status updated to ${status}`);
  };

  // 🗑 Delete (UNCHANGED)
  const handleDelete = (id) => {
    if (window.confirm('Delete this need?')) {
      deleteNeed(id);
      toast.info('Need removed');
    }
  };

  // 🔐 Permission logic (UNCHANGED)
  const canDelete = (need) => {
    const ownerId =
      typeof need.postedBy === 'object'
        ? need.postedBy.uid
        : null;

    return (
      currentUser?.role === 'admin' ||
      currentUser?.uid === ownerId
    );
  };

  return (
    <div>
      {/* HEADER */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Active Needs</h1>
          <p className={styles.sub}>{filtered.length} requests found</p>
        </div>

        <Button onClick={() => navigate('/needs/post')}>
          + Post Need
        </Button>
      </div>

      {/* 🔍 SEARCH + FILTERS */}
      <div className={styles.filters}>
        <input
          className={styles.search}
          placeholder="🔍 Search by title or location…"
          value={filters.search}
          onChange={e => setFilter('search', e.target.value)}
        />

        <div className={styles.filterGroups}>

          {/* STATUS */}
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Status</span>
            {STATUSES.map(s => (
              <button
                key={s}
                className={`${styles.chip} ${filters.status === s ? styles.active : ''}`}
                onClick={() => setFilter('status', s)}
              >
                {s}
              </button>
            ))}
          </div>

          {/* TYPE */}
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Type</span>
            {TYPES.map(t => (
              <button
                key={t}
                className={`${styles.chip} ${filters.type === t ? styles.active : ''}`}
                onClick={() => setFilter('type', t)}
              >
                {t}
              </button>
            ))}
          </div>

          {/* URGENCY */}
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Urgency</span>
            {URGENCIES.map(u => (
              <button
                key={u}
                className={`${styles.chip} ${filters.urgency === u ? styles.active : ''}`}
                onClick={() => setFilter('urgency', u)}
              >
                {u}
              </button>
            ))}
          </div>

        </div>
      </div>

      {/* EMPTY STATE */}
      {filtered.length === 0 && (
        <div className={styles.empty}>
          No needs match your filters.
          <button
            onClick={() => navigate('/needs/post')}
            className={styles.postLink}
          >
            Post one →
          </button>
        </div>
      )}

      {/* 🧾 NEED LIST */}
      <div>
        {filtered.map(need => (
          <NeedCard
            key={need.id}
            need={need}
            onMatch={handleMatch}
            onStatusChange={handleStatusChange}
            onDelete={canDelete(need) ? handleDelete : undefined}
          />
        ))}
      </div>

      {/* 🤖 MATCH MODAL */}
      <MatchModal
        open={matchState.open}
        onClose={() => setMatchState(s => ({ ...s, open: false }))}
        need={matchState.need}
        matches={matchState.matches}
        onAssign={handleAssign}
      />
    </div>
  );
}

export default NeedsPage;