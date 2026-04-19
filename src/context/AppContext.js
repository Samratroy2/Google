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

  // ✅ NEW
  const [authLoading, setAuthLoading] = useState(true);

  // ✅ FIX 1: Set persistence ON APP START (NOT in login)
  useEffect(() => {
    setPersistence(auth, browserLocalPersistence)
      .catch(err => console.error("Persistence error:", err));
  }, []);

  // 🔐 AUTH LISTENER
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
          setAuthLoading(false);
          return;
        }

        const data = snap.data();

        setUser({
          ...u,
          role: data.role || "General",
          name: data.name || u.email || "User"
        });

      } catch (err) {
        console.error("Auth error:", err);
      } finally {
        setAuthLoading(false);
      }
    });

    return () => unsub();
  }, []);

  // 🔄 NEEDS
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "needs"), (snap) => {
      setNeeds(
        snap.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timeAgo: getTimeAgo(doc.data().createdAt)
        }))
      );
    });

    return () => unsub();
  }, []);

  // 🔄 USERS
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

  // 🔄 ACTIVITIES
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

  // ✅ logger
  const logActivity = useCallback(async (action, emailOverride = null) => {
    try {
      await addDoc(collection(db, "activities"), {
        email: emailOverride || user?.email || "System",
        name: user?.name || "System",
        action,
        createdAt: serverTimestamp()
      });
    } catch (err) {
      console.error("Activity log error:", err);
    }
  }, [user]);

  // 🔐 SIGNUP
  const signup = async (email, password, role = "General", name = "") => {
    const res = await createUserWithEmailAndPassword(auth, email, password);

    await setDoc(doc(db, "users", res.user.uid), {
      uid: res.user.uid,
      email,
      name,
      role,
      status: role === "Volunteer" ? "pending" : "approved",
      proofUrl: "",
      createdAt: serverTimestamp()
    });

    return res.user;
  };

  // 🔐 LOGIN
  const login = async (email, password) => {
    // ❌ REMOVED setPersistence from here

    const res = await signInWithEmailAndPassword(auth, email, password);

    await logActivity("🔐 Login", email);

    return res.user;
  };

  // 🔓 LOGOUT
  const logout = async () => {
    await logActivity("🚪 Logout", user?.email);
    await signOut(auth);
  };

  // ➕ NEED
  const addNeed = useCallback(async (need) => {
    try {
      await addDoc(collection(db, "needs"), {
        ...need,
        status: 'Pending',
        createdAt: serverTimestamp(),
        postedBy: {
          name: user?.name || "User",
          uid: user?.uid
        }
      });

      await logActivity("📦 Created a need");
    } catch (err) {
      console.error("Add need error:", err);
    }
  }, [user, logActivity]);

  const updateNeedStatus = useCallback(async (id, status) => {
    try {
      await updateDoc(doc(db, "needs", id), { status });
      await logActivity(`🔄 Updated need to ${status}`);
    } catch (err) {
      console.error("Update need error:", err);
    }
  }, [user, logActivity]);

  const deleteNeed = useCallback(async (id) => {
    try {
      await deleteDoc(doc(db, "needs", id));
      await logActivity("🗑 Deleted a need");
    } catch (err) {
      console.error("Delete need error:", err);
    }
  }, [user, logActivity]);

  // 👤 UPDATE USER
  const updateUser = async (uid, data) => {
    try {
      await updateDoc(doc(db, "users", uid), data);
      await logActivity("✏️ Updated profile");
    } catch (err) {
      console.error("Update user error:", err);
      throw err;
    }
  };

  // 👤 USER ACTIONS
  const approveUser = async (uid) => {
    await updateDoc(doc(db, "users", uid), { status: "approved" });
    await logActivity("✅ Approved a user");
  };

  const blockUser = async (uid) => {
    await updateDoc(doc(db, "users", uid), { status: "blocked" });
    await logActivity("🚫 Blocked a user");
  };

  const unblockUser = async (uid) => {
    await updateDoc(doc(db, "users", uid), { status: "approved" });
    await logActivity("🔓 Unblocked a user");
  };

  const deleteUserAccount = async (uid) => {
    await updateDoc(doc(db, "users", uid), { status: "deleted" });
    await logActivity("❌ Deleted a user");
  };

  return (
    <AppContext.Provider value={{
      theme, setTheme,

      needs: needs || [],
      users: users || [],
      activities: activities || [],

      addNeed,
      updateNeedStatus,
      deleteNeed,

      user,
      authLoading, // ✅ IMPORTANT

      login,
      signup,
      logout,

      updateUser,

      approveUser,
      deleteUserAccount,
      blockUser,
      unblockUser,

      logActivity
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