import client from '../appforgeClient';

const securityService = {
  async encrypt(payload) {
    const { data } = await client.post('/security/encrypt', payload);
    return data;
  },

  async decrypt(payload) {
    const { data } = await client.post('/security/decrypt', payload);
    return data;
  },

  async anonymize(payload) {
    const { data } = await client.post('/security/anonymize', payload);
    return data;
  },

  async createRule(payload) {
    const { data } = await client.post('/security/rules', payload);
    return data;
  },

  async listRules() {
    const { data } = await client.get('/security/rules');
    return data;
  },

  async recordConsent(payload) {
    const { data } = await client.post('/security/consent', payload);
    return data;
  },

  async getConsentStatus() {
    const { data } = await client.get('/security/consent');
    return data;
  },

  async generatePrivacyPolicy(payload) {
    const { data } = await client.post('/security/privacy-policy', payload);
    return data;
  },

  async submitGdprRequest(payload) {
    const { data } = await client.post('/security/gdpr/request', payload);
    return data;
  },

  async getGdprStatus(requestId) {
    const { data } = await client.get(`/security/gdpr/${requestId}`);
    return data;
  },

  async complianceReport() {
    const { data } = await client.get('/security/compliance');
    return data;
  }
};

export default securityService;
