import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LoadScript } from '@react-google-maps/api';

import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard';
import NeedsPage from './pages/NeedsPage';
import VolunteersPage from './pages/VolunteersPage';
import MapPage from './pages/MapPage';
import ChatbotPage from './pages/ChatbotPage';
import AdminPage from './pages/AdminPage';
import PostNeedPage from './pages/PostNeedPage';

// ✅ IMPORTANT: keep outside component
const LIBRARIES = ['places'];

function App() {
  return (
    <LoadScript
      googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}
      libraries={LIBRARIES}
    >
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
    </LoadScript>
  );
}

export default App;