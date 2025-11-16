import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthCOntext';
import { API_BASE_URL } from '../api';

// ##################################################################
// #  AUTHENTICATION COMPONENT (Login/Signup Screen)
// ##################################################################
const AuthScreen = () => {
  const { login } = useAuth(); // Get login function from context
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
      
      // Call the login function from AuthContext
      // This will set the token and navigate to the home page
      login(token); 
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

export default AuthScreen;