import { base44 } from '../base44Client';

/**
 * Auth Service - wraps Base44's authentication
 * Provides a consistent API for components that use authService
 */
const authService = {
  async register() {
    // Base44 handles registration through its login flow
    base44.auth.redirectToLogin(window.location.href);
    return null;
  },

  async login() {
    // Base44 handles login through its own flow
    base44.auth.redirectToLogin(window.location.href);
    return null;
  },

  async refresh() {
    // Base44 handles token refresh automatically
    const user = await base44.auth.me();
    return { user };
  },

  async me() {
    // Get current user from Base44
    try {
      const user = await base44.auth.me();
      return user;
    } catch (error) {
      return null;
    }
  },

  async logout() {
    base44.auth.logout();
    return { success: true };
  }
};

export default authService;
