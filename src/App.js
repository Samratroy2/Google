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
import ProfilePage from './pages/ProfilePage';
import PostNeedPage from './pages/PostNeedPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminVerifyPage from './pages/AdminVerifyPage';

import ProtectedRoute from './components/ProtectedRoute';

const LIBRARIES = ['places'];

function App() {
  return (
    <LoadScript
      googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}
      libraries={LIBRARIES}
    >
      <Routes>

        {/* ✅ PUBLIC ROUTES */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/admin-verify" element={<AdminVerifyPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        
        {/* ✅ PROTECTED APP */}
        <Route path="/*" element={
          <Layout>
            <Routes>

              <Route path="/" element={<Navigate to="/dashboard" />} />

              <Route path="/dashboard" element={
                <ProtectedRoute><Dashboard /></ProtectedRoute>
              } />

              <Route path="/needs" element={
                <ProtectedRoute><NeedsPage /></ProtectedRoute>
              } />

              <Route path="/needs/post" element={
                <ProtectedRoute><PostNeedPage /></ProtectedRoute>
              } />

              <Route path="/volunteers" element={
                <ProtectedRoute><VolunteersPage /></ProtectedRoute>
              } />

              <Route path="/map" element={
                <ProtectedRoute><MapPage /></ProtectedRoute>
              } />

              <Route path="/chatbot" element={<ChatbotPage />} />
              <Route path="/admin" element={<AdminPage />} />

            </Routes>
          </Layout>
        } />

      </Routes>
    </LoadScript>
  );
}

export default App;