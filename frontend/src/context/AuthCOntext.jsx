import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const navigate = useNavigate();

  // This effect runs whenever the token changes
  useEffect(() => {
    if (token) {
      // If token exists, set it in localStorage
      localStorage.setItem('token', token);
    } else {
      // If token is null (on logout), remove it from localStorage
      localStorage.removeItem('token');
    }
  }, [token]);

  // Call this function when the user successfully logs in
  const login = (newToken) => {
    setToken(newToken);
    navigate('/'); // Redirect to home page after login
  };

  // Call this function to log the user out
  const logout = () => {
    setToken(null);
    navigate('/auth'); // Redirect to login page after logout
  };

  // Provide the token and functions to all child components
  return (
    <AuthContext.Provider value={{ token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// This is a custom hook to make it easy to use the auth state
// e.g., const { token, login, logout } = useAuth();
export const useAuth = () => {
  return useContext(AuthContext);
};