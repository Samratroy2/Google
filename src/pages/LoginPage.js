import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate, Link } from 'react-router-dom';
import Button from '../components/UI/Button';
import Input from '../components/UI/Input';
import styles from './PostNeedPage.module.css';

function LoginPage() {
  const { login } = useApp();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.formCard} style={{ maxWidth: 420, margin: '80px auto' }}>
        <h2 className={styles.formTitle}>Login</h2>

        <Input
          label="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />

        <Input
          label="Password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />

        <div className={styles.formActions}>
          <Button onClick={handleLogin}>
            🔐 Login
          </Button>
        </div>

        <p style={{ marginTop: 16 }}>
          New user? <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;