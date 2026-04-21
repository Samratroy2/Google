import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import NLPClassifier from '../components/Needs/NLPClassifier';
import Button from '../components/UI/Button';
import Input from '../components/UI/Input';
import Select from '../components/UI/Select';
import { NEED_TYPES, URGENCY_LEVELS } from '../data/mockData';
import { toast } from 'react-toastify';
import styles from './PostNeedPage.module.css';

import { Autocomplete } from "@react-google-maps/api";

const EMPTY = {
  title: '',
  type: 'Food',
  qty: '',
  unit: 'packets',
  location: '',
  urgency: 'Medium',
  description: '',
  requiredVolunteers: ''
};

function PostNeedPage() {
  const { addNeed, currentUser } = useApp();
  const navigate = useNavigate();

  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [coords, setCoords] = useState({ lat: null, lng: null });

  const autoRef = useRef(null); // ✅ FIXED HERE

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleClassified = ({ category, urgency, qty, title }) => {
    setForm(f => ({
      ...f,
      title: title || f.title,
      type: category || f.type,
      urgency: urgency || f.urgency,
      qty: qty ? String(qty) : f.qty,
    }));
  };

  const handlePlaceSelect = () => {
    const place = autoRef.current.getPlace();

    if (!place || !place.geometry) {
      toast.error("❌ Select location from dropdown");
      return;
    }

    const lat = place.geometry.location.lat();
    const lng = place.geometry.location.lng();

    setCoords({ lat, lng });

    setForm(f => ({
      ...f,
      location: place.formatted_address || place.name
    }));
  };

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = 'Title required';
    if (!form.location.trim()) e.location = 'Location required';
    if (!form.qty || isNaN(form.qty)) e.qty = 'Invalid quantity';
    if (!form.requiredVolunteers || isNaN(form.requiredVolunteers)) {
      e.requiredVolunteers = 'Invalid number';
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    if (!coords.lat) {
      toast.error("❌ Please select location properly");
      return;
    }

    // ✅ CRITICAL FIX
    if (!currentUser || !currentUser.email) {
      toast.error("User not loaded. Please login again.");
      return;
    }

    addNeed({
      ...form,
      qty: parseInt(form.qty),
      requiredVolunteers: parseInt(form.requiredVolunteers),
      lat: coords.lat,
      lng: coords.lng,
      postedBy: currentUser.email
    });

    toast.success("📍 Need posted!");
    navigate('/needs');
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className={styles.back} onClick={() => navigate(-1)}>← Back</button>
        <h1 className={styles.title}>Post a New Need</h1>
      </div>

      <NLPClassifier onClassified={handleClassified} />

      <div className={styles.formCard}>
        <div className={styles.grid2}>
          <Input label="Title" value={form.title} onChange={e => set('title', e.target.value)} error={errors.title} />

          <Select label="Type" value={form.type} onChange={e => set('type', e.target.value)} options={NEED_TYPES} />

          <Select label="Urgency" value={form.urgency} onChange={e => set('urgency', e.target.value)} options={URGENCY_LEVELS} />

          <Input label="Quantity" value={form.qty} onChange={e => set('qty', e.target.value)} error={errors.qty} />

          <Input label="Required Volunteers" value={form.requiredVolunteers} onChange={e => set('requiredVolunteers', e.target.value)} error={errors.requiredVolunteers} />

          <Input label="Unit" value={form.unit} onChange={e => set('unit', e.target.value)} />

          <div style={{ gridColumn: '1 / -1' }}>
            <Autocomplete
              onLoad={(ref) => (autoRef.current = ref)}
              onPlaceChanged={handlePlaceSelect}
            >
              <Input
                label="Location"
                value={form.location}
                onChange={e => set('location', e.target.value)}
                error={errors.location}
              />
            </Autocomplete>
          </div>
        </div>

        <div className={styles.formActions}>
          <Button onClick={handleSubmit}>🚀 Submit</Button>
        </div>
      </div>
    </div>
  );
}

export default PostNeedPage;