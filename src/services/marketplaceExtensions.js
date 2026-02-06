import { base44 } from '@/api/base44Client';

export const MarketplaceExtensionsService = {
  async listPlugins() {
    return base44.entities.Plugin.list('-created_date', 200);
  },

  async addPlugin(name, category) {
    return base44.entities.Plugin.create({
      name,
      category,
      status: 'published',
      source: 'extensions',
      created_at: new Date().toISOString()
    });
  },
};
