import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as webhooks from '@/utils/webhooks';

// Mock base44 client
const mockBase44 = vi.hoisted(() => ({
  auth: {
    me: vi.fn().mockResolvedValue({ email: 'test@example.com' }),
  },
  entities: {
    Webhook: {
      create: vi.fn(),
      get: vi.fn(),
      list: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    WebhookDelivery: {
      filter: vi.fn(),
      get: vi.fn(),
    },
  },
  functions: {
    invoke: vi.fn(),
  },
}));

vi.mock('@/api/base44Client', () => ({
  base44: mockBase44,
}));

describe('Webhooks System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    // Default mock implementations
    mockBase44.entities.Webhook.create.mockImplementation(async (data) => ({
      id: 'wh_123',
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    mockBase44.entities.Webhook.get.mockImplementation(async (id) => ({
      id: id || 'wh_123',
      url: 'https://example.com/webhook',
      events: ['user.created'],
      is_active: true,
      headers: {},
      created_at: new Date().toISOString(),
    }));

    mockBase44.entities.Webhook.list.mockResolvedValue([
      { id: 'wh_1', url: 'https://example1.com', is_active: true, events: ['event1'] },
      { id: 'wh_2', url: 'https://example2.com', is_active: false, events: ['event2'] },
    ]);

    mockBase44.entities.Webhook.update.mockImplementation(async (id, data) => ({
      id,
      url: 'https://example.com/webhook',
      ...data,
      updated_at: new Date().toISOString(),
    }));

    mockBase44.entities.Webhook.delete.mockResolvedValue(true);

    mockBase44.functions.invoke.mockResolvedValue({
      success: true,
      delivery: { id: 'del_123', status: 'success' }
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    webhooks.resetWebhooks();
  });

  describe('createWebhook', () => {
    it('should create a webhook', async () => {
      const webhook = await webhooks.createWebhook(
        'https://example.com/webhook',
        ['user.created', 'project.updated']
      );

      expect(webhook).toBeDefined();
      expect(webhook.url).toBe('https://example.com/webhook');
      expect(webhook.events).toContain('user.created');
      expect(webhook.id).toBeDefined();
      expect(mockBase44.entities.Webhook.create).toHaveBeenCalled();
    });

    it('should generate unique webhook IDs via backend', async () => {
      mockBase44.entities.Webhook.create
        .mockResolvedValueOnce({ id: 'wh_1' })
        .mockResolvedValueOnce({ id: 'wh_2' });

      const wh1 = await webhooks.createWebhook('https://example1.com/webhook', ['event1']);
      const wh2 = await webhooks.createWebhook('https://example2.com/webhook', ['event2']);

      expect(wh1.id).not.toBe(wh2.id);
    });

    it('should be active by default', async () => {
      const webhook = await webhooks.createWebhook('https://example.com/webhook', ['event']);
      expect(webhook.is_active).toBe(true);
    });

    it('should support custom headers', async () => {
      const headers = { 'X-API-Key': 'secret', 'Authorization': 'Bearer token' };
      const webhook = await webhooks.createWebhook(
        'https://example.com/webhook',
        ['event'],
        { headers }
      );

      expect(webhook.headers).toEqual(headers);
    });
  });

  describe('getWebhook', () => {
    it('should retrieve webhook by ID', async () => {
      const created = await webhooks.createWebhook('https://example.com/webhook', ['event']);
      const retrieved = await webhooks.getWebhook(created.id);

      expect(retrieved.id).toBe(created.id);
    });
  });

  describe('listWebhooks', () => {
    it('should list all webhooks', async () => {
      const list = await webhooks.listWebhooks();
      expect(list.length).toBeGreaterThanOrEqual(2);
      expect(mockBase44.entities.Webhook.list).toHaveBeenCalled();
    });

    it('should filter by active status', async () => {
      const active = await webhooks.listWebhooks({ active: true });
      // The mock returns 1 active and 1 inactive
      expect(active.length).toBe(1);
      expect(active[0].is_active).toBe(true);
    });
  });

  describe('updateWebhook', () => {
    it('should update webhook URL', async () => {
      const wh = await webhooks.createWebhook('https://old.com/webhook', ['event']);
      const updated = await webhooks.updateWebhook(wh.id, { url: 'https://new.com/webhook' });

      expect(updated.url).toBe('https://new.com/webhook');
      expect(mockBase44.entities.Webhook.update).toHaveBeenCalledWith(wh.id, expect.objectContaining({
        url: 'https://new.com/webhook'
      }));
    });
  });

  describe('deleteWebhook', () => {
    it('should delete webhook', async () => {
      const wh = await webhooks.createWebhook('https://example.com', ['event']);
      await webhooks.deleteWebhook(wh.id);

      expect(mockBase44.entities.Webhook.delete).toHaveBeenCalledWith(wh.id);
    });
  });

  describe('toggleWebhook', () => {
    it('should toggle active status', async () => {
      mockBase44.entities.Webhook.test_active = true;
      mockBase44.entities.Webhook.get.mockImplementation(async (id) => ({
        id,
        is_active: mockBase44.entities.Webhook.test_active
      }));
      mockBase44.entities.Webhook.update.mockImplementation(async (id, data) => {
        mockBase44.entities.Webhook.test_active = data.is_active;
        return { id, is_active: data.is_active };
      });

      const wh = await webhooks.createWebhook('https://example.com', ['event']);

      const toggled = await webhooks.toggleWebhook(wh.id);
      expect(toggled.is_active).toBe(false);

      const toggledBack = await webhooks.toggleWebhook(wh.id);
      expect(toggledBack.is_active).toBe(true);
    });
  });

  describe('triggerWebhook', () => {
    it('should trigger webhook for matching events', async () => {
      const handler = vi.fn();
      const unsub = webhooks.onWebhookEvent('delivery_success', handler);

      mockBase44.entities.Webhook.list.mockResolvedValue([
        { id: 'wh_1', url: 'https://example.com', is_active: true, events: ['user.created'] }
      ]);

      await webhooks.triggerWebhook('user.created', { userId: '123' });

      expect(mockBase44.functions.invoke).toHaveBeenCalled();
      expect(handler).toHaveBeenCalled();
      unsub();
    });
  });

  describe('Webhook Events', () => {
    it('should emit delivery_sent event', async () => {
      mockBase44.entities.Webhook.list.mockResolvedValue([
        { id: 'wh_1', url: 'https://example.com', is_active: true, events: ['event'] }
      ]);

      const promise = new Promise((resolve) => {
        const unsub = webhooks.onWebhookEvent('delivery_success', (event) => {
          expect(event).toBeDefined();
          unsub();
          resolve();
        });
        webhooks.triggerWebhook('event', {});
      });

      await promise;
    });
  });

  describe('resendWebhook', () => {
    it('should resend failed delivery', async () => {
      mockBase44.entities.WebhookDelivery.get.mockResolvedValue({
        id: 'del_1',
        event: 'event',
        payload: {}
      });

      await webhooks.resendWebhook('wh_1', 'del_1');

      expect(mockBase44.functions.invoke).toHaveBeenCalledWith('processWebhookDelivery', expect.objectContaining({
        delivery_id: 'del_1'
      }));
    });
  });
});
