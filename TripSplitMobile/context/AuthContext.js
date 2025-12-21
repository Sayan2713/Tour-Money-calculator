import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import api from '../../services/api';


const API_BASE_URL = api.defaults.baseURL || 'http://localhost:5000';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  /* ---------------------------------- */
  /* Load token on app start             */
  /* ---------------------------------- */
  useEffect(() => {
    const bootstrapAuth = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('authToken');
        if (storedToken) {
          setToken(storedToken);
          await fetchUser(storedToken);
        }
      } catch (err) {
        console.log('Auth bootstrap error', err);
      } finally {
        setLoading(false);
      }
    };
    bootstrapAuth();
  }, []);

  /* ---------------------------------- */
  /* Fetch logged-in user                */
  /* ---------------------------------- */
  const fetchUser = async (authToken) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/users`, {
        headers: { 'x-auth-token': authToken },
      });
      setUser(res.data);
    } catch (err) {
      console.log('Fetch user failed', err);
      logout();
    }
  };

  /* ---------------------------------- */
  /* Login                              */
  /* ---------------------------------- */
  const login = async (email, password) => {
    const res = await axios.post(`${API_BASE_URL}/auth/login`, {
      email,
      password,
    });

    if (res.data?.token) {
      await AsyncStorage.setItem('authToken', res.data.token);
      setToken(res.data.token);
      await fetchUser(res.data.token);
    }
  };

  /* ---------------------------------- */
  /* Signup (OTP handled outside)        */
  /* ---------------------------------- */
  const signup = async (payload) => {
    return axios.post(`${API_BASE_URL}/auth/signup`, payload);
  };

  /* ---------------------------------- */
  /* Verify signup OTP                  */
  /* ---------------------------------- */
  const verifySignup = async (email, otp) => {
    const res = await axios.post(`${API_BASE_URL}/auth/signup-verify`, {
      email,
      otp,
    });

    if (res.data?.token) {
      await AsyncStorage.setItem('authToken', res.data.token);
      setToken(res.data.token);
      await fetchUser(res.data.token);
    }
  };

  /* ---------------------------------- */
  /* Logout                             */
  /* ---------------------------------- */
  const logout = async () => {
    await AsyncStorage.removeItem('authToken');
    setToken(null);
    setUser(null);
  };

  /* ---------------------------------- */
  /* Context value                      */
  /* ---------------------------------- */
  const value = {
    token,
    user,
    loading,
    isAuthenticated: !!token,
    login,
    signup,
    verifySignup,
    logout,
    refreshUser: () => fetchUser(token),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/* ---------------------------------- */
/* Hook                                */
/* ---------------------------------- */
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
};
