import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate, Link } from 'react-router-dom';
import Button from '../components/UI/Button';
import Input from '../components/UI/Input';
import Select from '../components/UI/Select';
import styles from './PostNeedPage.module.css';

const ROLES = [
  { value: 'General', label: 'General Volunteer' },
  { value: 'Doctor', label: 'Doctor' },
  { value: 'Driver', label: 'Driver' },
  {value: 'Helper', label: 'Helper'},
  {value: 'Logistics', label: 'Logistics'},
  { value: 'Counselor', label: 'Counselor' },
  { value: 'Other', label: 'Other' }
];

function RegisterPage() {
  const { signup } = useApp();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('General');
  const [file, setFile] = useState(null);

  const requiresProof = role === "Doctor" || role === "Teacher";

  const handleRegister = async () => {
    try {
      await signup(email, password, role, file);

      alert(
        requiresProof
          ? "⏳ Awaiting admin verification"
          : "✅ Registered successfully"
      );

      navigate('/login');
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.formCard} style={{ maxWidth: 420, margin: '80px auto' }}>
        <h2 className={styles.formTitle}>Create Account</h2>

        <Input label="Email" value={email} onChange={e => setEmail(e.target.value)} />
        <Input type="password" label="Password" value={password} onChange={e => setPassword(e.target.value)} />

        <Select
          label="Select Role"
          value={role}
          onChange={e => setRole(e.target.value)}
          options={ROLES}
        />

        {requiresProof && (
          <input
            type="file"
            onChange={e => setFile(e.target.files[0])}
            style={{ marginTop: 10 }}
          />
        )}

        <div className={styles.formActions}>
          <Button onClick={handleRegister}>🚀 Create Account</Button>
        </div>

        <p style={{ marginTop: 16 }}>
          Already have account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}

export default RegisterPage;