import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';

const { appId, token, functionsVersion, appBaseUrl } = appParams;
export const hasServiceToken = false; // Never expose service token on client

//Create a client with authentication required
export const base44 = createClient({
  appId,
  token,
  functionsVersion,
  serverUrl: '',
  requiresAuth: false,
  appBaseUrl
});

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
