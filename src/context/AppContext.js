import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect
} from 'react';

import { db, auth } from '../firebase';

// ✅ AI + GEO (MUST BE AT TOP)
import { calculatePriorityScore } from '../utils/aiEngine';
import { enrichNeedsWithCoords } from '../utils/geocodingHelper';

import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  setDoc,
  getDoc,
  query,
  orderBy
} from "firebase/firestore";

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence
} from "firebase/auth";

const AppContext = createContext(null);

export function AppProvider({ children }) {

  const [theme, setTheme] = useState('dark');
  const [needs, setNeeds] = useState([]);
  const [users, setUsers] = useState([]);
  const [user, setUser] = useState(null);
  const [activities, setActivities] = useState([]);
  const [authLoading, setAuthLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);

  // ─────────────────────────────────────────────
  // 🎨 THEME
  // ─────────────────────────────────────────────
  const toggleTheme = () => {
    setTheme(prev => prev === "dark" ? "light" : "dark");
  };

  useEffect(() => {
    document.body.setAttribute("data-theme", theme);
  }, [theme]);

  // ─────────────────────────────────────────────
  // 🔔 NOTIFICATIONS
  // ─────────────────────────────────────────────
  const addNotification = useCallback((text) => {
    const newNotif = {
      id: Date.now(),
      text,
      time: new Date().toLocaleTimeString(),
      read: false
    };
    setNotifications(prev => [newNotif, ...prev]);
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications(prev =>
      prev.map(n => ({ ...n, read: true }))
    );
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  // ─────────────────────────────────────────────
  // 🔐 AUTH
  // ─────────────────────────────────────────────
  useEffect(() => {
    setPersistence(auth, browserLocalPersistence)
      .catch(err => console.error("Persistence error:", err));
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        setUser(null);
        setAuthLoading(false);
        return;
      }

      try {
        const snap = await getDoc(doc(db, "users", u.uid));

        if (!snap.exists()) {
          setUser(null);
          return;
        }

        const data = snap.data();

        setUser({
          ...u,
          role: data.role || "General",
          name: data.name || u.email
        });

      } catch (err) {
        console.error(err);
      } finally {
        setAuthLoading(false);
      }
    });

    return () => unsub();
  }, []);

  // ─────────────────────────────────────────────
  // 📦 NEEDS (FIXED + MERGED)
  // ─────────────────────────────────────────────
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "needs"), async (snap) => {

      const raw = snap.docs.map(doc => {
        const data = doc.data();

        return {
          id: doc.id,
          ...data,
          priorityScore: calculatePriorityScore(data),
          timeAgo: getTimeAgo(data.createdAt)
        };
      });

      // ✅ Apply geocoding AFTER
      const enriched = await enrichNeedsWithCoords(raw);

      setNeeds(enriched);
    });

    return () => unsubscribe();
  }, []);

  // ─────────────────────────────────────────────
  // 👥 USERS
  // ─────────────────────────────────────────────
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "users"), (snap) => {
      setUsers(
        snap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
      );
    });
    return () => unsub();
  }, []);

  // ─────────────────────────────────────────────
  // 📊 ACTIVITIES
  // ─────────────────────────────────────────────
  useEffect(() => {
    const q = query(collection(db, "activities"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setActivities(
        snap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
      );
    });
    return () => unsub();
  }, []);

  // ─────────────────────────────────────────────
  // 📜 ACTIVITY LOG
  // ─────────────────────────────────────────────
  const logActivity = useCallback(async (action, emailOverride = null) => {
    try {
      await addDoc(collection(db, "activities"), {
        email: emailOverride || user?.email || "System",
        name: user?.name || "System",
        action,
        createdAt: serverTimestamp()
      });
    } catch (err) {
      console.error(err);
    }
  }, [user]);

  // ─────────────────────────────────────────────
  // 🔐 AUTH ACTIONS
  // ─────────────────────────────────────────────
  const signup = async (email, password, role = "General", name = "") => {
    const res = await createUserWithEmailAndPassword(auth, email, password);

    await setDoc(doc(db, "users", res.user.uid), {
      uid: res.user.uid,
      email,
      name,
      role,
      status: role === "Volunteer" ? "pending" : "approved",
      createdAt: serverTimestamp()
    });

    return res.user;
  };

  const login = async (email, password) => {
    const res = await signInWithEmailAndPassword(auth, email, password);
    await logActivity("🔐 Login", email);
    return res.user;
  };

  const logout = async () => {
    await logActivity("🚪 Logout", user?.email);
    await signOut(auth);
  };

  // ─────────────────────────────────────────────
  // ➕ NEED ACTIONS
  // ─────────────────────────────────────────────
  const addNeed = useCallback(async (need) => {
    try {
      await addDoc(collection(db, "needs"), {
        ...need,
        status: 'Pending',
        createdAt: serverTimestamp(),
        postedBy: {
          name: user?.name,
          uid: user?.uid,
          email: user?.email
        }
      });

      addNotification("📢 New need posted");
      await logActivity("📦 Created a need");

    } catch (err) {
      console.error(err);
    }
  }, [user, logActivity, addNotification]);

  const updateNeedStatus = async (id, status) => {
    await updateDoc(doc(db, "needs", id), { status });
  };

  const deleteNeed = async (id) => {
    await deleteDoc(doc(db, "needs", id));
  };

  // ─────────────────────────────────────────────
  // 🎯 CONTEXT VALUE
  // ─────────────────────────────────────────────
  return (
    <AppContext.Provider value={{
      theme,
      toggleTheme,

      needs,
      users,
      activities,

      notifications,
      markAllRead,
      unreadCount,

      addNeed,
      updateNeedStatus,
      deleteNeed,

      user,
      currentUser: user,
      authLoading,

      login,
      signup,
      logout,

      logActivity
    }}>
      {children}
    </AppContext.Provider>
  );
}

// ─────────────────────────────────────────────
// 🧠 HOOK
// ─────────────────────────────────────────────
export function useApp() {
  return useContext(AppContext);
}

// ─────────────────────────────────────────────
// ⏱ TIME FORMATTER
// ─────────────────────────────────────────────
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