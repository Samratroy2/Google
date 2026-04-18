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

  // ⏱️ TICK FOR LIVE TIME UPDATE
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTick(t => t + 1);
    }, 10000); // update every 10 sec

    return () => clearInterval(interval);
  }, []);

  // 🔄 REAL-TIME NEEDS + LIVE TIMEAGO
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "needs"), (snapshot) => {
      const data = snapshot.docs.map(doc => {
        const d = doc.data();

        return {
          id: doc.id,
          ...d,
          timeAgo: getTimeAgo(d.createdAt)
        };
      });

      setNeeds(data);
    });

    return () => unsubscribe();
  }, [tick]); // 🔥 important for live updates

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

  // ➕ ADD NEED
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

  // 🔄 UPDATE NEED STATUS
  const updateNeedStatus = useCallback(async (id, status) => {
    const ref = doc(db, "needs", id);
    await updateDoc(ref, { status });
  }, []);

  // ❌ DELETE NEED
  const deleteNeed = useCallback(async (id) => {
    await deleteDoc(doc(db, "needs", id));
  }, []);

  // ➕ ADD VOLUNTEER
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

  // ❌ DELETE VOLUNTEER
  const deleteVolunteer = useCallback(async (id) => {
    await deleteDoc(doc(db, "volunteers", id));

    setNotifications(prev => [
      {
        id: Date.now(),
        text: "🗑 Volunteer removed",
        time: "Just now",
        read: false
      },
      ...prev
    ]);
  }, []);

  // 🔔 MARK ALL NOTIFICATIONS READ
  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <AppContext.Provider value={{
      theme, toggleTheme,
      needs, addNeed, updateNeedStatus, deleteNeed,
      volunteers, addVolunteer, deleteVolunteer,
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

// ⏱️ SMART TIME FORMATTER
function getTimeAgo(timestamp) {
  if (!timestamp) return "Just now";

  const diff = Date.now() - timestamp.toDate().getTime();

  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min${mins > 1 ? 's' : ''} ago`;
  if (hrs < 24) return `${hrs} hr${hrs > 1 ? 's' : ''} ago`;
  if (hrs < 48) return `${hrs} hr${hrs > 2 ? 's' : ''} ago`;

  return `${days} day${days > 1 ? 's' : ''} ago`;
}