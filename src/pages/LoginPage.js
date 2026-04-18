import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate, Link } from 'react-router-dom';
import Button from '../components/UI/Button';
import Input from '../components/UI/Input';
import { toast } from 'react-toastify';
import styles from './PostNeedPage.module.css';

function LoginPage() {
  const { login, users, logActivity } = useApp(); // ✅ added logActivity
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      toast.error("⚠️ Please fill all fields");
      return;
    }

    try {
      setLoading(true);

      const res = await login(email, password);

      // 🔥 FIND USER FROM FIRESTORE
      const dbUser = users.find(u => u.uid === res.uid);

      if (!dbUser) {
        throw new Error("User data missing");
      }

      // ❌ BLOCKED
      if (dbUser.status === "blocked") {
        throw new Error("blocked");
      }

      // ❌ DELETED
      if (dbUser.status === "deleted") {
        throw new Error("deleted");
      }

      // ✅ LOG LOGIN ACTIVITY
      await logActivity(email, "🔐 Login");

      // ✅ SUCCESS
      toast.success("✅ Login successful");
      navigate('/dashboard');

    } catch (err) {
      console.error(err);

      if (err.message === "blocked") {
        toast.error("🚫 You are blocked by admin");
      }
      else if (err.message === "deleted") {
        toast.error("❌ Your account was deleted");
      }
      else if (err.code === "auth/wrong-password") {
        toast.error("❌ Wrong password");
      }
      else if (err.code === "auth/user-not-found") {
        toast.error("❌ User not found");
      }
      else if (err.message?.includes("approval")) {
        toast.error("⏳ Awaiting admin approval");
      }
      else {
        toast.error(err.message || "Login failed");
      }

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div
        className={styles.formCard}
        style={{ maxWidth: 420, margin: '80px auto' }}
      >
        <h2 className={styles.formTitle}>🔐 Login</h2>

        <Input
          label="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Enter your email"
        />

        <Input
          label="Password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Enter password"
        />

        <div className={styles.formActions}>
          <Button onClick={handleLogin} disabled={loading}>
            {loading ? "Logging in..." : "🚀 Login"}
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