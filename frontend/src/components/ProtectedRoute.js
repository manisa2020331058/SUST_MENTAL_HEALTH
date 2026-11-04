import React from 'react';
import { Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

// Sends visitors to /login unless they hold a valid, unexpired token
// (and the right role, when one is required).
const ProtectedRoute = ({ role, children }) => {
  const token = localStorage.getItem('token');
  const savedRole = localStorage.getItem('role');

  try {
    const { exp } = jwtDecode(token);          // throws if the token is missing or garbled
    if (exp && exp * 1000 < Date.now()) throw new Error('expired');
  } catch {
    localStorage.clear();
    return <Navigate to="/login" replace />;
  }

  if (role && savedRole !== role) return <Navigate to="/login" replace />;
  return children;
};

export default ProtectedRoute;