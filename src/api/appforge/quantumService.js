import client from '../appforgeClient';

const quantumService = {
  async createCircuit(payload) {
    const { data } = await client.post('/quantum/circuits', payload);
    return data;
  },

  async listCircuits() {
    const { data } = await client.get('/quantum/circuits');
    return data;
  },

  async getCircuit(id) {
    const { data } = await client.get(`/quantum/circuits/${id}`);
    return data;
  },

  async updateCircuit(id, payload) {
    const { data } = await client.put(`/quantum/circuits/${id}`, payload);
    return data;
  },

  async deleteCircuit(id) {
    const { data } = await client.delete(`/quantum/circuits/${id}`);
    return data;
  },

  async simulateCircuit(id, payload = {}) {
    const { data } = await client.post(`/quantum/circuits/${id}/simulate`, payload);
    return data;
  },

  async runAlgorithm(payload) {
    const { data } = await client.post('/quantum/algorithms', payload);
    return data;
  },

  async getHistory(id) {
    const { data } = await client.get(`/quantum/circuits/${id}/history`);
    return data;
  },

  async exportCircuit(id, format = 'qasm') {
    const { data } = await client.get(`/quantum/circuits/${id}/export`, {
      params: { format }
    });
    return data;
  }
};

export default quantumService;
