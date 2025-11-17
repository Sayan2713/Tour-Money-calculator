import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../src/context/AuthContext"; // <--- 1. TYPO FIXED

// Layout & Route Components
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";

// Page Components
import AuthScreen from "./components/AuthScreen"; 
import HomePage from "./pages/HomePage"; 
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";
import ProfilePage from "./pages/ProfilePage";
import ChangePasswordPage from "./pages/ChangePasswordPage";
import AcceptInvitePage from "./pages/AcceptInvitePage";

export default function App() {
  const { token } = useAuth();

  return (
    <Routes>
      {/* --- Public Routes --- */}
      
      {/* Login/Signup */}
      <Route
        path="/auth"
        element={token ? <Navigate to="/" /> : <AuthScreen />}
      />

      {/* Accept Invite - This must be BEFORE the catch-all route */}
      <Route path="/accept-invite" element={<AcceptInvitePage />} />


      {/* --- Protected Routes --- */}
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/password" element={<ChangePasswordPage />} />
        </Route>
      </Route>

      {/* --- Catch-All Route (MUST BE LAST) --- */}
      <Route path="*" element={<Navigate to="/" />} />
      
    </Routes>
  );
}