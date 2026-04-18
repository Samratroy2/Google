import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { db } from '../firebase';
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp
} from "firebase/firestore";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [theme, setTheme] = useState('dark');
  const [needs, setNeeds] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [notifications, setNotifications] = useState([
    { id: 1, text: '🔔 New need posted in Sector 4', time: '2m ago', read: false },
    { id: 2, text: '✅ Volunteer matched for Medical need', time: '10m ago', read: false },
    { id: 3, text: '🤖 AI prediction: Food demand rising in Zone 3', time: '1h ago', read: true },
  ]);

  // 🔄 REAL-TIME NEEDS
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "needs"), (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timeAgo: getTimeAgo(doc.data().createdAt)
      }));
      setNeeds(data);
    });

    return () => unsubscribe();
  }, []);

  // 🔄 REAL-TIME VOLUNTEERS
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "volunteers"), (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setVolunteers(data);
    });

    return () => unsubscribe();
  }, []);

  const toggleTheme = () => {
    setTheme(t => {
      const next = t === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      return next;
    });
  };

  // ➕ ADD NEED (Firestore)
  const addNeed = useCallback(async (need) => {
    await addDoc(collection(db, "needs"), {
      ...need,
      status: 'Pending',
      createdAt: serverTimestamp()
    });

    setNotifications(prev => [
      { id: Date.now(), text: `🔔 New need posted: ${need.title}`, time: 'Just now', read: false },
      ...prev
    ]);
  }, []);

  // 🔄 UPDATE STATUS (Firestore)
  const updateNeedStatus = useCallback(async (id, status) => {
    const ref = doc(db, "needs", id);
    await updateDoc(ref, { status });
  }, []);

  // ❌ DELETE NEED (Firestore)
  const deleteNeed = useCallback(async (id) => {
    await deleteDoc(doc(db, "needs", id));
  }, []);

  // ➕ ADD VOLUNTEER (Firestore)
  const addVolunteer = useCallback(async (volunteer) => {
    await addDoc(collection(db, "volunteers"), {
      ...volunteer,
      tasksCompleted: 0,
      rating: 5.0,
      joinedDate: new Date().toISOString().split('T')[0]
    });

    setNotifications(prev => [
      { id: Date.now(), text: `🙋 New volunteer registered: ${volunteer.name}`, time: 'Just now', read: false },
      ...prev
    ]);
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <AppContext.Provider value={{
      theme, toggleTheme,
      needs, addNeed, updateNeedStatus, deleteNeed,
      volunteers, addVolunteer,
      notifications, markAllRead, unreadCount,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

// ⏱ Helper (NEW)
function getTimeAgo(timestamp) {
  if (!timestamp) return "Just now";

  const diff = Date.now() - timestamp.toDate();
  const hrs = Math.floor(diff / 3600000);

  if (hrs < 1) return "Just now";
  if (hrs < 24) return `${hrs} hrs ago`;

  const days = Math.floor(hrs / 24);
  return `${days} day(s) ago`;
}