/**
 * Authentication Service
 * Handles user authentication with AppForge backend
 */

import appforgeClient, { setAuthToken, clearAuthToken } from '../appforgeClient';

export const authService = {
  /**
   * Register a new user
   */
  async register(userData) {
    try {
      const response = await appforgeClient.post('/auth/register', {
        name: userData.name,
        email: userData.email,
        password: userData.password
      });

      if (response.data.token) {
        if (response.ok) { setAuthToken(response.data.token); } else { console.error('Error setting authentication token:', response); }
      }

      return {
        success: true,
        user: response.data.user,
        token: response.data.token
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Registration failed'
      };
    }
  },

  /**
   * Login user
   */
  async login(email, password) {
    try {
      const response = await appforgeClient.post('/auth/login', {
        email,
        password
      });

      if (response.data.token) {
        setAuthToken(response.data.token);
      }

      return {
        success: true,
        user: response.data.user,
        token: response.data.token
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Login failed'
      };
    }
  },

  /**
   * Logout user
   */
  async logout() {
    try {
      await appforgeClient.post('/auth/logout');
      clearAuthToken();
      return { success: true };
    } catch (error) {
      clearAuthToken(); // Clear token even if API call fails
      return { success: true };
    }
  },

  /**
   * Get current user profile
   */
  async getCurrentUser() {
    try {
      const response = await appforgeClient.get('/auth/me');
      return {
        success: true,
        user: response.data.user
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch user'
      };
    }
  },

  /**
   * Refresh access token
   */
  async refreshToken() {
    try {
      const response = await appforgeClient.post('/auth/refresh');
      
      if (response.data.token) {
        setAuthToken(response.data.token);
      }

      return {
        success: true,
        token: response.data.token
      };
    } catch (error) {
      clearAuthToken();
      return {
        success: false,
        error: 'Token refresh failed'
      };
    }
  },

  /**
   * Update user profile
   */
  async updateProfile(updates) {
    try {
      const response = await appforgeClient.put('/auth/profile', updates);
      return {
        success: true,
        user: response.data.user
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Profile update failed'
      };
    }
  },

  /**
   * Change password
   */
  async changePassword(currentPassword, newPassword) {
    try {
      await appforgeClient.post('/auth/change-password', {
        currentPassword,
        newPassword
      });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Password change failed'
      };
    }
  },

  /**
   * Request password reset
   */
  async requestPasswordReset(email) {
    try {
      await appforgeClient.post('/auth/forgot-password', { email });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Password reset request failed'
      };
    }
  },

  /**
   * Reset password with token
   */
  async resetPassword(token, newPassword) {
    try {
      await appforgeClient.post('/auth/reset-password', {
        token,
        password: newPassword
      });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Password reset failed'
      };
    }
  }
};

export default authService;
