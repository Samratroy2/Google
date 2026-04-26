import { aiMatchVolunteers } from '../utils/aiEngine';

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

  // ✅ LOG ACTIVITY
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
      available: true,
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

  // 🤖 AUTO ASSIGN (FINAL FIX)
  useEffect(() => {

  if (!needs.length || !users.length) return;

  const runAutoAssign = async () => {

    // 🔒 Track all busy volunteers across needs
    const activeAssigned = new Set();

    needs.forEach(n => {
      if (n.status !== "Completed") {
        (n.assignedTo || []).forEach(v => {
          const uid = typeof v === 'object' ? v.uid : v;
          if (uid) activeAssigned.add(uid);
        });
      }
    });

    for (let need of needs) {

      if (need.status === "Completed") continue;

      const needRef = doc(db, "needs", need.id);
      const snap = await getDoc(needRef);
      if (!snap.exists()) continue;

      const needData = snap.data();

      const required = needData.requiredVolunteers || 1;
      const assignedList = needData.assignedTo || [];
      const assigned = assignedList.length;

      // ✅ stop if already full
      if (assigned >= required) continue;

      const remaining = required - assigned;

      // ✅ only free + not already assigned volunteers
      const freeUsers = users.filter(u => {
        if (u.available === false) return false;

        if (activeAssigned.has(u.uid)) return false;

        const alreadyAssigned = assignedList.some(a =>
          (typeof a === 'object' ? a.uid : a) === u.uid
        );

        return !alreadyAssigned;
      });

      if (!freeUsers.length) continue;

      const matches = aiMatchVolunteers(needData, freeUsers);
      if (!matches.length) continue;

      const finalVols = [];

      for (let v of matches) {

        // 🔁 double safety
        if (activeAssigned.has(v.uid)) continue;

        const alreadyAssigned = assignedList.some(a =>
          (typeof a === 'object' ? a.uid : a) === v.uid
        );
        if (alreadyAssigned) continue;

        finalVols.push(v);

        // 🔒 lock immediately
        activeAssigned.add(v.uid);

        if (finalVols.length >= remaining) break;
      }

      if (!finalVols.length) continue;

      // 🔥 update need (append new volunteers)
      await updateDoc(needRef, {
        status: assigned + finalVols.length >= required ? "Assigned" : "Pending",
        assignedTo: [
          ...assignedList,
          ...finalVols.map(v => ({
            uid: v.uid,
            name: v.name || v.email || "Volunteer"
          }))
        ]
      });

      // 🔒 mark unavailable
      for (let v of finalVols) {
        await updateDoc(doc(db, "users", v.uid), {
          available: false
        });
      }

      await logActivity(`🤖 Assigned ${finalVols.length} volunteers`);
    }
  };

  runAutoAssign();

}, [needs, users, logActivity]);

  // 🔔 NOTIFICATIONS
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

  // 🔐 AUTH STATE
  useEffect(() => {
    setPersistence(auth, browserLocalPersistence);

    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        setUser(null);
        setAuthLoading(false);
        return;
      }

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

      setAuthLoading(false);
    });

    return () => unsub();
  }, []);

  // 🔄 LISTENERS
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

  // ➕ ADD NEED
  const addNeed = useCallback(async (need) => {
    await addDoc(collection(db, "needs"), {
      ...need,
      requiredVolunteers: need.requiredVolunteers || 1,
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
  }, [user, logActivity, addNotification]);

  // ✅ UPDATE STATUS (UNCHANGED)
  const updateNeedStatus = useCallback(async (id, status, ratings = []) => {
    try {

      const needRef = doc(db, "needs", id);
      const snap = await getDoc(needRef);
      if (!snap.exists()) return;

      const needData = snap.data();

      await updateDoc(needRef, { status });

      if (status === "Completed") {

        const volunteers = needData.assignedTo || [];

        for (let v of volunteers) {

          const uid = typeof v === 'object' ? v.uid : v;
          if (!uid) continue;

          const userRef = doc(db, "users", uid);
          const userSnap = await getDoc(userRef);
          if (!userSnap.exists()) continue;

          const data = userSnap.data();
          const ratingObj = ratings.find(r => r.uid === uid);

          if (ratingObj) {
            const total = (data.totalRatings || 0) + 1;

            const avg =
              ((data.rating || 0) * (data.totalRatings || 0) + ratingObj.rating) / total;

            await updateDoc(userRef, {
              available: true,
              tasksCompleted: (data.tasksCompleted || 0) + 1,
              rating: avg,
              totalRatings: total
            });
          } else {
            await updateDoc(userRef, { available: true });
          }
        }
      }

      await logActivity(`🔄 Updated need to ${status}`);

    } catch (err) {
      console.error("Update need error:", err);
    }
  }, [logActivity]);

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