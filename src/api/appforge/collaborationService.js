import client from '../appforgeClient';

const collaborationService = {
  async createDocument(payload) {
    const { data } = await client.post('/collaboration/documents', payload);
    return data;
  },

  async listDocuments(params = {}) {
    const { data } = await client.get('/collaboration/documents', { params });
    return data;
  },

  async getDocument(id) {
    const { data } = await client.get(`/collaboration/documents/${id}`);
    return data;
  },

  async updateDocument(id, payload) {
    const { data } = await client.put(`/collaboration/documents/${id}`, payload);
    return data;
  },

  async deleteDocument(id) {
    const { data } = await client.delete(`/collaboration/documents/${id}`);
    return data;
  },

  async addCollaborator(id, payload) {
    const { data } = await client.post(`/collaboration/documents/${id}/collaborators`, payload);
    return data;
  },

  async removeCollaborator(id, collaboratorId) {
    const { data } = await client.delete(`/collaboration/documents/${id}/collaborators/${collaboratorId}`);
    return data;
  },

  async listCollaborators(id) {
    const { data } = await client.get(`/collaboration/documents/${id}/collaborators`);
    return data;
  },

  async getHistory(id) {
    const { data } = await client.get(`/collaboration/documents/${id}/history`);
    return data;
  },

  async publish(id) {
    const { data } = await client.post(`/collaboration/documents/${id}/publish`);
    return data;
  },

  async unpublish(id) {
    const { data } = await client.post(`/collaboration/documents/${id}/unpublish`);
    return data;
  }
};

export default collaborationService;
