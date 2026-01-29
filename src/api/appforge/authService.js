import client, { setAuthToken, clearAuthToken } from '../appforgeClient';

const authService = {
  async register(payload) {
    const { data } = await client.post('/auth/register', payload);
    if (data?.data?.token) {
      setAuthToken(data.data.token);
    }
    return data;
  },

  async login(payload) {
    const { data } = await client.post('/auth/login', payload);
    if (data?.data?.token) {
      setAuthToken(data.data.token);
    }
    return data;
  },

  async refresh(token) {
    const { data } = await client.post('/auth/refresh', { token });
    if (data?.data?.token) {
      setAuthToken(data.data.token);
    }
    return data;
  },

  async me() {
    const { data } = await client.get('/auth/me');
    return data;
  },

  async logout() {
    const { data } = await client.post('/auth/logout');
    clearAuthToken();
    return data;
  }
};

export default authService;
