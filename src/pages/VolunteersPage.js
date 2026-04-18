import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import VolunteerCard from '../components/Volunteers/VolunteerCard';
import Button from '../components/UI/Button';
import Input from '../components/UI/Input';
import Select from '../components/UI/Select';
import Modal from '../components/UI/Modal';
import { SKILL_TYPES } from '../data/mockData';
import { getInitials } from '../utils/helpers';
import { toast } from 'react-toastify';
import styles from './VolunteersPage.module.css';

const EMPTY_FORM = { name: '', skill: 'Helper', location: '', available: 'true', phone: '', bio: '' };

function VolunteersPage() {
  const { volunteers, addVolunteer } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [search, setSearch]       = useState('');
  const [filterSkill, setFilterSkill] = useState('All');
  const [filterAvail, setFilterAvail] = useState('All');
  const [errors, setErrors]       = useState({});

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const validate = () => {
    const e = {};
    if (!form.name.trim())     e.name     = 'Name is required';
    if (!form.location.trim()) e.location = 'Location is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = () => {
    if (!validate()) return;
    addVolunteer({
      ...form,
      available: form.available === 'true',
      avatar: getInitials(form.name),
      distance: parseFloat((Math.random() * 8 + 0.5).toFixed(1)),
      rating: 5.0,
      subSkills: [],
    });
    toast.success(`✅ ${form.name} registered as volunteer!`);
    setForm(EMPTY_FORM);
    setShowModal(false);
  };

  const filtered = volunteers.filter(v => {
    if (filterSkill !== 'All' && v.skill !== filterSkill) return false;
    if (filterAvail === 'Available' && !v.available)      return false;
    if (filterAvail === 'Busy'      &&  v.available)      return false;
    if (search && !v.name.toLowerCase().includes(search.toLowerCase()) &&
        !v.location.toLowerCase().includes(search.toLowerCase()))      return false;
    return true;
  });

  const available = volunteers.filter(v => v.available).length;

  return (
    <div>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Volunteers</h1>
          <p className={styles.sub}>{available} available · {volunteers.length} total</p>
        </div>
        <Button onClick={() => setShowModal(true)}>+ Register Volunteer</Button>
      </div>

      {/* Skill summary chips */}
      <div className={styles.skillSummary}>
        {['All', ...SKILL_TYPES].map(skill => {
          const count = skill === 'All' ? volunteers.length : volunteers.filter(v => v.skill === skill).length;
          return (
            <button
              key={skill}
              className={`${styles.skillChip} ${filterSkill === skill ? styles.active : ''}`}
              onClick={() => setFilterSkill(skill)}
            >
              {skill} <span className={styles.count}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Search & filter bar */}
      <div className={styles.filterBar}>
        <input
          className={styles.search}
          placeholder="🔍  Search by name or location…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className={styles.availFilter}>
          {['All', 'Available', 'Busy'].map(a => (
            <button
              key={a}
              className={`${styles.chip} ${filterAvail === a ? styles.chipActive : ''}`}
              onClick={() => setFilterAvail(a)}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 && (
        <div className={styles.empty}>No volunteers match your filters.</div>
      )}

      {filtered.map(v => <VolunteerCard key={v.id} volunteer={v} />)}

      {/* Register Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="🙋 Register as Volunteer" width={520}>
        <div className={styles.grid2}>
          <div style={{ gridColumn: '1/-1' }}>
            <Input label="Full Name" value={form.name} onChange={e => set('name', e.target.value)}
              placeholder="e.g. Rahul Sharma" required error={errors.name} />
          </div>
          <Select label="Primary Skill" value={form.skill} onChange={e => set('skill', e.target.value)} options={SKILL_TYPES} />
          <Select label="Availability" value={form.available} onChange={e => set('available', e.target.value)}
            options={[{ value: 'true', label: 'Available Now' }, { value: 'false', label: 'Not Available' }]} />
          <div style={{ gridColumn: '1/-1' }}>
            <Input label="Location" value={form.location} onChange={e => set('location', e.target.value)}
              placeholder="e.g. Sector 3, Area X" required error={errors.location} />
          </div>
          <div style={{ gridColumn: '1/-1' }}>
            <Input label="Phone (optional)" value={form.phone} onChange={e => set('phone', e.target.value)}
              placeholder="+91-XXXXX-XXXXX" />
          </div>
          <div style={{ gridColumn: '1/-1' }}>
            <label className={styles.label}>Bio (optional)</label>
            <textarea value={form.bio} onChange={e => set('bio', e.target.value)}
              placeholder="Brief description of your experience..."
              className={styles.textarea} rows={3} />
          </div>
        </div>
        <div className={styles.modalActions}>
          <Button variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button onClick={handleRegister}>Register</Button>
        </div>
      </Modal>
    </div>
  );
}

export default VolunteersPage;
