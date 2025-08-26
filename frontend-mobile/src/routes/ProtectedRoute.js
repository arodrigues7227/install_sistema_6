import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/auth';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuthStore();

  if (loading) {
    return null; // Layout will handle loading state
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;