import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { buildSlackPayload, sendSlackWebhook } from '@/utils/integrations/slack';

describe('Slack integration', () => {
  it('builds a payload with defaults', () => {
    const payload = buildSlackPayload({ text: 'Hello' });
    expect(payload.text).toBe('Hello');
    expect(payload.username).toBe('AppForge');
    expect(payload.icon_emoji).toBe(':satellite:');
  });

  it('sends a webhook payload', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    const originalFetch = global.fetch;
    global.fetch = fetchMock;

    await sendSlackWebhook({
      webhookUrl: 'https://hooks.slack.test/123',
      text: 'Incident resolved',
    });

    expect(fetchMock).toHaveBeenCalled();

    global.fetch = originalFetch;
  });
});
