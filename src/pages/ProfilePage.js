import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import Button from '../components/UI/Button';
import Input from '../components/UI/Input';
import Select from '../components/UI/Select';
import { toast } from 'react-toastify';

function ProfilePage() {
  const { user, users, updateUser } = useApp();

  const current = users.find(u => u.uid === user?.uid);

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
    }
  }, [current]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // 💾 SAVE FUNCTION
  const handleSave = async () => {
    if (!form.username.trim()) {
      toast.error("⚠️ Username required");
      return;
    }

    if (!form.proofUrl) {
      toast.error("⚠️ Proof required");
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
        phone: form.phone,
        bio: form.bio,
        available: form.available,
        proofUrl: form.proofUrl,

        subSkills: form.subSkills
          ? form.subSkills.split(',').map(s => s.trim())
          : [],

        // ✅ ADMIN AUTO APPROVED
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
        <h2 style={{ marginBottom: 5 }}>👤 Edit Profile</h2>
        <p style={{ color: 'var(--muted)', fontSize: 13 }}>
          Update your details
        </p>

        {/* ✅ ADMIN INFO */}
        {current.role === "Admin" && (
          <div style={{ color: '#22c55e', fontSize: 12 }}>
            ⚡ Admin changes apply instantly
          </div>
        )}
      </div>

      {/* UID */}
      <Input label="User ID (UID)" value={current.uid} disabled />

      {/* USERNAME */}
      <Input
        label="Username"
        value={form.username}
        onChange={e => set('username', e.target.value)}
      />

      {/* EMAIL */}
      <Input
        label="Email"
        value={form.email}
        onChange={e => set('email', e.target.value)}
      />


      {/* SKILL */}
      <Select
        label="Hobby"
        value={form.skill}
        onChange={e => set('skill', e.target.value)}
        options={["Doctor", "Teacher", "Logistics", "Counseling", "Driver", "Field worker", "Lawyer", "Nurse", "Online volunteer"]}
      />

      {/* LOCATION */}
      <Input
        label="Location"
        value={form.location}
        onChange={e => set('location', e.target.value)}
      />

      {/* PHONE */}
      <Input
        label="Phone"
        value={form.phone}
        onChange={e => set('phone', e.target.value)}
      />

      {/* SUB SKILLS */}
      <Input
        label="Sub Skills (comma separated)"
        value={form.subSkills}
        onChange={e => set('subSkills', e.target.value)}
        placeholder="e.g. Surgery, First Aid"
      />

      {/* BIO */}
      <div style={{ marginTop: 12 }}>
        <label style={{ fontWeight: 600 }}>Bio</label>
        <textarea
          value={form.bio}
          onChange={e => set('bio', e.target.value)}
          style={{
            width: '100%',
            minHeight: 100,
            padding: 12,
            borderRadius: 10,
            border: '1px solid var(--border)',
            marginTop: 6,
            resize: 'vertical'
          }}
          placeholder="Tell something about yourself..."
        />
      </div>

      {/* AVAILABILITY */}
      <Select
        label="Availability"
        value={form.available ? "true" : "false"}
        onChange={e => set('available', e.target.value === "true")}
        options={[
          { value: "true", label: "🟢 Available" },
          { value: "false", label: "🔴 Not Available" }
        ]}
      />

      {/* PROOF */}
      <Input
        label="Proof URL"
        value={form.proofUrl}
        onChange={e => set('proofUrl', e.target.value)}
      />

      {/* SAVE BUTTON */}
      <div style={{ marginTop: 24 }}>
        <Button onClick={handleSave} style={{ width: '100%' }}>
          💾 Save Changes
        </Button>
      </div>

    </div>
  );
}

export default ProfilePage;