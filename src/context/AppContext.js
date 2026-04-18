import React, { createContext, useContext, useState, useCallback } from 'react';
import { INITIAL_NEEDS, INITIAL_VOLUNTEERS } from '../data/mockData';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [theme, setTheme]             = useState('dark');
  const [needs, setNeeds]             = useState(INITIAL_NEEDS);
  const [volunteers, setVolunteers]   = useState(INITIAL_VOLUNTEERS);
  const [notifications, setNotifications] = useState([
    { id: 1, text: '🔔 New need posted in Sector 4', time: '2m ago', read: false },
    { id: 2, text: '✅ Volunteer matched for Medical need', time: '10m ago', read: false },
    { id: 3, text: '🤖 AI prediction: Food demand rising in Zone 3', time: '1h ago', read: true },
  ]);

  const toggleTheme = () => {
    setTheme(t => {
      const next = t === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      return next;
    });
  };

  const addNeed = useCallback((need) => {
    setNeeds(prev => [{ ...need, id: Date.now(), status: 'Pending', timeAgo: 'Just now', createdAt: new Date().toISOString() }, ...prev]);
    setNotifications(prev => [{ id: Date.now(), text: `🔔 New need posted: ${need.title}`, time: 'Just now', read: false }, ...prev]);
  }, []);

  const updateNeedStatus = useCallback((id, status) => {
    setNeeds(prev => prev.map(n => n.id === id ? { ...n, status } : n));
  }, []);

  const deleteNeed = useCallback((id) => {
    setNeeds(prev => prev.filter(n => n.id !== id));
  }, []);

  const addVolunteer = useCallback((volunteer) => {
    setVolunteers(prev => [{ ...volunteer, id: Date.now(), tasksCompleted: 0, rating: 5.0, joinedDate: new Date().toISOString().split('T')[0] }, ...prev]);
    setNotifications(prev => [{ id: Date.now(), text: `🙋 New volunteer registered: ${volunteer.name}`, time: 'Just now', read: false }, ...prev]);
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
