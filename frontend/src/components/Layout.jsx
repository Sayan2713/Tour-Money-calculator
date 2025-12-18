import React from 'react';
import { Outlet } from 'react-router-dom';
import NavBar from './NavBar';
import Footer from './Footer';
import { useAuth } from '../context/AuthContext';
import ScrollToTop from './ScrollToTop'; 

const Layout = () => {
  const { logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-100 overflow-x-hidden">
      <ScrollToTop /> {/*  FIX: resets scroll on route change */}
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
