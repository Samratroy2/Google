import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { db, auth } from '../firebase';

import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  setDoc,
  getDoc
} from "firebase/firestore";

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "firebase/auth";

const AppContext = createContext(null);

export function AppProvider({ children }) {

  const [theme, setTheme] = useState('dark');
  const [needs, setNeeds] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [user, setUser] = useState(null);

  const [notifications, setNotifications] = useState([
    { id: 1, text: '🔔 New need posted', time: '2m ago', read: false }
  ]);

  const [tick, setTick] = useState(0);

  // 🔐 AUTH LISTENER
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        setUser(null);
        return;
      }

      const snap = await getDoc(doc(db, "users", u.uid));

      if (!snap.exists()) {
        setUser(null);
        return;
      }

      const data = snap.data();

      // 🚨 BLOCK if not approved
      if (data.status !== "approved") {
        setUser(null);
      } else {
        setUser(u);
      }

    });

    return () => unsub();
  }, []);

  // ⏱️ TIME TICK
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 10000);
    return () => clearInterval(interval);
  }, []);

  // 🔄 NEEDS REALTIME
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "needs"), (snap) => {
      setNeeds(snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timeAgo: getTimeAgo(doc.data().createdAt)
      })));
    });
    return () => unsub();
  }, [tick]);

  // 🔄 VOLUNTEERS REALTIME
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "volunteers"), (snap) => {
      setVolunteers(snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })));
    });
    return () => unsub();
  }, []);

  // 🎨 THEME
  const toggleTheme = () => {
    setTheme(t => {
      const next = t === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      return next;
    });
  };

  // 🔐 SIGNUP (WITH ROLE)
  const signup = async (email, password, role = "General", proofFile = null) => {

    const res = await createUserWithEmailAndPassword(auth, email, password);

    await setDoc(doc(db, "users", res.user.uid), {
      uid: res.user.uid,
      email,
      role,
      status: role === "General" ? "approved" : "pending",
      proofUrl: "",
      createdAt: serverTimestamp()
    });

    return res.user;
  };

  // 🔐 LOGIN (CHECK APPROVAL)
  const login = async (email, password) => {

    const res = await signInWithEmailAndPassword(auth, email, password);

    const snap = await getDoc(doc(db, "users", res.user.uid));

    if (!snap.exists()) {
      await signOut(auth);
      throw new Error("User not found");
    }

    const data = snap.data();

    if (data.status !== "approved") {
      await signOut(auth);
      throw new Error("⛔ Awaiting admin approval");
    }

    return res.user;
  };

  // 🔓 LOGOUT
  const logout = () => signOut(auth);

  // ➕ ADD NEED
  const addNeed = useCallback(async (need) => {
    await addDoc(collection(db, "needs"), {
      ...need,
      status: 'Pending',
      createdAt: serverTimestamp(),
      postedBy: user?.email || "Anonymous"
    });
  }, [user]);

  // 🔄 UPDATE NEED
  const updateNeedStatus = useCallback(async (id, status) => {
    await updateDoc(doc(db, "needs", id), { status });
  }, []);

  // ❌ DELETE NEED
  const deleteNeed = useCallback(async (id) => {
    await deleteDoc(doc(db, "needs", id));
  }, []);

  // ➕ ADD VOLUNTEER
  const addVolunteer = useCallback(async (v) => {
    await addDoc(collection(db, "volunteers"), {
      ...v,
      tasksCompleted: 0,
      rating: 5,
      joinedDate: new Date().toISOString().split('T')[0]
    });
  }, []);

  // ❌ DELETE VOLUNTEER
  const deleteVolunteer = useCallback(async (id) => {
    await deleteDoc(doc(db, "volunteers", id));
  }, []);

  const markAllRead = () =>
    setNotifications(n => n.map(x => ({ ...x, read: true })));

  return (
    <AppContext.Provider value={{
      theme, toggleTheme,
      needs, addNeed, updateNeedStatus, deleteNeed,
      volunteers, addVolunteer, deleteVolunteer,
      user, login, signup, logout,
      notifications, markAllRead
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}

// ⏱️ TIME FORMAT
function getTimeAgo(ts) {
  if (!ts) return "Just now";

  const diff = Date.now() - ts.toDate();
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(diff / 3600000);

  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  if (hrs < 24) return `${hrs}h ago`;

  return `${Math.floor(hrs / 24)}d ago`;
}