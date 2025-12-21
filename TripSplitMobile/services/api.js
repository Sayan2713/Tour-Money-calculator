import axios from 'axios';

const api = axios.create({
  baseURL: 'https://tripsplit-api.onrender.com',
  timeout: 15000,
});

export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common['x-auth-token'] = token;
  } else {
    delete api.defaults.headers.common['x-auth-token'];
  }
};

export default api;
