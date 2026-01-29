import client from '../appforgeClient';

const userService = {
  async getProfile() {
    const { data } = await client.get('/users/profile');
    return data;
  },

  async updateProfile(payload) {
    const { data } = await client.put('/users/profile', payload);
    return data;
  },

  async createProject(payload) {
    const { data } = await client.post('/users/projects', payload);
    return data;
  },

  async listProjects() {
    const { data } = await client.get('/users/projects');
    return data;
  },

  async getProject(id) {
    const { data } = await client.get(`/users/projects/${id}`);
    return data;
  },

  async updateProject(id, payload) {
    const { data } = await client.put(`/users/projects/${id}`, payload);
    return data;
  },

  async deleteProject(id) {
    const { data } = await client.delete(`/users/projects/${id}`);
    return data;
  },

  async addProjectMember(id, payload) {
    const { data } = await client.post(`/users/projects/${id}/members`, payload);
    return data;
  },

  async removeProjectMember(id, memberId) {
    const { data } = await client.delete(`/users/projects/${id}/members/${memberId}`);
    return data;
  },

  async listProjectMembers(id) {
    const { data } = await client.get(`/users/projects/${id}/members`);
    return data;
  },

  async getProjectStats(id) {
    const { data } = await client.get(`/users/projects/${id}/stats`);
    return data;
  },

  async createTeam(payload) {
    const { data } = await client.post('/users/teams', payload);
    return data;
  },

  async listTeams() {
    const { data } = await client.get('/users/teams');
    return data;
  }
};

export default userService;
