import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import Button from '../components/UI/Button';
import Input from '../components/UI/Input';
import Select from '../components/UI/Select';
import { toast } from 'react-toastify';
import { Autocomplete } from "@react-google-maps/api";

function ProfilePage() {
  const { user, users, updateUser } = useApp();

  const current = users.find(u => u.uid === user?.uid);

  const autoRef = useRef(null);
  const [coords, setCoords] = useState({ lat: null, lng: null });

  const [form, setForm] = useState({
    username: '',
    email: '',
    role: '',
    skill: '',
    location: '',
    phone: '',
    bio: '',
    subSkills: '',
    available: true,
    proofUrl: ''
  });

  // 📍 Auto-detect location (fallback)
  const detectCurrentLocation = () => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        setCoords({ lat, lng });

        console.log("📍 Auto location set:", lat, lng);
      },
      () => {
        console.warn("Location permission denied");
      }
    );
  };

  // 🔥 LOAD DATA
  useEffect(() => {
    if (current) {
      setForm({
        username: current.username || '',
        email: current.email || '',
        role: current.role || 'General',
        skill: current.skill || '',
        location: current.location || '',
        phone: current.phone || '',
        bio: current.bio || '',
        subSkills: Array.isArray(current.subSkills)
          ? current.subSkills.join(', ')
          : current.subSkills || '',
        available: current.available ?? true,
        proofUrl: current.proofUrl || ''
      });

      // ✅ preload coords OR fallback
      if (current.lat && current.lng) {
        setCoords({
          lat: current.lat,
          lng: current.lng
        });
      } else {
        detectCurrentLocation(); // fallback
      }
    }
  }, [current]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // ✅ GOOGLE PLACE SELECT
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

  // 💾 SAVE
  const handleSave = async () => {
    if (!form.username.trim()) {
      toast.error("⚠️ Username required");
      return;
    }

    if (!form.proofUrl) {
      toast.error("⚠️ Proof required");
      return;
    }

    if (!coords.lat) {
      toast.error("❌ Please select location properly");
      return;
    }

    try {
      const isAdmin = current.role?.toLowerCase() === "admin";

      await updateUser(user.uid, {
        username: form.username.trim(),
        email: form.email,
        role: form.role,
        skill: form.skill,
        location: form.location,

        lat: coords.lat,   // ✅ FIXED
        lng: coords.lng,   // ✅ FIXED

        phone: form.phone,
        bio: form.bio,
        available: form.available,
        proofUrl: form.proofUrl,

        subSkills: form.subSkills
          ? form.subSkills.split(',').map(s => s.trim())
          : [],

        status: isAdmin ? "approved" : "pending"
      });

      toast.success(
        isAdmin
          ? "✅ Profile updated instantly"
          : "⏳ Profile updated (waiting for admin approval)"
      );

    } catch (err) {
      toast.error(err.message);
    }
  };

  if (!current) return <div style={{ padding: 40 }}>Loading...</div>;

  return (
    <div style={{
      maxWidth: 650,
      margin: '40px auto',
      padding: 24,
      background: 'var(--card)',
      borderRadius: 16,
      border: '1px solid var(--border)',
      boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
    }}>

      {/* HEADER */}
      <div style={{ marginBottom: 20 }}>
        <h2>👤 Edit Profile</h2>
        <p style={{ color: 'var(--muted)', fontSize: 13 }}>
          Update your details
        </p>

        {current.role === "Admin" && (
          <div style={{ color: '#22c55e', fontSize: 12 }}>
            ⚡ Admin changes apply instantly
          </div>
        )}
      </div>

      <Input label="User ID (UID)" value={current.uid} disabled />

      <Input
        label="Username"
        value={form.username}
        onChange={e => set('username', e.target.value)}
      />

      <Input
        label="Email"
        value={form.email}
        onChange={e => set('email', e.target.value)}
      />

      <Select
        label="Hobby"
        value={form.skill}
        onChange={e => set('skill', e.target.value)}
        options={[
          { value: "", label: "Select your hobby" },
          { value: "Doctor", label: "Doctor" },
          { value: "Teacher", label: "Teacher" },
          { value: "Logistics", label: "Logistics" },
          { value: "Counseling", label: "Counseling" },
          { value: "Driver", label: "Driver" },
          { value: "Field worker", label: "Field worker" },
          { value: "Lawyer", label: "Lawyer" },
          { value: "Nurse", label: "Nurse" },
          { value: "Online volunteer", label: "Online volunteer" }
        ]}
      />

      {/* ✅ GOOGLE LOCATION */}
      <Autocomplete
        onLoad={(ref) => (autoRef.current = ref)}
        onPlaceChanged={handlePlaceSelect}
      >
        <Input
          label="Location"
          value={form.location}
          onChange={e => {
            set('location', e.target.value);
            setCoords({ lat: null, lng: null }); // force correct selection
          }}
        />
      </Autocomplete>

      <Input
        label="Phone"
        value={form.phone}
        onChange={e => set('phone', e.target.value)}
      />

      <Input
        label="Sub Skills"
        value={form.subSkills}
        onChange={e => set('subSkills', e.target.value)}
      />

      <textarea
        value={form.bio}
        onChange={e => set('bio', e.target.value)}
        placeholder="Bio"
        style={{ width: '100%', marginTop: 10, padding: 10 }}
      />

      <Select
        label="Availability"
        value={form.available ? "true" : "false"}
        onChange={e => set('available', e.target.value === "true")}
        options={[
          { value: "true", label: "🟢 Available" },
          { value: "false", label: "🔴 Not Available" }
        ]}
      />

      <Input
        label="Proof URL"
        value={form.proofUrl}
        onChange={e => set('proofUrl', e.target.value)}
      />

      <div style={{ marginTop: 20 }}>
        <Button onClick={handleSave} style={{ width: '100%' }}>
          💾 Save Changes
        </Button>
      </div>

    </div>
  );
}

export default ProfilePage;