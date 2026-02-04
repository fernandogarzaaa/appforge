import client, { setAuthToken, clearAuthToken } from '../appforgeClient';

const authService = {
  async register(payload) {
    const { data: response } = await client.post('/auth/register', payload);
    if (response?.data?.token) {
      setAuthToken(response.data.token);
    }
    // Return the nested data object
    return response.data || response;
  },

  async login(payload) {
    const { data: response } = await client.post('/auth/login', payload);
    if (response?.data?.token) {
      setAuthToken(response.data.token);
    }
    // Return the nested data object with user and token
    return response.data || response;
  },

  async refresh(token) {
    const { data: response } = await client.post('/auth/refresh', { token });
    if (response?.data?.token) {
      setAuthToken(response.data.token);
    }
    return response.data || response;
  },

  async me() {
    const { data: response } = await client.get('/auth/me');
    // Return the data property which contains the user
    return response.data || response;
  },

  async logout() {
    const { data: response } = await client.post('/auth/logout');
    clearAuthToken();
    return response.data || response;
  }
};

export default authService;
