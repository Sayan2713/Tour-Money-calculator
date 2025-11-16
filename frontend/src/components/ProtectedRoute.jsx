import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthCOntext';

const ProtectedRoute = () => {
  const { token } = useAuth();

  // If there's a token, show the nested child routes (the "Outlet").
  // Otherwise, redirect to the /auth page.
  return token ? <Outlet /> : <Navigate to="/auth" replace />;
};

export default ProtectedRoute;