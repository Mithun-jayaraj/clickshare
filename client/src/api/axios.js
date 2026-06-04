import axios from 'axios';

/**
 * Normalize the base URL:
 *  - Strip trailing slashes
 *  - Append /api if missing
 * This makes the app resilient to env-var mistakes (missing /api, extra slash, etc.)
 */
const raw = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const cleanBase = raw.trim().replace(/\/+$/, '');
const BASE_URL = cleanBase.endsWith('/api') ? cleanBase : `${cleanBase}/api`;

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 20000,
  withCredentials: false, // we use Bearer token, not cookies
});

// ─── Request interceptor: attach JWT ─────────────────────────
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

// ─── Response interceptor: handle 401 ────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('clicksphere_token');
      if (
        !window.location.pathname.includes('/login') &&
        !window.location.pathname.includes('/signup')
      ) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
