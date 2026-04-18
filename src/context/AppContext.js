import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect
} from 'react';

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
  const [users, setUsers] = useState([]);
  const [user, setUser] = useState(null);

  const [notifications, setNotifications] = useState([
    { id: 1, text: '🔔 New need posted', time: '2m ago', read: false }
  ]);

  const [tick, setTick] = useState(0);

  // ✅ FIXED: activities INSIDE component
  const [activities, setActivities] = useState([]);

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

      setUser({
        ...u,
        role: data.role || "General"
      });
    });

    return () => unsub();
  }, []);

  // ⏱️ TIME TICK
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 10000);
    return () => clearInterval(interval);
  }, []);

  // 🔄 NEEDS
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

  // 🔄 VOLUNTEERS
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "volunteers"), (snap) => {
      setVolunteers(snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })));
    });
    return () => unsub();
  }, []);

  // 🔄 USERS
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "users"), (snap) => {
      setUsers(snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })));
    });
    return () => unsub();
  }, []);

  // ✅ FIXED: Activity listener INSIDE
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "activities"), (snap) => {
      setActivities(
        snap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
      );
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

  // 🔐 SIGNUP
  const signup = async (email, password, role = "General") => {
    const res = await createUserWithEmailAndPassword(auth, email, password);

    await setDoc(doc(db, "users", res.user.uid), {
      uid: res.user.uid,
      email,
      role,
      status: "approved",
      proofUrl: "",
      createdAt: serverTimestamp()
    });

    return res.user;
  };

  // 🔐 LOGIN
  const login = async (email, password) => {
    const res = await signInWithEmailAndPassword(auth, email, password);

    const snap = await getDoc(doc(db, "users", res.user.uid));

    if (!snap.exists()) {
      await signOut(auth);
      throw new Error("User not found");
    }

    // ✅ LOG LOGIN ACTIVITY
    await logActivity(email, "Login");

    return res.user;
  };

  // 🔓 LOGOUT
  const logout = async () => {
    if (user?.email) {
      await logActivity(user.email, "Logout");
    }
    await signOut(auth);
  };

  // ✏️ UPDATE USER
  const updateUser = async (uid, data) => {
    await updateDoc(doc(db, "users", uid), data);
  };

  const approveUser = async (uid) => {
    await updateDoc(doc(db, "users", uid), {
      status: "approved"
    });
  };

  const blockUser = async (uid) => {
    await updateDoc(doc(db, "users", uid), {
      status: "blocked"
    });
  };

  const unblockUser = async (uid) => {
    await updateDoc(doc(db, "users", uid), {
      status: "approved"
    });
  };

  const deleteUserAccount = async (uid) => {
    await updateDoc(doc(db, "users", uid), {
      status: "deleted"
    });
  };

  // ➕ NEED
  const addNeed = useCallback(async (need) => {
    await addDoc(collection(db, "needs"), {
      ...need,
      status: 'Pending',
      createdAt: serverTimestamp(),
      postedBy: user?.email || "Anonymous"
    });
  }, [user]);

  const updateNeedStatus = useCallback(async (id, status) => {
    await updateDoc(doc(db, "needs", id), { status });
  }, []);

  const deleteNeed = useCallback(async (id) => {
    await deleteDoc(doc(db, "needs", id));
  }, []);

  // ➕ VOLUNTEER
  const addVolunteer = useCallback(async (v) => {
    await addDoc(collection(db, "volunteers"), {
      ...v,
      tasksCompleted: 0,
      rating: 5,
      joinedDate: new Date().toISOString().split('T')[0]
    });
  }, []);

  const deleteVolunteer = useCallback(async (id) => {
    await deleteDoc(doc(db, "volunteers", id));
  }, []);

  // 🔔 NOTIFICATIONS
  const markAllRead = () =>
    setNotifications(n => n.map(x => ({ ...x, read: true })));

  // ✅ FIXED: INSIDE FUNCTION
  const logActivity = async (email, action, proofUrl = "") => {
    await addDoc(collection(db, "activities"), {
      email,
      action,
      proofUrl,
      createdAt: serverTimestamp()
    });
  };

  return (
    <AppContext.Provider value={{
      theme, toggleTheme,

      needs, addNeed, updateNeedStatus, deleteNeed,
      volunteers, addVolunteer, deleteVolunteer,

      user, login, signup, logout,

      users,
      updateUser,
      approveUser,
      deleteUserAccount,
      blockUser,
      unblockUser,

      notifications, markAllRead,

      activities,       // ✅ FIXED
      logActivity       // ✅ FIXED
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