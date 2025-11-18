import React, { useState, useEffect } from 'react'; // <-- Added useEffect
import { Link, useNavigate } from 'react-router-dom';
import api from '../api'; // <-- Need api to fetch image

const NavBar = ({ onLogout }) => {
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userImage, setUserImage] = useState(null); // <-- Store image
  const navigate = useNavigate();

  // Fetch user image on load
  useEffect(() => {
    api.get('/users')
      .then(res => {
        if (res.data.profilePicture) {
          setUserImage(res.data.profilePicture);
        }
      })
      .catch(err => console.log("Nav load error", err));
  }, []);

  const scrollTo = (id) => {
    navigate('/');
    setTimeout(() => {
      const element = document.getElementById(id);
      if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
    setMobileMenuOpen(false);
    setProfileOpen(false);
  };
  
  // Links
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
          
          {/* Logo */}
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

          {/* Profile & Mobile Button */}
          <div className="flex items-center">
            <div className="relative ml-3">
              <div>
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  // Removed onBlur to prevent closing when clicking dropdown items
                  className="bg-gray-200 flex text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <span className="sr-only">Open user menu</span>
                  {/* --- DYNAMIC IMAGE --- */}
                  {userImage ? (
                    <img className="h-8 w-8 rounded-full object-cover" src={userImage} alt="" />
                  ) : (
                    <svg className="h-8 w-8 text-gray-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"></path></svg>
                  )}
                </button>
              </div>
              
              {profileOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 z-50">
                  <Link to="/profile" onClick={() => setProfileOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Your Profile</Link>
                  <Link to="/password" onClick={() => setProfileOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Change Password</Link>
                  <button onClick={(e) => { e.preventDefault(); onLogout(); setProfileOpen(false); }} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Logout</button>
                </div>
              )}
            </div>

            {/* Mobile Button */}
            <div className="ml-2 -mr-2 flex items-center md:hidden">
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500">
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {scrollLinks.map(item => (
              <button key={item.id} onClick={() => scrollTo(item.id)} className="text-gray-700 hover:bg-gray-50 w-full text-left block px-3 py-2 rounded-md text-base font-medium">{item.name}</button>
            ))}
            {pageLinks.map(item => (
              <Link key={item.path} to={item.path} onClick={() => setMobileMenuOpen(false)} className="text-gray-700 hover:bg-gray-50 w-full text-left block px-3 py-2 rounded-md text-base font-medium">{item.name}</Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
};

export default NavBar;