import React, { useState, useRef, useEffect } from 'react'; // 🆕 useEffect
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

// 🆕 AI IMPORTS
import {
  calculatePriorityScore,
  detectUrgencyScore,
  aiMatchVolunteers
} from '../utils/aiEngine';

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

  // ⚠️ ENHANCED (added users safely)
  const { addNeed, currentUser, users = [] } = useApp();

  const navigate = useNavigate();

  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [coords, setCoords] = useState({ lat: null, lng: null });

  // 🆕 AI STATE
  const [priorityPreview, setPriorityPreview] = useState(null);

  const autoRef = useRef(null);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));


  // ⚠️ ENHANCED NLP HANDLER (NON-BREAKING)
  const handleClassified = ({ category, urgency, qty, title }) => {

    const urgencyScore = detectUrgencyScore(title || "");

    let autoUrgency = "Medium";
    if (urgencyScore > 85) autoUrgency = "Critical";
    else if (urgencyScore > 70) autoUrgency = "High";

    setForm(f => ({
      ...f,
      title: title || f.title,
      type: category || f.type,
      urgency: urgency || autoUrgency, // 🆕 smarter fallback
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


  // 🆕 PRIORITY AUTO CALCULATION (SAFE)
  useEffect(() => {
    if (!form.title) return;

    const tempNeed = {
      ...form,
      qty: parseInt(form.qty) || 1,
      status: "Pending",
      createdAt: new Date()
    };

    const score = calculatePriorityScore(tempNeed);
    setPriorityPreview(score);

  }, [form]);


  // 🆕 AI VOLUNTEER SUGGESTIONS
  const suggestions =
    coords.lat && coords.lng
      ? aiMatchVolunteers(
          {
            ...form,
            lat: coords.lat,
            lng: coords.lng
          },
          users
        ).slice(0, 3)
      : [];


  const validate = () => {
    const e = {};

    if (!form.title.trim()) e.title = 'Title required';
    if (!form.location.trim()) e.location = 'Location required';
    if (!form.qty || isNaN(form.qty)) e.qty = 'Invalid quantity';

    if (!form.requiredVolunteers || isNaN(form.requiredVolunteers)) {
      e.requiredVolunteers = 'Invalid number';
    }

    // 🆕 SMART WARNING (non-blocking)
    if (parseInt(form.qty) > 1000) {
      e.qty = '⚠️ Large request — consider splitting';
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

      {/* HEADER */}
      <div className={styles.header}>
        <button className={styles.back} onClick={() => navigate(-1)}>← Back</button>
        <h1 className={styles.title}>Post a New Need</h1>
      </div>


      {/* NLP */}
      <NLPClassifier onClassified={handleClassified} />


      {/* 🆕 AI PRIORITY PREVIEW */}
      {priorityPreview && (
        <div className={styles.aiPreview}>
          🧠 Priority Score: <b>{priorityPreview}</b>

          {priorityPreview > 80 && " 🔥 Critical"}
          {priorityPreview > 60 && priorityPreview <= 80 && " ⚠️ High"}
        </div>
      )}


      <div className={styles.formCard}>

        <div className={styles.grid2}>

          <Input
            label="Title"
            value={form.title}
            onChange={e => set('title', e.target.value)}
            error={errors.title}
          />

          <Select
            label="Type"
            value={form.type}
            onChange={e => set('type', e.target.value)}
            options={NEED_TYPES}
          />

          <Select
            label="Urgency"
            value={form.urgency}
            onChange={e => set('urgency', e.target.value)}
            options={URGENCY_LEVELS}
          />

          <Input
            label="Quantity"
            value={form.qty}
            onChange={e => set('qty', e.target.value)}
            error={errors.qty}
          />

          <Input
            label="Required Volunteers"
            value={form.requiredVolunteers}
            onChange={e => set('requiredVolunteers', e.target.value)}
            error={errors.requiredVolunteers}
          />

          <Input
            label="Unit"
            value={form.unit}
            onChange={e => set('unit', e.target.value)}
          />

          {/* LOCATION */}
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


        {/* 🆕 AI SUGGESTIONS */}
        {suggestions.length > 0 && (
          <div className={styles.suggestions}>
            <h4>🤖 Suggested Volunteers</h4>

            {suggestions.map((v, i) => (
              <div key={i}>
                {v.username || v.email} — Score: {v.matchScore}
              </div>
            ))}
          </div>
        )}


        {/* ACTION */}
        <div className={styles.formActions}>
          <Button onClick={handleSubmit}>🚀 Submit</Button>
        </div>

      </div>
    </div>
  );
}

export default PostNeedPage;