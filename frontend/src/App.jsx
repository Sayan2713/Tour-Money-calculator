import React, { useEffect, useRef } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext"; // Corrected path

// Layout & Route Components
import Layout from "./components/Layout";
import ScrollToTop from './components/ScrollToTop';

import ProtectedRoute from "./components/ProtectedRoute";
import CopyrightPage from './pages/CopyrightPage';
import TermsAndConditionsPage from './pages/TermsAndConditionsPage';
import HowToUsePage from './pages/HowToUsePage';

// Page Components
import AuthScreen from "./components/AuthScreen";
import HomePage from "./pages/HomePage";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";
import ProfilePage from "./pages/ProfilePage";
import ChangePasswordPage from "./pages/ChangePasswordPage";
import AcceptInvitePage from "./pages/AcceptInvitePage";
import ForgotPassword from "./pages/ForgotPassword"; 

export default function App() {
  const { token } = useAuth();

  return (
    <Routes>
      {/* --- Public Routes ( accessible without login ) --- */}

      {/* Login/Signup */}
      <Route
        path="/auth"
        element={token ? <RedirectHandler /> : <AuthScreen />}
      />

      {/* Accept Invite */}
      <Route path="/accept-invite" element={<AcceptInvitePage />} />
      
      {/* Forgot Password - MUST be Public */}
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* --- Protected Routes ( require login ) --- */}
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/profile" element={<ProfilePage />} />

          {/* legal / help pages (must match Footer Link `to` paths) */}
          <Route path="copyright" element={<CopyrightPage />} />
          <Route path="terms" element={<TermsAndConditionsPage />} />
          <Route path="how-to-use" element={<HowToUsePage />} />
          
          {/* Change Password is for logged-in users */}
          <Route path="/password" element={<ChangePasswordPage />} />
          
        </Route>
      </Route>

      {/* --- Catch-All Route --- */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

// ##################################################################
// #  HELPER COMPONENT: RedirectHandler
// #  Fixes the "Strict Mode" double-delete bug
// ##################################################################
function RedirectHandler() {
  // 1. Read the value ONE time and store it in a Reference (doesn't change on re-renders)
  const redirectUrlRef = useRef(localStorage.getItem("postLoginRedirect"));

  // 2. Use useEffect to clean up localStorage AFTER we have decided where to go
  useEffect(() => {
    if (redirectUrlRef.current) {
      localStorage.removeItem("postLoginRedirect");
    }
  }, []);

  // 3. Decide where to navigate based on the Ref value
  if (redirectUrlRef.current) {
    return <Navigate to={redirectUrlRef.current} replace />;
  }

  return <Navigate to="/" replace />;
}