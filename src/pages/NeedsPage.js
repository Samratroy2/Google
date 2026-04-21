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
const URGENCIES = ['All', 'Critical', 'High', 'Medium', 'Low'];
const TYPES = [
  'All',
  'Food',
  'Medical',
  'Shelter',
  'Water',
  'Education',
  'Legal',
  'Technical',
  'Communication',
  'Support',
  'Operations',
  'Remote',
  'Other'
];

function NeedsPage() {

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

  const handleMatch = (need) => {
    const availableUsers = users.filter(u => u.available !== false);
    const matches = aiMatchVolunteers(need, availableUsers);
    setMatchState({ open: true, need, matches });
  };

  const handleAssign = (volunteers) => {
    const list = Array.isArray(volunteers) ? volunteers : [volunteers];
    const valid = list.filter(v => v.available !== false);

    if (valid.length === 0) {
      toast.error("No available volunteers selected");
      return;
    }

    if (assignVolunteer) {
      assignVolunteer(matchState.need.id, valid);
    } else {
      updateNeedStatus(matchState.need.id, 'Assigned');
    }

    toast.success(`✅ ${valid.length} volunteer(s) assigned`);
  };

  // ✅ FINAL FIXED LOGIC
  const handleStatusChange = (id, status, ratings = null) => {

    const need = needs.find(n => n.id === id);

    if (status === "Completed" && completeTask) {

      const creatorEmail =
        typeof need.postedBy === 'object'
          ? need.postedBy.name
          : need.postedBy;

      const isCreator = currentUser?.email === creatorEmail;

      // 👑 CREATOR → MUST GIVE RATING
      if (isCreator) {
        if (!ratings || ratings.length === 0) {
          toast.error("⚠️ You must rate all volunteers");
          return;
        }

        completeTask(need, ratings);
        toast.success("✅ Task completed & volunteers rated ⭐");
      }

      // 👤 VOLUNTEER → NO RATING
      else {
        completeTask(need, []);

        // 📧 EMAIL TRIGGER (mock)
        console.log(
          `📧 Email sent to ${creatorEmail}: Please rate assigned volunteers`
        );

        toast.success("✅ Task completed. Creator notified for rating.");
      }

      return;
    }

    updateNeedStatus(id, status);
    toast.success(`Status updated to ${status}`);
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this need?')) {
      deleteNeed(id);
      toast.info('Need removed');
    }
  };

  const canDelete = (need) => {
    const ownerName =
      typeof need.postedBy === 'object'
        ? need.postedBy.name
        : need.postedBy;

    const userName = currentUser?.email;

    return (
      currentUser?.role === 'admin' ||
      (userName && ownerName && userName === ownerName)
    );
  };

  return (
    <div>

      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Active Needs</h1>
          <p className={styles.sub}>{filtered.length} requests found</p>
        </div>

        <Button onClick={() => navigate('/needs/post')}>
          + Post Need
        </Button>
      </div>

      <div className={styles.filters}>
        <input
          className={styles.search}
          placeholder="🔍 Search by title or location…"
          value={filters.search}
          onChange={e => setFilter('search', e.target.value)}
        />

        <div className={styles.filterGroups}>

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

      <div>
        {filtered.map(need => (
          <NeedCard
            key={need.id}
            need={need}
            onMatch={handleMatch}
            onStatusChange={handleStatusChange}
            onDelete={canDelete(need) ? handleDelete : undefined}
            currentUser={currentUser}
          />
        ))}
      </div>

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