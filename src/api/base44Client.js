import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';

const { appId, token, functionsVersion, appBaseUrl } = appParams;
export const hasServiceToken = false; // Never expose service token on client

//Create a client with authentication required
let client;
try {
  if (!appId) throw new Error('Base44 App ID missing - Sovereign Mode Active');
  client = createClient({
    appId,
    token,
    functionsVersion,
    serverUrl: '',
    requiresAuth: false,
    appBaseUrl
  });
} catch (e) {
  console.warn(`🛡️ [SOVEREIGN GUARD] Base44 Client Init Failed: ${e.message}. Using Sovereign Mock.`);
  // Minimal sovereign mock to prevent UI crash
  client = {
    auth: {
      me: async () => null,
      logout: () => { },
      redirectToLogin: () => { }
    },
    entities: new Proxy({}, {
      get: () => ({
        list: async () => [],
        create: async () => ({}),
        update: async () => ({}),
        delete: async () => ({})
      })
    })
  };
}

export const base44 = client;

// In test environments, silence outbound analytics calls to avoid jsdom network errors
if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'test') {
  const noop = async () => ({ skipped: true });
  if (base44.analytics) {
    base44.analytics.capture = noop;
    base44.analytics.flush = noop;
  }
  if (base44.log) {
    base44.log = () => { };
  }
}
