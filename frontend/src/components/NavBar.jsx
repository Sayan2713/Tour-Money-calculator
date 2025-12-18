import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import api from "../api";

const NavBar = ({ onLogout }) => {
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userImage, setUserImage] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Fetch user image on load
  useEffect(() => {
    api
      .get("/users")
      .then((res) => {
        if (res.data.profilePicture) {
          setUserImage(res.data.profilePicture);
        }
      })
      .catch((err) => console.log("Nav load error", err));
  }, []);

  useEffect(() => {
    setProfileOpen(false);
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // ✅ FIXED scroll logic (dynamic navbar height)
  const scrollTo = (id) => {
    navigate("/");

    setTimeout(() => {
      const element = document.getElementById(id);
      const navbar = document.querySelector("nav");

      if (element) {
        const navbarHeight = navbar ? navbar.offsetHeight : 0;
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition =
          elementPosition + window.pageYOffset - navbarHeight - 8;

        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth",
        });
      }
    }, 100);

    setMobileMenuOpen(false);
    setProfileOpen(false);
  };

  const switchPage = (path) => {
    navigate(path);
    setMobileMenuOpen(false);
    setProfileOpen(false);
  };

  // Links
  const scrollLinks = [
    { name: "Trip Setup", id: "section-1-trip" },
    { name: "Participants", id: "section-2-participants" },
    { name: "Expense Entry", id: "section-3-expense-entry" },
    { name: "Settlement", id: "section-4-summary" },
    { name: "Expense Log", id: "section-5-expense-log" },
  ];

  const pageLinks = [
    { name: "About Us", path: "/about" },
    { name: "Contact Us", path: "/contact" },
  ];

  return (
    <nav className="bg-white shadow-md sticky top-0 z-40 w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link
              to="/"
              className="text-2xl font-bold text-blue-600 cursor-pointer"
              onClick={() => {
                window.scrollTo(0, 0);
                setMobileMenuOpen(false);
              }}
            >
              TripSplit
            </Link>
          </div>

          {/* ✅ Desktop Menu (NOW lg+) */}
          <div className="hidden lg:flex lg:items-center lg:space-x-4">
            {scrollLinks.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollTo(item.id)}
                className="text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                {item.name}
              </button>
            ))}
            {pageLinks.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Profile & Mobile Button */}
          <div className="flex items-center">
            {/* ✅ Desktop Profile Dropdown (NOW lg+) */}
            <div className="hidden lg:block relative ml-3">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="bg-gray-200 flex text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <span className="sr-only">Open user menu</span>
                {userImage ? (
                  <img
                    className="h-8 w-8 rounded-full object-cover"
                    src={userImage}
                    alt=""
                  />
                ) : (
                  <svg
                    className="h-8 w-8 text-gray-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>

              {profileOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 z-50">
                  <Link
                    to="/profile"
                    onClick={() => setProfileOpen(false)}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Your Profile
                  </Link>
                  <Link
                    to="/password"
                    onClick={() => setProfileOpen(false)}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Change Password
                  </Link>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      onLogout();
                      setProfileOpen(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>

            {/* ✅ Mobile Hamburger (NOW lg-hidden → iPad included) */}
            <div className="ml-2 -mr-2 flex items-center lg:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              >
                <span className="sr-only">Open main menu</span>
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  {mobileMenuOpen ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* --- MOBILE MENU DROPDOWN --- */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-gray-200 bg-white shadow-lg absolute w-full left-0 z-50">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {scrollLinks.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollTo(item.id)}
                className="text-gray-700 hover:bg-gray-50 w-full text-left block px-3 py-2 rounded-md text-base font-medium border-b border-gray-100"
              >
                {item.name}
              </button>
            ))}

            {pageLinks.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className="text-gray-700 hover:bg-gray-50 w-full text-left block px-3 py-2 rounded-md text-base font-medium border-b border-gray-100"
              >
                {item.name}
              </Link>
            ))}

            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center px-3 mb-3">
                {userImage ? (
                  <img
                    className="h-8 w-8 rounded-full object-cover mr-2"
                    src={userImage}
                    alt=""
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-gray-300 mr-2 flex items-center justify-center text-gray-600">
                    <svg
                      className="h-5 w-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                )}
                <span className="font-medium text-gray-800">My Account</span>
              </div>

              <Link
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50"
              >
                Your Profile
              </Link>
              <Link
                to="/password"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50"
              >
                Change Password
              </Link>
              <button
                onClick={() => {
                  onLogout();
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:text-red-800 hover:bg-gray-50"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default NavBar;
