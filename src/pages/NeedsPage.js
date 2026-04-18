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
  const { needs, users, updateNeedStatus, deleteNeed } = useApp();
  const navigate = useNavigate();
  const { filters, setFilter, filtered } = useFilters(needs, ['title', 'location', 'postedBy']);

  const [matchState, setMatchState] = useState({ open: false, need: null, matches: [] });

  const handleMatch = (need) => {
    const matches = aiMatchVolunteers(need, users);
    setMatchState({ open: true, need, matches });
  };

  const handleAssign = (volunteer) => {
    updateNeedStatus(matchState.need.id, 'Assigned');
    toast.success(`✅ ${volunteer.name} assigned to "${matchState.need.title}"`);
  };

  const handleStatusChange = (id, status) => {
    updateNeedStatus(id, status);
    toast.success(`Status updated to ${status}`);
  };

  const handleDelete = (id) => {
    deleteNeed(id);
    toast.info('Need removed');
  };

  return (
    <div>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Active Needs</h1>
          <p className={styles.sub}>{filtered.length} requests found</p>
        </div>
        <Button onClick={() => navigate('/needs/post')}>+ Post Need</Button>
      </div>

      {/* Search + Filters */}
      <div className={styles.filters}>
        <input
          className={styles.search}
          placeholder="🔍  Search by title, location, NGO…"
          value={filters.search}
          onChange={e => setFilter('search', e.target.value)}
        />
        <div className={styles.filterGroups}>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Status</span>
            {STATUSES.map(s => (
              <button key={s} className={`${styles.chip} ${filters.status === s ? styles.active : ''}`}
                onClick={() => setFilter('status', s)}>{s}</button>
            ))}
          </div>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Type</span>
            {TYPES.map(t => (
              <button key={t} className={`${styles.chip} ${filters.type === t ? styles.active : ''}`}
                onClick={() => setFilter('type', t)}>{t}</button>
            ))}
          </div>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Urgency</span>
            {URGENCIES.map(u => (
              <button key={u} className={`${styles.chip} ${filters.urgency === u ? styles.active : ''}`}
                onClick={() => setFilter('urgency', u)}>{u}</button>
            ))}
          </div>
        </div>
      </div>

      {filtered.length === 0 && (
        <div className={styles.empty}>No needs match your filters. <button onClick={() => navigate('/needs/post')} className={styles.postLink}>Post one →</button></div>
      )}

      <div>
        {filtered.map(need => (
          <NeedCard
            key={need.id}
            need={need}
            onMatch={handleMatch}
            onStatusChange={handleStatusChange}
            onDelete={handleDelete}
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
