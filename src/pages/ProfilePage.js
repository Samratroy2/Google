import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import Button from '../components/UI/Button';
import Input from '../components/UI/Input';
import Select from '../components/UI/Select';
import { toast } from 'react-toastify';
import styles from './ProfilePage.module.css';
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
    proofUrl: '',

    // ✅ NEW (NGO fields)
    organizationName: '',
    registrationNumber: '',
    website: '',
    foundedYear: ''
  });

  const detectCurrentLocation = () => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        });
      },
      () => {
        console.warn("Location permission denied");
      }
    );
  };

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
        proofUrl: current.proofUrl || '',

        // ✅ Load NGO fields if exist
        organizationName: current.organizationName || '',
        registrationNumber: current.registrationNumber || '',
        website: current.website || '',
        foundedYear: current.foundedYear || ''
      });

      if (current.lat && current.lng) {
        setCoords({
          lat: current.lat,
          lng: current.lng
        });
      } else {
        detectCurrentLocation();
      }
    }
  }, [current]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const isNGO = form.role === "NGO"; // ✅ role check

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
      await updateUser(user.uid, {
        username: form.username.trim(),
        email: form.email,
        role: form.role,
        skill: form.skill,
        location: form.location,
        lat: coords.lat,
        lng: coords.lng,
        phone: form.phone,
        bio: form.bio,
        available: form.available,
        proofUrl: form.proofUrl,

        subSkills: form.subSkills
          ? form.subSkills.split(',').map(s => s.trim())
          : [],

        organizationName: form.organizationName,
        registrationNumber: form.registrationNumber,
        website: form.website,
        foundedYear: form.foundedYear,

        // ✅ Always approved
        status: "approved"
      });
      toast.success("✅ Profile updated successfully");
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (!current) return <div style={{ padding: 40 }}>Loading...</div>;

 return (
  <div className={styles.page}>
    <div className={styles.card}>

      <h2 className={styles.title}>👤 Edit Profile</h2>

      <div className={styles.field}>
        <Input label="User ID" value={current.uid} disabled />
      </div>

      <div className={styles.field}>
        <Input
          label="Username"
          value={form.username}
          onChange={e => set('username', e.target.value)}
        />
      </div>

      <div className={styles.field}>
        <Input label="Email" value={form.email} disabled />
      </div>

      {/* ================= NGO FORM ================= */}
      {isNGO ? (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Organization Details</div>

          <Input
            label="Organization Name"
            value={form.organizationName}
            onChange={e => set('organizationName', e.target.value)}
          />

          <Input
            label="Registration Number"
            value={form.registrationNumber}
            onChange={e => set('registrationNumber', e.target.value)}
          />

          <Input
            label="Website"
            value={form.website}
            onChange={e => set('website', e.target.value)}
          />

          <Input
            label="Founded Year"
            value={form.foundedYear}
            onChange={e => set('foundedYear', e.target.value)}
          />

          <textarea
            className={styles.textarea}
            value={form.bio}
            onChange={e => set('bio', e.target.value)}
            placeholder="About Organization"
          />
        </div>
      ) : (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Volunteer Details</div>

          {/* ================= VOLUNTEER FORM (UNCHANGED) ================= */}

          <Select
            label="Hobby"
            value={form.skill}
            onChange={e => set('skill', e.target.value)}
            options={[
              { value: "", label: "Select your skill" },

              { value: "Doctor", label: "Doctor" },
              { value: "Nurse", label: "Nurse" },
              { value: "Paramedic", label: "Paramedic" },
              { value: "Pharmacist", label: "Pharmacist" },

              { value: "Counseling", label: "Counselor" },
              { value: "Caregiver", label: "Caregiver" },
              { value: "Childcare", label: "Childcare Support" },

              { value: "Teacher", label: "Teacher" },
              { value: "Tutor", label: "Tutor" },
              { value: "Trainer", label: "Trainer" },

              { value: "Logistics", label: "Logistics" },
              { value: "Driver", label: "Driver" },
              { value: "Field worker", label: "Field Worker" },
              { value: "Delivery", label: "Delivery Support" },

              { value: "Cook", label: "Cook" },
              { value: "Food distribution", label: "Food Distribution" },

              { value: "IT Support", label: "IT Support" },
              { value: "Web Developer", label: "Web Developer" },
              { value: "Data Entry", label: "Data Entry" },

              { value: "Lawyer", label: "Lawyer" },
              { value: "Documentation", label: "Documentation" },
              { value: "Admin Support", label: "Admin Support" },

              { value: "Social Media", label: "Social Media Manager" },
              { value: "Content Writing", label: "Content Writer" },
              { value: "Translator", label: "Translator" },

              { value: "Online volunteer", label: "Online Volunteer" },

              { value: "Event Management", label: "Event Management" },
              { value: "Fundraising", label: "Fundraising" },
              { value: "Other", label: "Other" }
            ]}
          />

          <Input
            label="Sub Skills"
            value={form.subSkills}
            onChange={e => set('subSkills', e.target.value)}
          />

          <div className={styles.field}>
            <label className={styles.label}>Bio</label>

            <textarea
              className={styles.textarea}
              value={form.bio}
              onChange={e => set('bio', e.target.value)}
              placeholder="Enter your bio"
            />
          </div>

          <Select
            label="Availability"
            value={form.available ? "true" : "false"}
            onChange={e => set('available', e.target.value === "true")}
            options={[
              { value: "true", label: "🟢 Available" },
              { value: "false", label: "🔴 Not Available" }
            ]}
          />
        </div>
      )}

      {/* ================= COMMON ================= */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>Contact & Location</div>

        <Autocomplete
          onLoad={(ref) => (autoRef.current = ref)}
          onPlaceChanged={handlePlaceSelect}
        >
          <Input
            label="Location"
            value={form.location}
            onChange={e => {
              set('location', e.target.value);
              setCoords({ lat: null, lng: null });
            }}
          />
        </Autocomplete>

        <Input
          label="Phone"
          value={form.phone}
          onChange={e => set('phone', e.target.value)}
        />

        <Input
          label="Proof URL"
          value={form.proofUrl}
          onChange={e => set('proofUrl', e.target.value)}
        />
      </div>

      <Button onClick={handleSave} className={styles.saveBtn}>
        💾 Save Changes
      </Button>

    </div>
  </div>
);
}

export default ProfilePage;