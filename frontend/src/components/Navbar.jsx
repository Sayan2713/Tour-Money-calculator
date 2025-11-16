import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

// ##################################################################
// #  NAVBAR COMPONENT
// ##################################################################
const NavBar = ({ onLogout }) => {
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate(); // Hook to programmatically navigate

  // Function to smoothly scroll to a section on the 'home' page
  const scrollTo = (id) => {
    // First, ensure we are on the 'home' page
    navigate('/');
    
    // We use setTimeout to ensure the DOM has updated (if switching pages)
    // before we try to find the element to scroll to.
    setTimeout(() => {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 50); // A small delay is usually enough
    
    setMobileMenuOpen(false); // Close mobile menu after click
    setProfileOpen(false); // Close profile menu
  };
  
  // This function is for page links in the profile dropdown
  const handleProfileLink = (path) => {
    navigate(path);
    setProfileOpen(false);
  };

  // --- Menu Links ---
  // We separate scroll links (on the home page) from page links (new pages)
  const scrollLinks = [
    { name: 'Trip Setup', id: 'section-1-trip' },
    { name: 'Participants', id: 'section-2-participants' },
    { name: 'Expense Entry', id: 'section-3-expense-entry' },
    { name: 'Settlement', id: 'section-4-summary' },
    { name: 'Expense Log', id: 'section-5-expense-log' },
  ];
  
  const pageLinks = [
    { name: 'About Us', path: '/about' },
    { name: 'Contact Us', path: '/contact' },
  ];

  return (
    <nav className="bg-white shadow-md sticky top-0 z-40 w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo / Brand - Use <Link> */}
          <div className="flex-shrink-0 flex items-center">
            <Link to="/" className="text-2xl font-bold text-blue-600 cursor-pointer" onClick={() => setMobileMenuOpen(false)}>
              TripSplit
            </Link>
          </div>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            {scrollLinks.map(item => (
              <button key={item.id} onClick={() => scrollTo(item.id)} className="text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                {item.name}
              </button>
            ))}
            {pageLinks.map(item => (
              <Link key={item.path} to={item.path} className="text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                {item.name}
              </Link>
            ))}
          </div>

          {/* Profile & Mobile Menu Button */}
          <div className="flex items-center">
            {/* Profile Dropdown */}
            <div className="relative ml-3">
              <div>
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  onBlur={() => setTimeout(() => setProfileOpen(false), 200)} // Close on blur
                  className="bg-gray-200 flex text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <span className="sr-only">Open user menu</span>
                  {/* Simple Profile Icon */}
                  <svg className="h-8 w-8 text-gray-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"></path></svg>
                </button>
              </div>
              {/* Dropdown Menu - Use <Link> or onClick */}
              {profileOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5">
                  <Link to="/profile" onClick={() => setProfileOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Your Profile</Link>
                  <Link to="/password" onClick={() => setProfileOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Change Password</Link>
                  <a href="#" onClick={(e) => { e.preventDefault(); onLogout(); setProfileOpen(false); }} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Logout</a>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="ml-2 -mr-2 flex items-center md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              >
                <span className="sr-only">Open main menu</span>
                {/* Icon for menu (hamburger) */}
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {scrollLinks.map(item => (
              <button key={item.id} onClick={() => scrollTo(item.id)} className="text-gray-700 hover:bg-gray-50 w-full text-left block px-3 py-2 rounded-md text-base font-medium">
                {item.name}
              </button>
            ))}
            {pageLinks.map(item => (
              <Link key={item.path} to={item.path} onClick={() => setMobileMenuOpen(false)} className="text-gray-700 hover:bg-gray-50 w-full text-left block px-3 py-2 rounded-md text-base font-medium">
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
};

export default NavBar;