import axios from 'axios';

// Sanitize base URL: remove trailing slashes and ensure it ends with '/api'
let rawBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
let cleanBaseUrl = rawBaseUrl.trim().replace(/\/$/, '');
if (!cleanBaseUrl.endsWith('/api')) {
  cleanBaseUrl += '/api';
}

const api = axios.create({
  baseURL: cleanBaseUrl,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Request interceptor — attach JWT
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('clicksphere_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('clicksphere_token');
      // Redirect to login if not already there
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/signup')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
