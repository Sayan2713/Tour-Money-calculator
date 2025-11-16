import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthCOntext';

// Layout & Route Components
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Page Components
import AuthScreen from './components/AuthScreen'; // From src/components/
import HomePage from './pages/HomePage'; // From src/pages/
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import ProfilePage from './pages/ProfilePage';
import ChangePasswordPage from './pages/ChangePasswordPage';

export default function App() {
  const { token } = useAuth();

  return (
    <Routes>
      {/* This route handles the login/signup page.
        - If you have a token (logged in), visiting /auth will redirect you to Home (/).
        - If you don't have a token, it will show the AuthScreen.
      */}
      <Route 
        path="/auth" 
        element={token ? <Navigate to="/" /> : <AuthScreen />} 
      />
      
      {/* These are your protected routes, wrapped by <ProtectedRoute>.
        - If you're not logged in, <ProtectedRoute> will redirect you to /auth.
        - If you are logged in, it will show the <Layout> (NavBar + Footer).
      */}
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          {/* The <Layout> then renders the correct page component inside its <Outlet>.
          */}
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/password" element={<ChangePasswordPage />} />
        </Route>
      </Route>

      {/* This is a "catch-all" route. If a user visits any URL
        that doesn't match the ones above, they will be redirected to Home (/).
      */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}