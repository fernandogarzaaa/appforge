import axios from 'axios';
import env from '@/utils/env';

// Storage key for auth token
const TOKEN_STORAGE_KEY = 'appforge_auth_token';

const normalizeBaseUrl = (value) => {
  if (!value) return '';
  return value.replace(/\/+$/, '');
};

// Determine the correct API URL based on environment
// Priority: 1. VITE_API_URL env var, 2. Backend config, 3. Runtime detection
let baseURL = normalizeBaseUrl(import.meta.env.VITE_API_URL || env?.backend?.apiUrl);

// If not configured, prefer same-origin in browser
if (!baseURL && typeof window !== 'undefined') {
  baseURL = window.location.origin;
}

const appforgeClient = axios.create({
  baseURL,
  timeout: 15000,
  withCredentials: true, // Include cookies in requests
  headers: {
    'Content-Type': 'application/json'
  }
});

// Token management - store in localStorage for persistence
export const getAuthToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  }
  return null;
};

export const setAuthToken = (token) => {
  if (typeof window !== 'undefined' && token) {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  }
};

export const clearAuthToken = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }
};

appforgeClient.interceptors.request.use((config) => {
  // Avoid duplicate /api/api paths when callers already include /api/*
  if (typeof config.baseURL === 'string' && typeof config.url === 'string') {
    const trimmedBase = config.baseURL.replace(/\/+$/, '');
    if (trimmedBase.endsWith('/api') && config.url.startsWith('/api/')) {
      config.url = config.url.replace(/^\/api/, '');
    }
  }

  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

appforgeClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      clearAuthToken();
      
      // Show toast notification for better UX
      if (typeof window !== 'undefined' && window.__showAuthError) {
        window.__showAuthError('Session expired. Please login again.');
      }
      
      // Optionally redirect to login
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login';
      }
    }
    
    // Log other errors for debugging
    if (error.response) {
      console.error('API Error:', {
        status: error.response.status,
        message: error.response.data?.message || error.message,
        endpoint: error.config?.url
      });
    }
    
    return Promise.reject(error);
  }
);

export default appforgeClient;
