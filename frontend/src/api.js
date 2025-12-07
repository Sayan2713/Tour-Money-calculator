import axios from 'axios';

// Base URL for our backend
const API_BASE_URL = 'https://tripsplit-api.onrender.com';
// const API_BASE_URL = 'http://localhost:5000';


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

export default api;

// Export the base URL in case you need it for non-intercepted requests
// (like the AuthScreen which doesn't use the 'api' instance)
export { API_BASE_URL };