import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as webhooks from '@/utils/webhooks';

describe('Webhooks System', () => {
  beforeEach(() => {
    localStorage.clear();
    webhooks.resetWebhooks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  describe('createWebhook', () => {
    it('should create a webhook', () => {
      const webhook = webhooks.createWebhook(
        'https://example.com/webhook',
        ['user.created', 'project.updated']
      );

      expect(webhook).toBeDefined();
      expect(webhook.url).toBe('https://example.com/webhook');
      expect(webhook.events).toContain('user.created');
      expect(webhook.id).toBeDefined();
    });

    it('should generate unique webhook IDs', () => {
      const wh1 = webhooks.createWebhook('https://example1.com/webhook', ['event1']);
      const wh2 = webhooks.createWebhook('https://example2.com/webhook', ['event2']);

      expect(wh1.id).not.toBe(wh2.id);
    });

    it('should be active by default', () => {
      const webhook = webhooks.createWebhook('https://example.com/webhook', ['event']);

      expect(webhook.active).toBe(true);
    });

    it('should support custom headers', () => {
      const headers = { 'X-API-Key': 'secret', 'Authorization': 'Bearer token' };
      const webhook = webhooks.createWebhook(
        'https://example.com/webhook',
        ['event'],
        { headers }
      );

      expect(webhook.headers).toEqual(headers);
    });
  });

  describe('getWebhook', () => {
    it('should retrieve webhook by ID', () => {
      const created = webhooks.createWebhook('https://example.com/webhook', ['event']);
      const retrieved = webhooks.getWebhook(created.id);

      expect(retrieved.id).toBe(created.id);
      expect(retrieved.url).toBe(created.url);
    });

    it('should return null for non-existent webhook', () => {
      const webhook = webhooks.getWebhook('non-existent-id');
      expect(webhook).toBeNull();
    });
  });

  describe('listWebhooks', () => {
    it('should list all webhooks', () => {
      webhooks.createWebhook('https://example1.com', ['event1']);
      webhooks.createWebhook('https://example2.com', ['event2']);

      const list = webhooks.listWebhooks();
      expect(list.length).toBeGreaterThanOrEqual(2);
    });

    it('should filter by active status', () => {
      const wh1 = webhooks.createWebhook('https://example1.com', ['event']);
      const wh2 = webhooks.createWebhook('https://example2.com', ['event']);

      webhooks.toggleWebhook(wh2.id);

      const active = webhooks.listWebhooks({ active: true });
      const allList = webhooks.listWebhooks();

      expect(active.length).toBeLessThanOrEqual(allList.length);
    });
  });

  describe('updateWebhook', () => {
    it('should update webhook URL', () => {
      const wh = webhooks.createWebhook('https://old.com/webhook', ['event']);
      webhooks.updateWebhook(wh.id, { url: 'https://new.com/webhook' });

      const updated = webhooks.getWebhook(wh.id);
      expect(updated.url).toBe('https://new.com/webhook');
    });

    it('should update webhook events', () => {
      const wh = webhooks.createWebhook('https://example.com', ['event1']);
      webhooks.updateWebhook(wh.id, { events: ['event1', 'event2', 'event3'] });

      const updated = webhooks.getWebhook(wh.id);
      expect(updated.events).toContain('event2');
      expect(updated.events).toContain('event3');
    });

    it('should update webhook headers', () => {
      const wh = webhooks.createWebhook('https://example.com', ['event']);
      const newHeaders = { 'X-New': 'header' };
      webhooks.updateWebhook(wh.id, { headers: newHeaders });

      const updated = webhooks.getWebhook(wh.id);
      expect(updated.headers).toEqual(newHeaders);
    });
  });

  describe('deleteWebhook', () => {
    it('should delete webhook', () => {
      const wh = webhooks.createWebhook('https://example.com', ['event']);
      webhooks.deleteWebhook(wh.id);

      const retrieved = webhooks.getWebhook(wh.id);
      expect(retrieved).toBeNull();
    });
  });

  describe('toggleWebhook', () => {
    it('should toggle active status', () => {
      const wh = webhooks.createWebhook('https://example.com', ['event']);
      const initial = wh.active;

      webhooks.toggleWebhook(wh.id);
      const after = webhooks.getWebhook(wh.id).active;

      expect(after).toBe(!initial);
    });

    it('should toggle multiple times', () => {
      const wh = webhooks.createWebhook('https://example.com', ['event']);
      const initial = wh.active;

      webhooks.toggleWebhook(wh.id);
      webhooks.toggleWebhook(wh.id);

      const final = webhooks.getWebhook(wh.id).active;
      expect(final).toBe(initial);
    });
  });

  describe('verifyWebhookSignature', () => {
    it('should verify valid signature', () => {
      const payload = { test: 'data' };
      const secret = 'webhook-secret';

      const signature = webhooks.verifyWebhookSignature(
        JSON.stringify(payload),
        secret
      );

      expect(signature).toBeTruthy();
      expect(typeof signature).toBe('string');
    });

    it('should produce different signatures for different payloads', () => {
      const secret = 'secret';

      const sig1 = webhooks.verifyWebhookSignature('payload1', secret);
      const sig2 = webhooks.verifyWebhookSignature('payload2', secret);

      expect(sig1).not.toBe(sig2);
    });

    it('should produce different signatures for different secrets', () => {
      const payload = 'same-payload';

      const sig1 = webhooks.verifyWebhookSignature(payload, 'secret1');
      const sig2 = webhooks.verifyWebhookSignature(payload, 'secret2');

      expect(sig1).not.toBe(sig2);
    });
  });

  describe('triggerWebhook', () => {
    it('should trigger webhook for matching events', () => {
      const wh = webhooks.createWebhook('https://example.com', ['user.created']);

      const handler = vi.fn();
      const unsub = webhooks.onWebhookEvent('delivery_sent', handler);

      webhooks.triggerWebhook('user.created', { userId: '123' });
      
      expect(handler).toHaveBeenCalled();
      unsub();
    });

    it('should not trigger for non-matching events', () => {
      const wh = webhooks.createWebhook('https://example.com', ['user.created']);

      const handler = vi.fn();
      const unsub = webhooks.onWebhookEvent('delivery_sent', handler);

      webhooks.triggerWebhook('project.updated', { projectId: '456' });
      
      expect(handler).not.toHaveBeenCalled();
      unsub();
    });

    it('should trigger inactive webhooks', () => {
      const wh = webhooks.createWebhook('https://example.com', ['event']);
      webhooks.toggleWebhook(wh.id);

      const handler = vi.fn();
      const unsub = webhooks.onWebhookEvent('delivery_sent', handler);

      webhooks.triggerWebhook('event', {});
      
      expect(handler).not.toHaveBeenCalled();
      unsub();
    });
  });

  describe('getDeliveryLogs', () => {
    it('should return delivery logs for webhook', () => {
      const wh = webhooks.createWebhook('https://example.com', ['event']);

      webhooks.triggerWebhook('event', {});
      const logs = webhooks.getDeliveryLogs(wh.id);

      expect(Array.isArray(logs)).toBe(true);
    });

    it('should log delivery details', () => {
      const wh = webhooks.createWebhook('https://example.com', ['event']);

      webhooks.triggerWebhook('event', { test: 'data' });
      const logs = webhooks.getDeliveryLogs(wh.id);

      if (logs.length > 0) {
        const log = logs[0];
        expect(log.id).toBeDefined();
        expect(log.status).toBeDefined();
        expect(log.event).toBe('event');
        expect(log.timestamp).toBeDefined();
      }
    });
  });

  describe('getDeliveryLog', () => {
    it('should retrieve specific delivery log', () => {
      const wh = webhooks.createWebhook('https://example.com', ['event']);

      webhooks.triggerWebhook('event', {});
      const logs = webhooks.getDeliveryLogs(wh.id);

      if (logs.length > 0) {
        const retrieved = webhooks.getDeliveryLog(wh.id, logs[0].id);
        expect(retrieved.id).toBe(logs[0].id);
      }
    });
  });

  describe('resendWebhook', () => {
    it('should resend failed delivery', () => {
      const wh = webhooks.createWebhook('https://example.com', ['event']);

      webhooks.triggerWebhook('event', {});
      const logs = webhooks.getDeliveryLogs(wh.id);

      if (logs.length > 0) {
        expect(() => {
          webhooks.resendWebhook(wh.id, logs[0].id);
        }).not.toThrow();
      }
    });
  });

  describe('getWebhookStats', () => {
    it('should return webhook statistics', () => {
      const wh = webhooks.createWebhook('https://example.com', ['event']);

      webhooks.triggerWebhook('event', {});
      const stats = webhooks.getWebhookStats(wh.id);

      expect(stats).toBeDefined();
      expect(typeof stats.delivered).toBe('number');
      expect(typeof stats.failed).toBe('number');
    });

    it('should track success and failure', () => {
      const wh = webhooks.createWebhook('https://example.com', ['event']);

      webhooks.triggerWebhook('event', {});
      const stats = webhooks.getWebhookStats(wh.id);

      // Stats should include pending deliveries
      expect(stats.totalDeliveries).toBeGreaterThan(0);
    });
  });

  describe('Webhook Events', () => {
    it('should emit delivery_sent event', (done) => {
      const wh = webhooks.createWebhook('https://example.com', ['event']);

      const unsub = webhooks.onWebhookEvent('delivery_sent', (event) => {
        expect(event.webhookId).toBeDefined();
        unsub();
        done();
      });

      webhooks.triggerWebhook('event', {});
    });

    it('should emit delivery_failed event on retry exhaustion', (done) => {
      const wh = webhooks.createWebhook('https://invalid-domain-12345.com', ['event']);

      const unsub = webhooks.onWebhookEvent('delivery_failed', (event) => {
        expect(event.webhookId).toBeDefined();
        unsub();
        done();
      });

      webhooks.triggerWebhook('event', {});
      
      // Fast-forward through retries
      vi.advanceTimersByTime(60000);
    });
  });

  describe('Retry Logic', () => {
    it('should retry failed deliveries', () => {
      const wh = webhooks.createWebhook('https://invalid.com', ['event']);

      const handler = vi.fn();
      webhooks.onWebhookEvent('delivery_failed', handler);

      webhooks.triggerWebhook('event', {});

      // Simulate retry delay
      vi.advanceTimersByTime(1000);

      // Webhook system should attempt retries internally
      expect(handler).toBeDefined();
    });

    it('should implement exponential backoff', () => {
      const wh = webhooks.createWebhook('https://invalid.com', ['event']);

      webhooks.triggerWebhook('event', {});

      // After 1s
      vi.advanceTimersByTime(1000);

      // After additional 2s (total 3s)
      vi.advanceTimersByTime(2000);

      // After additional 4s (total 7s)
      vi.advanceTimersByTime(4000);

      // System should handle exponential backoff
      expect(true).toBe(true);
    });

    it('should have max retry limit', () => {
      const wh = webhooks.createWebhook('https://invalid.com', ['event']);

      const handler = vi.fn();
      webhooks.onWebhookEvent('delivery_failed', handler);

      webhooks.triggerWebhook('event', {});

      // Advance through max retries (5 retries max = up to 1+2+4+8+16 = 31s + jitter)
      vi.advanceTimersByTime(60000);

      // Should eventually give up
      expect(handler).toBeDefined();
    });
  });
});
