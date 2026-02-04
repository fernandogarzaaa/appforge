import client, { setAuthToken, clearAuthToken } from '../appforgeClient';

const authService = {
  async register(payload) {
    const { data: response } = await client.post('/auth/register', payload);
    
    // API returns: { success, message, data: { user, token }, timestamp }
    // Extract the nested data object
    const result = response.data || response;
    
    if (result?.token) {
      setAuthToken(result.token);
    }
    
    return result;
  },

  async login(payload) {
    const { data: response } = await client.post('/auth/login', payload);
    
    // API returns: { success, message, data: { user, token }, timestamp }
    // Extract the nested data object
    const result = response.data || response;
    
    if (result?.token) {
      setAuthToken(result.token);
    }
    
    return result;
  },

  async refresh(token) {
    const { data: response } = await client.post('/auth/refresh', { token });
    
    // API returns: { success, message, data: { token }, timestamp }
    const result = response.data || response;
    
    if (result?.token) {
      setAuthToken(result.token);
    }
    
    return result;
  },

  async me() {
    const { data: response } = await client.get('/auth/me');
    
    // API returns: { success, message, data: { user }, timestamp }
    // Return the user directly
    const result = response.data || response;
    
    return result?.user || result;
  },

  async logout() {
    try {
      const { data: response } = await client.post('/auth/logout');
      clearAuthToken();
      return response.data || response;
    } catch (error) {
      // Clear token even if request fails
      clearAuthToken();
      throw error;
    }
  }
};

export default authService;
