import appforgeClient from '../appforgeClient';

const persistenceService = {
  async getUserState() {
    const { data } = await appforgeClient.get('/persistence/user-state');
    return data.data;
  },

  async saveUserState(payload) {
    const { data } = await appforgeClient.put('/persistence/user-state', payload);
    return data.data;
  },

  async recordAnalyticsEvent(payload) {
    const { data } = await appforgeClient.post('/persistence/analytics', payload);
    return data.data;
  },

  async listAnalyticsEvents(limit = 100) {
    const { data } = await appforgeClient.get('/persistence/analytics', { params: { limit } });
    return data.data;
  },

  async recordSyncLog(payload) {
    const { data } = await appforgeClient.post('/persistence/sync/logs', payload);
    return data.data;
  },

  async listSyncLogs({ entityType, entityId, limit = 100 } = {}) {
    const params = { entityType, entityId, limit };
    const { data } = await appforgeClient.get('/persistence/sync/logs', { params });
    return data.data;
  }
};

export default persistenceService;
