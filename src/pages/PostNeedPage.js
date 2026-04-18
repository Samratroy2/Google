import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import NLPClassifier from '../components/Needs/NLPClassifier';
import Button from '../components/UI/Button';
import Input from '../components/UI/Input';
import Select from '../components/UI/Select';
import { NEED_TYPES, URGENCY_LEVELS } from '../data/mockData';
import { toast } from 'react-toastify';
import styles from './PostNeedPage.module.css';

const EMPTY = {
  title: '',
  type: 'Food',
  qty: '',
  unit: 'packets',
  location: '',
  urgency: 'Medium',
  description: ''
};

function PostNeedPage() {
  const { addNeed } = useApp();
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});

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

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = 'Title is required';
    if (!form.location.trim()) e.location = 'Location is required';
    if (!form.qty || isNaN(form.qty) || Number(form.qty) < 1)
      e.qty = 'Enter a valid quantity';

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    // ✅ CLEAN + FIRESTORE READY DATA
    addNeed({
      title: form.title,
      category: form.type,          // 🔥 FIX (important)
      urgency: form.urgency,
      location: form.location,
      description: form.description,
      qty: parseInt(form.qty),
      unit: form.unit,
      lat: 23.52 + Math.random() * 0.06,
      lng: 87.29 + Math.random() * 0.08,
      postedBy: 'You',
    });

    toast.success('✅ Need posted successfully!');
    navigate('/needs');
  };

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <button className={styles.back} onClick={() => navigate(-1)}>
          ← Back
        </button>
        <h1 className={styles.title}>Post a New Need</h1>
        <p className={styles.sub}>
          Fill the form below or use AI to classify your need automatically
        </p>
      </div>

      {/* AI Classifier */}
      <NLPClassifier onClassified={handleClassified} />

      {/* Form */}
      <div className={styles.formCard}>
        <h2 className={styles.formTitle}>Need Details</h2>

        <div className={styles.grid2}>
          {/* Title */}
          <div style={{ gridColumn: '1 / -1' }}>
            <Input
              label="Title / Description"
              value={form.title}
              onChange={e => set('title', e.target.value)}
              placeholder="e.g. Need 50 food packets urgently"
              required
              error={errors.title}
            />
          </div>

          {/* Type */}
          <Select
            label="Need Type"
            value={form.type}
            onChange={e => set('type', e.target.value)}
            options={NEED_TYPES}
            required
          />

          {/* Urgency */}
          <Select
            label="Urgency Level"
            value={form.urgency}
            onChange={e => set('urgency', e.target.value)}
            options={URGENCY_LEVELS}
            required
          />

          {/* Quantity */}
          <Input
            label="Quantity"
            type="number"
            value={form.qty}
            onChange={e => set('qty', e.target.value)}
            placeholder="e.g. 50"
            required
            error={errors.qty}
          />

          {/* Unit */}
          <Input
            label="Unit"
            value={form.unit}
            onChange={e => set('unit', e.target.value)}
            placeholder="e.g. packets, litres, people"
          />

          {/* Location */}
          <div style={{ gridColumn: '1 / -1' }}>
            <Input
              label="Location"
              value={form.location}
              onChange={e => set('location', e.target.value)}
              placeholder="e.g. Sector 4, Area X"
              required
              error={errors.location}
            />
          </div>

          {/* Description */}
          <div style={{ gridColumn: '1 / -1' }}>
            <label className={styles.label}>Additional Details</label>
            <textarea
              value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="Provide more context about the situation..."
              className={styles.textarea}
              rows={4}
            />
          </div>
        </div>

        {/* Preview */}
        <div className={styles.preview}>
          <span className={styles.previewLabel}>Preview:</span>
          <span className={styles.previewText}>
            [{form.urgency}] {form.type} need — {form.qty || '?'}{' '}
            {form.unit || ''} at {form.location || '?'}
          </span>
        </div>

        {/* Actions */}
        <div className={styles.formActions}>
          <Button variant="ghost" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>🚀 Submit Need</Button>
        </div>
      </div>
    </div>
  );
}

export default PostNeedPage;