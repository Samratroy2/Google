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
  const [authLoading, setAuthLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);

  const toggleTheme = () => {
    setTheme(prev => prev === "dark" ? "light" : "dark");
  };

  useEffect(() => {
    document.body.setAttribute("data-theme", theme);
  }, [theme]);

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

  // 🔐 AUTH
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

  const login = async (email, password) => {
    const res = await signInWithEmailAndPassword(auth, email, password);
    await logActivity("🔐 Login", email);
    return res.user;
  };

  const logout = async () => {
    await logActivity("🚪 Logout", user?.email);
    await signOut(auth);
  };

  // ➕ NEED
  const addNeed = useCallback(async (need) => {
    try {
      await addDoc(collection(db, "needs"), {
        ...need,
        requiredVolunteers: need.requiredVolunteers || 1, // ✅ ensure exists
        status: 'Pending',
        createdAt: serverTimestamp(),
        postedBy: {
          name: user?.name || "User",
          uid: user?.uid,
          email: user?.email
        }
      });

      addNotification("📢 New need posted");
      await logActivity("📦 Created a need");
    } catch (err) {
      console.error("Add need error:", err);
    }
  }, [user, logActivity, addNotification]);

  const updateNeedStatus = useCallback(async (id, status) => {
    try {
      await updateDoc(doc(db, "needs", id), { status });
      await logActivity(`🔄 Updated need to ${status}`);
    } catch (err) {
      console.error("Update need error:", err);
    }
  }, [logActivity]);

  const deleteNeed = useCallback(async (id) => {
    try {
      await deleteDoc(doc(db, "needs", id));
      await logActivity("🗑 Deleted a need");
    } catch (err) {
      console.error("Delete need error:", err);
    }
  }, [logActivity]);

  // ✅ UPDATED ASSIGN LOGIC (MAIN CHANGE)
  const assignVolunteer = useCallback(async (needId, volunteers) => {
    try {
      const needRef = doc(db, "needs", needId);
      const snap = await getDoc(needRef);
      const needData = snap.data();

      const required = needData.requiredVolunteers || 1;

      // ✅ CORE LOGIC (YOUR REQUIREMENT)
      const assignedVolunteers = volunteers.slice(
        0,
        Math.min(volunteers.length, required)
      );

      await updateDoc(needRef, {
        status: "Assigned",
        assignedTo: assignedVolunteers.map(v => ({
          uid: v.uid,
          name: v.name || v.email || "Volunteer"
        }))
      });

      // mark all assigned as unavailable
      for (let v of assignedVolunteers) {
        await updateDoc(doc(db, "users", v.uid), {
          available: false
        });
      }

      await logActivity(`👷 Assigned ${assignedVolunteers.length} volunteers`);

    } catch (err) {
      console.error("Assign error:", err);
    }
  }, [logActivity]);

  // ✅ COMPLETE
  // ✅ ONLY showing updated part (completeTask FIX)

const completeTask = useCallback(async (need, ratings) => {

  await updateDoc(doc(db, "needs", need.id), {
    status: "Completed"
  });

  for (let r of ratings) {
    const userRef = doc(db, "users", r.uid);
    const snap = await getDoc(userRef);
    const data = snap.data();

    const total = (data.totalRatings || 0) + 1;

    const avg =
      ((data.rating || 0) * (data.totalRatings || 0) + r.rating) / total;

    await updateDoc(userRef, {
      available: true, // ✅ VERY IMPORTANT
      tasksCompleted: (data.tasksCompleted || 0) + 1,
      rating: avg,
      totalRatings: total
    });
  }

  await logActivity("✅ Task completed & volunteers released");

}, [logActivity]);

  // 👤 USER ACTIONS
  const updateUser = async (uid, data) => {
    await updateDoc(doc(db, "users", uid), data);
    await logActivity("✏️ Updated profile");
  };

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
      theme,
      setTheme,
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

      assignVolunteer,
      completeTask,

      user,
      currentUser: user, 
      authLoading,

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

