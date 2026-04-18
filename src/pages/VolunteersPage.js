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

const EMPTY_FORM = {
  skill: 'Helper',
  location: '',
  available: 'true',
  phone: '',
  bio: '',
  subSkills: ''
};

function VolunteersPage() {
  const { users = [], user, updateUser } = useApp();

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [search, setSearch] = useState('');
  const [filterSkill, setFilterSkill] = useState('All');
  const [filterAvail, setFilterAvail] = useState('All');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

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

  // ⏳ NOT APPROVED
  if (currentUser?.status === 'pending') {
    return (
      <div style={{ padding: 40 }}>
        <h2>⏳ Waiting for Approval</h2>
      </div>
    );
  }

  // 🔥 FILTER VOLUNTEERS FROM USERS
  const volunteers = users.filter(u =>
    u.role === "Volunteer" &&
    u.status === "approved"
  );

  const alreadyVolunteer = currentUser?.role === "Volunteer";

  // ✅ REGISTER AS VOLUNTEER (UPDATE USER DOC)
  const handleRegister = async () => {
    if (!form.location.trim()) {
      toast.error("Location required");
      return;
    }

    await updateUser(user.uid, {
      role: "Volunteer",
      skill: form.skill,
      location: form.location,
      available: form.available === 'true',
      phone: form.phone,
      bio: form.bio,
      subSkills: form.subSkills.split(',').map(s => s.trim())
    });

    toast.success("✅ You are now a volunteer!");
    setShowModal(false);
  };

  // 🔍 FILTER
  const filtered = volunteers.filter(v => {
    if (filterSkill !== 'All' && v.skill !== filterSkill) return false;
    if (filterAvail === 'Available' && !v.available) return false;
    if (filterAvail === 'Busy' && v.available) return false;

    if (
      search &&
      !v.email.toLowerCase().includes(search.toLowerCase()) &&
      !v.location?.toLowerCase().includes(search.toLowerCase())
    ) return false;

    return true;
  });

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

        {!alreadyVolunteer && (
          <Button onClick={() => setShowModal(true)}>
            Become Volunteer
          </Button>
        )}
      </div>

      {/* SEARCH */}
      <div className={styles.filterBar}>
        <input
          className={styles.search}
          placeholder="Search..."
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
            name: v.email.split('@')[0],
            avatar: getInitials(v.email)
          }}
        />
      ))}

      {/* MODAL */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Become Volunteer"
        width={520}
      >
        <Input
          label="Location"
          value={form.location}
          onChange={e => set('location', e.target.value)}
        />

        <Select
          label="Skill"
          value={form.skill}
          onChange={e => set('skill', e.target.value)}
          options={SKILL_TYPES}
        />

        <div style={{ marginTop: 20 }}>
          <Button onClick={handleRegister}>
            Register
          </Button>
        </div>
      </Modal>

    </div>
  );
}

export default VolunteersPage;