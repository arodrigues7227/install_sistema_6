import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/auth';
import LoginPage from '../pages/LoginPage';
import TicketsPage from '../pages/TicketsPage';
import TicketDetailPage from '../pages/TicketDetailPage';
import ProfilePage from '../pages/ProfilePage';
import SettingsPage from '../pages/SettingsPage';
import ProtectedRoute from './ProtectedRoute';
import Layout from '../components/Layout';

const Router = ({ themeMode, setTheme }) => {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Layout themeMode={themeMode} setTheme={setTheme}>
      <Routes>
        <Route path="/" element={<Navigate to="/tickets" replace />} />
        <Route
          path="/tickets"
          element={
            <ProtectedRoute>
              <TicketsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tickets/:ticketId"
          element={
            <ProtectedRoute>
              <TicketDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <SettingsPage themeMode={themeMode} setTheme={setTheme} />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/tickets" replace />} />
      </Routes>
    </Layout>
  );
};

export default Router;