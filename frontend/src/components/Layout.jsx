import React from 'react';
import { Outlet } from 'react-router-dom';
import NavBar from './NavBar';
import Footer from './Footer';
import { useAuth } from '../context/AuthContext'; // <-- Typo fixed: 'AuthCOntext' -> 'AuthContext'

const Layout = () => {
  const { logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-100 overflow-x-hidden">
      <NavBar onLogout={logout} />
      <main>
        {/* Outlet renders the current route's component (Home, About, etc.) */}
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default Layout;