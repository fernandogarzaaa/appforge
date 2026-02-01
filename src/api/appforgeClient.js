import axios from 'axios';
import env from '@/utils/env';

const baseURL = import.meta.env.VITE_API_URL || env?.backend?.apiUrl || 'http://localhost:5000/api';

const appforgeClient = axios.create({
  baseURL,
  timeout: 15000,
  withCredentials: true, // Include cookies in requests
  headers: {
    'Content-Type': 'application/json'
  }
});

// Token management now uses HTTP-only cookies (set by server)
export const getAuthToken = () => {
  // Tokens are in HTTP-only cookies, not accessible to JS
  // Server handles auth via cookie headers
  return null; // Return null since tokens are server-managed
};
export const setAuthToken = (token) => {
  // Deprecated - server sets token in HTTP-only cookie
};
export const clearAuthToken = () => {
  // Deprecated - server clears token on logout
};

appforgeClient.interceptors.request.use((config) => {
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
