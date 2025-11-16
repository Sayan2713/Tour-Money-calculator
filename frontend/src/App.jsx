import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';

// Base URL for our backend
const API_BASE_URL = 'http://localhost:5000';

// --- Axios Global Setup ---
const api = axios.create({
  baseURL: API_BASE_URL,
});

// This is an "interceptor"
// It intercepts every request and adds the auth token if it exists.
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['x-auth-token'] = token;
  }
  return config;
}, error => {
  return Promise.reject(error);
});


// ##################################################################
// #  1. AUTHENTICATION COMPONENT (Login/Signup Screen)
// ##################################################################
const AuthScreen = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const url = isLoginMode ? '/auth/login' : '/auth/signup';
    
    try {
      // We use the normal 'axios' here since the 'api' interceptor
      // won't have a token to send on login/signup.
      const response = await axios.post(`${API_BASE_URL}${url}`, { email, password });
      const { token } = response.data;
      localStorage.setItem('token', token);
      onLoginSuccess(token);
    } catch (err) {
      const msg = err.response?.data?.Error || 'An error occurred. Please try again.';
      setError(msg);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <h2 className="text-3xl font-bold text-center text-blue-600 mb-6">
          TripSplit
        </h2>
        <h3 className="text-xl text-center text-gray-700 mb-8">
          {isLoginMode ? 'Welcome Back!' : 'Create Your Account'}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              minLength={6}
            />
          </div>
          
          {error && (
            <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition duration-200 shadow-sm disabled:opacity-50"
          >
            {loading ? 'Processing...' : (isLoginMode ? 'Login' : 'Sign Up')}
          </button>
        </form>

        <p className="text-center text-gray-600 mt-6">
          {isLoginMode ? "Don't have an account?" : "Already have an account?"}
          <button
            onClick={() => {
              setIsLoginMode(!isLoginMode);
              setError('');
            }}
            className="font-medium text-blue-600 hover:text-blue-500 ml-1"
          >
            {isLoginMode ? 'Sign Up' : 'Login'}
          </button>
        </p>
      </div>
    </div>
  );
};

// ##################################################################
// #  2. NEW: NAVBAR COMPONENT
// ##################################################################
const NavBar = ({ setPage, onLogout }) => {
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Function to smoothly scroll to a section on the 'home' page
  const scrollTo = (id) => {
    // First, ensure we are on the 'home' page
    setPage('home');
    
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
  
  // Function to just switch pages (like About, Contact)
  const switchPage = (pageName) => {
    setPage(pageName);
    setMobileMenuOpen(false);
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
    { name: 'About Us', page: 'about' },
    { name: 'Contact Us', page: 'contact' },
  ];

  return (
    <nav className="bg-white shadow-md sticky top-0 z-40 w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo / Brand */}
          <div className="flex-shrink-0 flex items-center">
            <h1 className="text-2xl font-bold text-blue-600 cursor-pointer" onClick={() => switchPage('home')}>TripSplit</h1>
          </div>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            {scrollLinks.map(item => (
              <button key={item.id} onClick={() => scrollTo(item.id)} className="text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                {item.name}
              </button>
            ))}
            {pageLinks.map(item => (
              <button key={item.page} onClick={() => switchPage(item.page)} className="text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                {item.name}
              </button>
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
              {/* Dropdown Menu */}
              {profileOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5">
                  <a href="#" onClick={(e) => { e.preventDefault(); switchPage('profile'); }} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Your Profile</a>
                  <a href="#" onClick={(e) => { e.preventDefault(); switchPage('password'); }} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Change Password</a>
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
              <button key={item.page} onClick={() => switchPage(item.page)} className="text-gray-700 hover:bg-gray-50 w-full text-left block px-3 py-2 rounded-md text-base font-medium">
                {item.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
};

// ##################################################################
// #  3. NEW: FOOTER COMPONENT
// ##################################################################
const Footer = ({ setPage }) => {
  // Inline SVGs for icons
  const LinkedInIcon = () => (
    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
  );
  const InstagramIcon = () => (
    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.148 3.227-1.669 4.771-4.919 4.919-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-3.252-.148-4.771-1.691-4.919-4.919-.058-1.265-.07-1.646-.07-4.85s.012-3.584.07-4.85c.148-3.227 1.669-4.771 4.919 4.919 1.266-.058 1.646-.07 4.85-.07zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948s.014 3.667.072 4.947c.2 4.358 2.618 6.78 6.98 6.98 1.281.059 1.689.073 4.948.073s3.667-.014 4.947-.072c4.354-.2 6.782-2.618 6.979-6.98.059-1.281.073-1.689.073-4.948s-.014-3.667-.072-4.947c-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.689-.073-4.948-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.162 6.162 6.162 6.162-2.759 6.162-6.162-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.791-4-4s1.791-4 4-4 4 1.791 4 4-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44 1.441-.645 1.441-1.44-.645-1.44-1.441-1.44z"/></svg>
  );
  const MailIcon = () => (
    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M0 3v18h24v-18h-24zm21.518 2l-9.518 7.713-9.518-7.713h19.036zm-19.518 14v-11.817l10 8.107 10-8.107v11.817h-20z"/></svg>
  );

  return (
    <footer className="bg-gray-900 text-gray-400 p-8 mt-16">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Contact Me */}
        <div>
          <h5 className="text-lg font-bold text-white mb-4">Contact Me</h5>
          <div className="flex space-x-4">
            <a href="https://www.linkedin.com/in/sayan2713-mondal/" target="_blank" rel="noopener noreferrer" className="hover:text-white" aria-label="LinkedIn">
              <LinkedInIcon />
            </a>
            <a href="https://www.instagram.com/sayan_2713?igsh=MW9oNnczNG5ncWx0aw==" target="_blank" rel="noopener noreferrer" className="hover:text-white" aria-label="Instagram">
              <InstagramIcon />
            </a>
            <a href="mailto:sayanmondal13072002@gmail.com" className="hover:text-white" aria-label="Gmail">
              <MailIcon />
            </a>
          </div>
          <p className="mt-4 text-sm break-words">sayanmondal13072002@gmail.com</p>
        </div>
        
        {/* About */}
        <div>
          <h5 className="text-lg font-bold text-white mb-4">About This Project</h5>
          <p className="text-sm">This is a full-stack MERN (MongoDB, Express, React, Node.js) application built to simplify group expense tracking.</p>
          <button onClick={() => setPage('about')} className="text-sm mt-2 text-blue-400 hover:text-blue-300">
            Learn more...
          </button>
        </div>

        {/* Copyright & Version */}
        <div>
          <h5 className="text-lg font-bold text-white mb-4">Details</h5>
          <p className="text-sm">V-1.2 (Last Update: 16-11-2025)</p>
          <p className="text-sm mt-4">© 2025 Sayan Mondal. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

// ##################################################################
// #  4. NEW: PLACEHOLDER PAGES
// ##################################################################
const PageContainer = ({ title, children }) => (
  <div className="max-w-7xl mx-auto p-4 sm:p-8">
    <div className="bg-white rounded-lg shadow-md p-8 min-h-[60vh]">
      <h1 className="text-3xl font-bold text-gray-900 mb-6 border-b pb-4">{title}</h1>
      {children}
    </div>
  </div>
);

const AboutPage = () => (
  <PageContainer title="About TripSplit">
    <p className="text-gray-700 text-lg">
      Welcome to TripSplit! This application was created to solve the common problem of tracking and settling group expenses during trips, dinners, or any shared activity.
    </p>
    <p className="mt-4 text-gray-700">
      Our goal is to provide a simple, clean, and powerful tool that handles all the complex calculations for you. Using the MERN stack, this app features real-time database updates and a secure, token-based authentication system.
    </p>
  </PageContainer>
);

const ContactPage = () => (
  <PageContainer title="Contact Us">
    <p className="text-gray-700 text-lg">
      Have questions, feedback, or suggestions?
    </p>
    <p className="mt-4 text-gray-700">
      The best way to reach out is by email or LinkedIn. All contact links can be found in the footer of the page.
    </p>
  </PageContainer>
);

const ProfilePage = () => (
  <PageContainer title="My Profile">
    <p className="text-gray-700 text-lg">
      This page is under construction.
    </p>
    <p className="mt-4 text-gray-700">
      Future features will include updating your email, changing your display name, and viewing your user statistics.
    </p>
  </PageContainer>
);

const ChangePasswordPage = () => (
  <PageContainer title="Change Password">
    <p className="text-gray-700 text-lg">
      This page is under construction.
    </p>
    <p className="mt-4 text-gray-700">
      A form will be added here to allow you to securely change your password.
    </p>
  </PageContainer>
);


// ##################################################################
// #  5. MAIN TRIPSPLIT APP COMPONENT (The App itself)
// ##################################################################
// This component now *only* renders the main app content.
// The NavBar and Footer are handled by the main App wrapper.
const TripSplitApp = ({ onLogout }) => {
  // --- State Variables ---
  const [trips, setTrips] = useState([]);
  const [newTripName, setNewTripName] = useState('');
  const [selectedTrip, setSelectedTrip] = useState(null);
  
  const [participants, setParticipants] = useState([]);
  const [newParticipantName, setNewParticipantName] = useState('');
  
  const [expenses, setExpenses] = useState([]);
  const [editingExpenseId, setEditingExpenseId] = useState(null);
  const [editedExpense, setEditedExpense] = useState({});
  
  const [newExpense, setNewExpense] = useState({
    title: '',
    amount: '',
    category: 'Food',
    payer: '',
    sharedBy: []
  });

  const [loadingTrips, setLoadingTrips] = useState(true);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [loadingExpenses, setLoadingExpenses] = useState(false);
  const [error, setError] = useState(null);

  // --- Utility: Alert Helper ---
  const showAlert = (message, type = 'success') => { // Default to success
    setError({ message, type });
    setTimeout(() => setError(null), 3000); // 3 seconds
  };

  // --- Data Fetching Effects ---
  useEffect(() => {
    fetchTrips();
  }, []);

  useEffect(() => {
    if (selectedTrip) {
      fetchParticipants(selectedTrip._id);
      fetchExpenses(selectedTrip._id);
    } else {
      setParticipants([]);
      setExpenses([]);
    }
  }, [selectedTrip]);

  useEffect(() => {
    // Only update sharedBy if we're NOT in editing mode
    if (!editingExpenseId) {
      setNewExpense(prev => ({
        ...prev,
        sharedBy: participants.map(p => p.name) 
      }));
    }
  }, [participants, editingExpenseId]);


  // --- API Functions (Now using 'api' instance) ---
  
  const fetchTrips = () => {
    setLoadingTrips(true);
    api.get('/trips/')
      .then(response => {
        setTrips(response.data);
        setLoadingTrips(false);
        // Select first trip if none is selected
        if (!selectedTrip && response.data.length > 0) {
            setSelectedTrip(response.data[0]);
        }
      })
      .catch(error => {
        showAlert('Error fetching trips.', 'error');
        setLoadingTrips(false);
        if (error.response?.status === 401) onLogout(); // onLogout is in parent
      });
  };

  const fetchParticipants = (tripId) => {
    setLoadingParticipants(true);
    api.get(`/participants/${tripId}`)
      .then(response => {
        setParticipants(response.data);
        setLoadingParticipants(false);
      })
      .catch(error => {
        showAlert('Error fetching participants.', 'warning');
        setLoadingParticipants(false);
      });
  };

  const fetchExpenses = (tripId) => {
    setLoadingExpenses(true);
    api.get(`/expenses/${tripId}`)
      .then(response => {
        setExpenses(response.data);
        setLoadingExpenses(false);
      })
      .catch(error => {
        showAlert('Error fetching expenses.', 'warning');
        setLoadingExpenses(false);
      });
  };

  const handleAddTrip = (e) => {
    e.preventDefault();
    if (!newTripName) return;
    api.post('/trips/add', { name: newTripName })
      .then(res => {
        setNewTripName('');
        fetchTrips(); 
        showAlert('Trip added successfully!', 'success'); // SUCCESS MESSAGE
      })
      .catch(error => {
        const msg = error.response?.data?.Error || 'Could not add trip.';
        showAlert(msg, 'error');
      });
  };

  // --- DELETE FUNCTIONS ---
  const handleDeleteTrip = (tripId) => {
    if (!window.confirm('Are you sure you want to delete this trip and all its data?')) return;
    api.delete(`/trips/delete/${tripId}`)
        .then(() => {
            showAlert('Trip deleted!', 'success');
            setSelectedTrip(null);
            fetchTrips(); 
        })
        .catch(error => showAlert(error.response?.data?.Error || 'Could not delete trip.', 'error'));
  };

  const handleDeleteParticipant = (participantId) => {
    if (!window.confirm('Delete this participant? This may affect existing expenses.')) return;
    api.delete(`/participants/delete/${participantId}`)
        .then(() => {
            showAlert('Participant deleted!', 'success');
            // Re-fetch both participants and expenses, as calculations will change
            fetchParticipants(selectedTrip._id);
            fetchExpenses(selectedTrip._id);
        })
        .catch(error => showAlert(error.response?.data?.Error || 'Could not delete participant.', 'error'));
  };

  const handleDeleteExpense = (expenseId) => {
    if (!window.confirm('Delete this expense?')) return;
    api.delete(`/expenses/delete/${expenseId}`)
        .then(() => {
            showAlert('Expense deleted!', 'success');
            fetchExpenses(selectedTrip._id); // Re-fetch expenses to update calculations
        })
        .catch(error => showAlert(error.response?.data?.Error || 'Could not delete expense.', 'error'));
  };

  // --- ADD FUNCTIONS ---
  const handleAddParticipant = (e) => {
    e.preventDefault();
    if (!newParticipantName || !selectedTrip) return;
    api.post('/participants/add', {
      name: newParticipantName,
      tripId: selectedTrip._id 
    })
      .then(res => {
        setNewParticipantName('');
        fetchParticipants(selectedTrip._id);
        showAlert('Participant added!', 'success'); // SUCCESS MESSAGE
      })
      .catch(error => showAlert(error.response?.data?.Error || 'Could not add participant.', 'error'));
  };

  const handleAddExpense = (e) => {
    e.preventDefault();
    if (!selectedTrip || !newExpense.title || !newExpense.amount || !newExpense.payer || newExpense.sharedBy.length === 0) {
        showAlert('Please fill all expense details.', 'warning');
        return;
    }
    const amount = parseFloat(newExpense.amount);
    if (isNaN(amount) || amount <= 0) {
        showAlert('Amount must be a positive number.', 'warning');
        return;
    }

    api.post('/expenses/add', {
        ...newExpense,
        amount: amount,
        tripId: selectedTrip._id
    })
      .then(res => {
        setNewExpense(prev => ({ // Reset form
            title: '', amount: '', category: 'Food', payer: '', 
            sharedBy: participants.map(p => p.name) 
        }));
        fetchExpenses(selectedTrip._id);
        showAlert('Expense added!', 'success'); // SUCCESS MESSAGE
      })
      .catch(error => showAlert(error.response?.data?.Error || 'Could not add expense.', 'error'));
  };

  // --- EDIT FUNCTIONS ---
  const handleEditExpense = (expense) => {
    setEditingExpenseId(expense._id);
    setEditedExpense({
      ...expense,
      amount: expense.amount.toString(), 
      sharedBy: Array.isArray(expense.sharedBy) ? expense.sharedBy : [expense.sharedBy]
    });
  };

  const handleSaveExpense = () => {
    const amount = parseFloat(editedExpense.amount);
    if (isNaN(amount) || amount <= 0 || !editedExpense.title || !editedExpense.payer || editedExpense.sharedBy.length === 0) {
      showAlert('Invalid data in edited expense.', 'warning');
      return;
    }

    api.put(`/expenses/update/${editingExpenseId}`, {
      ...editedExpense, // Send all fields from the editedExpense state
      amount: amount,
      tripId: selectedTrip._id // Ensure tripId is included
    })
    .then(() => {
      showAlert('Expense updated!', 'success');
      setEditingExpenseId(null);
      setEditedExpense({});
      fetchExpenses(selectedTrip._id); // Re-fetch to update calculations
    })
    .catch(error => showAlert(error.response?.data?.Error || 'Could not update expense.', 'error'));
  };

  const handleEditChange = (field, value) => {
    setEditedExpense(prev => ({ ...prev, [field]: value }));
  };

  const handleEditCheckboxChange = (name) => {
    setEditedExpense(prev => ({
        ...prev,
        sharedBy: prev.sharedBy.includes(name)
            ? prev.sharedBy.filter(n => n !== name)
            : [...prev.sharedBy, name]
    }));
  };
  
  // --- Calculation Logic ---
  const settlement = useMemo(() => {
    // YOUR FIX IS INCLUDED HERE!
    if (participants.length === 0 || expenses.length === 0) {
        return { netPayments: [], totalSpent: 0, totalShare: 0, balances: [] }; 
    }
    const participantNames = participants.map(p => p.name);
    const matrix = {};
    const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);

    participantNames.forEach(p => {
      matrix[p] = {};
      participantNames.forEach(q => { matrix[p][q] = 0; });
    });

    expenses.forEach(e => {
        // Only calculate for participants who still exist
        const validSharers = e.sharedBy.filter(name => participantNames.includes(name));
        if (validSharers.length === 0 || e.amount <= 0) return;
        
        const split = e.amount / validSharers.length;
        
        validSharers.forEach(pName => {
            if (pName !== e.payer && participantNames.includes(e.payer)) {
                matrix[pName][e.payer] += split;
            }
        });
    });
    
    const netPayments = [];
    const checked = new Set();
    participantNames.forEach(p => {
        participantNames.forEach(q => {
            if (p === q || checked.has(`${p}-${q}`) || checked.has(`${q}-${p}`)) return;
            const pOwesQ = matrix[p][q];
            const qOwesP = matrix[q][p];
            const netAmount = pOwesQ - qOwesP;
            if (netAmount > 0.01) { 
                netPayments.push({ from: p, to: q, amount: netAmount });
            } else if (netAmount < -0.01) { 
                netPayments.push({ from: q, to: p, amount: -netAmount });
            }
            checked.add(`${p}-${q}`);
        });
    });

    const balances = participantNames.map(pName => {
        const paid = expenses.filter(e => e.payer === pName).reduce((sum, e) => sum + e.amount, 0);
        let share = 0;
        expenses.forEach(e => {
            const validSharers = e.sharedBy.filter(name => participantNames.includes(name));
            if (validSharers.includes(pName) && validSharers.length > 0) {
                share += e.amount / validSharers.length;
            }
        });
        const net = paid - share;
        return { name: pName, paid, share, net: net };
    });

    return { netPayments, totalSpent, balances };
  }, [expenses, participants]);

  // --- Render Functions ---
  const renderAlert = () => {
    if (!error) return null;
    const isSuccess = error.type === 'success';
    // Positioned to appear below the sticky navbar
    return (
      <div className={`fixed top-20 right-4 z-50 p-4 rounded-lg shadow-lg text-white font-semibold ${isSuccess ? 'bg-green-500' : 'bg-red-500'}`}>
        {error.message}
      </div>
    );
  };
  
  const renderParticipantCheckboxes = (sharedByArray, handleChangeFunc) => {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-4 border rounded-lg bg-gray-50 max-h-32 overflow-y-auto">
            {participants.length === 0 && <span className="text-gray-500 italic">Add participants first.</span>}
            {participants.map(p => (
                <label key={p._id} className="flex items-center space-x-2 text-gray-700 cursor-pointer">
                    <input type="checkbox" checked={sharedByArray.includes(p.name)} onChange={() => handleChangeFunc(p.name)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    <span>{p.name}</span>
                </label>
            ))}
        </div>
    );
  }

  const renderSelect = (value, onChangeFunc, options, placeholder) => (
    <select value={value} onChange={onChangeFunc}
      className="p-2 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-full">
      <option value="">{placeholder}</option>
      {options.map(opt => ( <option key={opt} value={opt}>{opt}</option> ))}
    </select>
  );

  const ExpenseRow = ({ expense }) => {
    const isEditing = editingExpenseId === expense._id;
    if (isEditing) {
        return (
            <tr className="bg-yellow-50">
                <td className="px-4 py-3"><input type="text" value={editedExpense.title || ''} onChange={(e) => handleEditChange('title', e.target.value)} className="w-full p-1 border rounded" /></td>
                <td className="px-4 py-3"><input type="number" value={editedExpense.amount || ''} onChange={(e) => handleEditChange('amount', e.target.value)} className="w-full p-1 border rounded text-right" /></td>
                <td className="px-4 py-3">
                    {renderSelect(editedExpense.payer, (e) => handleEditChange('payer', e.target.value), participants.map(p => p.name), '-- Payer --')}
                </td>
                <td className="px-4 py-3 max-w-sm">
                    {renderParticipantCheckboxes(editedExpense.sharedBy, handleEditCheckboxChange)}
                </td>
                <td className="px-4 py-3 flex space-x-2 justify-center">
                    <button onClick={handleSaveExpense} className="text-xs bg-green-500 hover:bg-green-600 text-white p-2 rounded">Save</button>
                    <button onClick={() => setEditingExpenseId(null)} className="text-xs bg-gray-500 hover:bg-gray-600 text-white p-2 rounded">Cancel</button>
                </td>
            </tr>
        );
    }
    return (
        <tr key={expense._id}>
            <td className="px-4 py-3 text-sm font-medium text-gray-900">
                {expense.title}
                <div className="text-xs text-blue-500">{expense.category}</div>
            </td>
            <td className="px-4 py-3 text-sm text-gray-700 font-medium text-right">${expense.amount.toFixed(2)}</td>
            <td className="px-4 py-3 text-sm text-gray-700">{expense.payer}</td>
            <td className="px-4 py-3 text-sm text-gray-700 max-w-xs truncate" title={expense.sharedBy.join(', ')}>{expense.sharedBy.join(', ')}</td>
            <td className="px-4 py-3 flex space-x-2 justify-center">
                <button onClick={() => handleEditExpense(expense)} className="text-xs bg-yellow-500 hover:bg-yellow-600 text-white p-2 rounded">Edit</button>
                <button onClick={() => handleDeleteExpense(expense._id)} className="text-xs bg-red-500 hover:bg-red-600 text-white p-2 rounded">Delete</button>
            </td>
        </tr>
    );
  };

  // --- Main Render ---
  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-8">
      {renderAlert()}
      
      {/* ##################################################################
        #  (A) MOBILE & (B) DESKTOP LAYOUT FIX
        ##################################################################
        
        This layout is now structured for your *new* desktop request,
        while also fixing the mobile stacking order.

        - On mobile (default), it's a single column, so sections
          stack in the correct DOM order: 1, 2, 3, 4, 5.
        - On large screens (lg:), it's a multi-column grid.
      */}
      
      {/* --- Top Row (Desktop): 3 Columns --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* --- Col 1 (Desktop) --- */}
        {/* Contains Trip Setup (1) and Participants (2) */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* 1. Trip Setup */}
          <section id="section-1-trip" className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800 border-b pb-2">1. Trip Setup</h2>
            <form onSubmit={handleAddTrip} className="flex space-x-2 mb-4">
              <input
                type="text"
                value={newTripName}
                onChange={(e) => setNewTripName(e.target.value)}
                placeholder="New trip name"
                className="flex-grow w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition duration-200 shadow-sm"
              >
                Create
              </button>
            </form>
            <h3 className="text-xl font-semibold mb-2 text-gray-700">Select Trip:</h3>
            {loadingTrips ? <p className="text-gray-500">Loading...</p> : (
              <ul className="space-y-2 max-h-48 overflow-y-auto">
                {trips.length === 0 && <p className="text-gray-500 italic">No trips found.</p>}
                {trips.map(trip => (
                  <li
                    key={trip._id}
                    onClick={() => setSelectedTrip(trip)}
                    className={`p-3 rounded-lg flex justify-between items-center cursor-pointer transition ${selectedTrip?._id === trip._id ? 'bg-blue-200 border-blue-500 border-2' : 'bg-gray-50 hover:bg-gray-100'}`}
                  >
                    <span className="font-medium text-lg text-gray-700">{trip.name}</span>
                    {selectedTrip?._id === trip._id && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteTrip(trip._id); }}
                        className="text-xs bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded"
                      >
                        Delete
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
          
          {/* 2. Participants */}
          <section id="section-2-participants" className={`bg-white rounded-lg shadow-md p-6 ${!selectedTrip ? 'opacity-50 pointer-events-none' : ''}`}>
            <h2 className="text-2xl font-semibold mb-4 text-gray-800 border-b pb-2">2. Participants</h2>
            <h3 className="text-xl font-semibold mb-3">Trip: <span className="text-blue-600">{selectedTrip?.name || '---'}</span></h3>
            <form onSubmit={handleAddParticipant} className="flex space-x-2 mb-4">
              <input
                type="text"
                value={newParticipantName}
                onChange={(e) => setNewParticipantName(e.target.value)}
                placeholder="Participant's name"
                className="flex-grow w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button type="submit" className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg transition duration-200 shadow-sm">
                Add
              </button>
            </form>
            <h4 className="text-lg font-semibold mb-2">List:</h4>
            {loadingParticipants ? <p className="text-gray-500">Loading...</p> : (
              <ul className="space-y-2 max-h-48 overflow-y-auto">
                {participants.length === 0 && <p className="text-gray-500 italic">No participants added yet.</p>}
                {participants.map(p => (
                  <li key={p._id} className="p-3 bg-gray-50 rounded-lg flex justify-between items-center">
                    <span className="font-medium text-gray-700">{p.name}</span>
                    <button onClick={() => handleDeleteParticipant(p._id)} className="text-xs bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded">
                      Delete
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* --- Col 2 (Desktop) --- */}
        {/* Contains Expense Entry (3) */}
        <div className="lg:col-span-1 space-y-6">
          {/* 3. Expense Entry */}
          <section id="section-3-expense-entry" className={`bg-white rounded-lg shadow-md p-6 ${!selectedTrip ? 'opacity-50 pointer-events-none' : ''}`}>
            <h2 className="text-2xl font-semibold mb-4 text-gray-800 border-b pb-2">3. Expense Entry</h2>
            <h3 className="text-xl font-semibold mb-3">Trip: <span className="text-blue-600">{selectedTrip?.name || '---'}</span></h3>
            <form onSubmit={handleAddExpense} className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <input type="text" placeholder="Expense Title" value={newExpense.title}
                  onChange={(e) => setNewExpense(prev => ({ ...prev, title: e.target.value }))}
                  className="p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <input type="number" placeholder="Amount ($)" value={newExpense.amount}
                  onChange={(e) => setNewExpense(prev => ({ ...prev, amount: e.target.value }))}
                  className="p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <select value={newExpense.category} onChange={(e) => setNewExpense(prev => ({ ...prev, category: e.target.value }))}
                  className="p-3 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>Food</option>
                  <option>Transport</option>
                  <option>Lodging</option>
                  <option>Misc</option>
                  <option>Other</option>
                </select>
                <select value={newExpense.payer} onChange={(e) => setNewExpense(prev => ({ ...prev, payer: e.target.value }))}
                  className="p-3 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">-- Paid By --</option>
                  {participants.map(p => <option key={p._id} value={p.name}>{p.name}</option>)}
                </select>
              </div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Split Evenly Among:</label>
              {renderParticipantCheckboxes(newExpense.sharedBy, (name) => setNewExpense(prev => ({
                  ...prev,
                  sharedBy: prev.sharedBy.includes(name)
                      ? prev.sharedBy.filter(n => n !== name)
                      : [...prev.sharedBy, name]
              })))}
              <button type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg transition duration-200 shadow-sm">
                Add Expense & Calculate
              </button>
            </form>
          </section>
        </div>

        {/* --- Col 3 (Desktop) --- */}
        {/* Contains Settlement Summary (4) */}
        <div className="lg:col-span-1 space-y-6">
          <section id="section-4-summary" className={`bg-white rounded-lg shadow-md p-6 sticky top-20 ${!selectedTrip ? 'opacity-50' : ''}`}> {/* sticky top-20 to offset navbar */}
            <h2 className="text-2xl font-semibold mb-4 text-gray-800 border-b pb-2">4. Settlement Summary</h2>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <p className="text-lg font-medium text-gray-600">Total Spent</p>
                <p className="text-3xl font-bold text-blue-800">${settlement.totalSpent.toFixed(2)}</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg text-center">
                <p className="text-lg font-medium text-gray-600">Avg. Share</p>
                <p className="text-3xl font-bold text-purple-800">
                  ${participants.length > 0 ? (settlement.totalSpent / participants.length).toFixed(2) : '0.00'}
                </p>
              </div>
            </div>
            <h3 className="text-xl font-bold mb-3 text-red-600">Who Pays Whom:</h3>
            <ul className="space-y-3">
              {settlement.netPayments.length === 0 ? (
                <li className="p-3 bg-green-100 text-green-700 rounded-lg font-medium">
                  🎉 Everything is settled!
                </li>
              ) : (
                settlement.netPayments.map((p, i) => (
                  <li key={i} className="p-3 bg-red-100 rounded-lg flex items-center justify-between space-x-3">
                    <span className="font-medium text-gray-800">{p.from}</span>
                    <span className="text-red-600 font-bold text-lg">PAYS</span>
                    <span className="font-medium text-gray-800">{p.to}</span>
                    <span className="font-bold text-red-800 text-lg">${p.amount.toFixed(2)}</span>
                  </li>
                ))
              )}
            </ul>
            <h3 className="text-xl font-bold mt-6 mb-3 text-gray-700">Individual Balances:</h3>
            <div className="overflow-x-auto rounded-lg border">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Paid</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Share</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Net</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {settlement.balances.map(b => (
                    <tr key={b.name}>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{b.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 text-right">${b.paid.toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 text-right">${b.share.toFixed(2)}</td>
                      <td className={`px-4 py-3 text-sm font-bold text-right ${b.net > 0 ? 'text-green-600' : (b.net < 0 ? 'text-red-600' : 'text-gray-500')}`}>
                        ${b.net.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
        
      </div>

      {/* --- Bottom Row (Full Width) --- */}
      {/* Contains Expense Log (5) */}
      <div className="mt-6">
        <section id="section-5-expense-log" className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800 border-b pb-2">5. Expense Log</h2>
          {loadingExpenses ? <p className="text-gray-500">Loading...</p> : (
            <div className="overflow-x-auto rounded-lg border">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payer</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shared By</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {expenses.length === 0 && (
                    <tr><td colSpan="5" className="px-4 py-4 text-center text-gray-500 italic">No expenses recorded.</td></tr>
                  )}
                  {expenses.map(e => ( <ExpenseRow key={e._id} expense={e} /> ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

    </div>
  );
};


// ##################################################################
// #  6. MAIN APP (Wrapper) - Decides to show Login or App
// ##################################################################
export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [page, setPage] = useState('home'); // NEW: Page routing state

  // This effect runs when the token state changes
  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
      setPage('home'); // Reset to home on logout
    }
  }, [token]);

  const handleLoginSuccess = (newToken) => {
    setToken(newToken);
    setPage('home'); // Go to home page on login
  };

  const handleLogout = () => {
    setToken(null); // This will trigger the useEffect and clear local storage
  };

  // If there is no token, show the Login/Signup screen
  if (!token) {
    return <AuthScreen onLoginSuccess={handleLoginSuccess} />;
  }

  // If there *is* a token, show the main application
  // We wrap the app in the Navbar and Footer
  return (
    // We add overflow-x-hidden to the main container to prevent horizontal scroll
    <div className="min-h-screen bg-gray-100 overflow-x-hidden">
      <NavBar onLogout={handleLogout} setPage={setPage} />
      
      <main>
        {/* Render the main app or other pages based on state */}
        {page === 'home' && <TripSplitApp onLogout={handleLogout} />}
        {page === 'about' && <AboutPage />}
        {page === 'contact' && <ContactPage />}
        {page === 'profile' && <ProfilePage />}
        {page === 'password' && <ChangePasswordPage />}
      </main>

      <Footer setPage={setPage} />
    </div>
  );
}