import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard';
import NeedsPage from './pages/NeedsPage';
import VolunteersPage from './pages/VolunteersPage';
import MapPage from './pages/MapPage';
import ChatbotPage from './pages/ChatbotPage';
import AdminPage from './pages/AdminPage';
import PostNeedPage from './pages/PostNeedPage';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/needs" element={<NeedsPage />} />
        <Route path="/needs/post" element={<PostNeedPage />} />
        <Route path="/volunteers" element={<VolunteersPage />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/chatbot" element={<ChatbotPage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </Layout>
  );
}

export default App;
