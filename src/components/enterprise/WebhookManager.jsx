import React, { useState, useEffect } from 'react';
import * as webhooks from '@/utils/webhooks';

const EVENT_TYPES = [
  'user.created',
  'user.updated',
  'user.deleted',
  'project.created',
  'project.updated',
  'project.deleted',
  'team.created',
  'team.updated',
  'team.deleted',
  'member.invited',
  'member.joined',
  'member.removed'
];

const STATUS_COLORS = {
  success: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200',
  failed: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200',
  pending: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200',
  retrying: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200'
};

export default function WebhookManager() {
  const [webhookList, setWebhookList] = useState([]);
  const [selectedWebhook, setSelectedWebhook] = useState(null);
  const [deliveryLogs, setDeliveryLogs] = useState([]);
  const [showCreateWebhook, setShowCreateWebhook] = useState(false);
  const [showDeliveries, setShowDeliveries] = useState(false);
  const [formData, setFormData] = useState({
    url: '',
    events: [],
    headers: '',
    active: true
  });
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadWebhooks();
  }, []);

  useEffect(() => {
    if (selectedWebhook) {
      loadDeliveries(selectedWebhook.id);
    }
  }, [selectedWebhook]);

  const loadWebhooks = () => {
    // In a real app, fetch from API
    const stored = localStorage.getItem('webhooks');
    const whList = stored ? JSON.parse(stored) : [];
    setWebhookList(whList);
  };

  const loadDeliveries = (webhookId) => {
    const logs = webhooks.getDeliveryLogs(webhookId);
    setDeliveryLogs(logs || []);
  };

  const handleCreateWebhook = (e) => {
    e.preventDefault();
    if (!formData.url || formData.events.length === 0) {
      setMessage('URL and at least one event are required');
      return;
    }

    const headersObj = {};
    if (formData.headers) {
      const lines = formData.headers.split('\n');
      lines.forEach(line => {
        const [key, value] = line.split(':').map(s => s.trim());
        if (key && value) headersObj[key] = value;
      });
    }

    const newWebhook = webhooks.createWebhook(formData.url, formData.events, {
      headers: headersObj,
      active: formData.active
    });

    setWebhookList(prev => [...prev, newWebhook]);
    setMessage(`✅ Webhook created for ${formData.events.length} events`);
    setFormData({ url: '', events: [], headers: '', active: true });
    setShowCreateWebhook(false);

    setTimeout(() => setMessage(''), 3000);
  };

  const handleToggleEvent = (event) => {
    setFormData(prev => ({
      ...prev,
      events: prev.events.includes(event)
        ? prev.events.filter(e => e !== event)
        : [...prev.events, event]
    }));
  };

  const handleToggleWebhook = (webhookId) => {
    webhooks.toggleWebhook(webhookId);
    loadWebhooks();
    setMessage('✅ Webhook status updated');
    setTimeout(() => setMessage(''), 3000);
  };

  const handleDeleteWebhook = (webhookId) => {
    webhooks.deleteWebhook(webhookId);
    setWebhookList(prev => prev.filter(w => w.id !== webhookId));
    setSelectedWebhook(null);
    setMessage('✅ Webhook deleted');
    setTimeout(() => setMessage(''), 3000);
  };

  const handleResend = (deliveryId) => {
    const delivery = deliveryLogs.find(d => d.id === deliveryId);
    if (delivery) {
      webhooks.resendWebhook(selectedWebhook.id, delivery.id);
      loadDeliveries(selectedWebhook.id);
      setMessage('✅ Webhook resent');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleTriggerTest = () => {
    if (selectedWebhook) {
      webhooks.triggerWebhook('test.event', {
        timestamp: new Date().toISOString(),
        message: 'Test webhook delivery'
      });
      loadDeliveries(selectedWebhook.id);
      setMessage('✅ Test webhook triggered');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const getStats = (whId) => {
    return webhooks.getWebhookStats(whId);
  };

  return (
    <div className="p-6 bg-white dark:bg-gray-900 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
        🪝 Webhook Manager
      </h2>

      {message && (
        <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 rounded-lg">
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Webhooks List */}
        <div className="md:col-span-1">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            Webhooks
          </h3>

          <button
            onClick={() => setShowCreateWebhook(!showCreateWebhook)}
            className="w-full mb-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            + New Webhook
          </button>

          {showCreateWebhook && (
            <form onSubmit={handleCreateWebhook} className="mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-3">
              <input
                type="url"
                placeholder="Webhook URL"
                value={formData.url}
                onChange={e => setFormData({ ...formData, url: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />

              <div className="max-h-48 overflow-y-auto">
                <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase mb-2">
                  Events
                </p>
                {EVENT_TYPES.map(event => (
                  <label key={event} className="flex items-center text-sm mb-1">
                    <input
                      type="checkbox"
                      checked={formData.events.includes(event)}
                      onChange={() => handleToggleEvent(event)}
                      className="mr-2 rounded"
                    />
                    <span className="text-gray-700 dark:text-gray-300">{event}</span>
                  </label>
                ))}
              </div>

              <textarea
                placeholder="Custom Headers (key: value, one per line)"
                value={formData.headers}
                onChange={e => setFormData({ ...formData, headers: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                rows="3"
              />

              <button
                type="submit"
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                Create Webhook
              </button>
            </form>
          )}

          <div className="space-y-2">
            {webhookList.map(webhook => (
              <button
                key={webhook.id}
                onClick={() => setSelectedWebhook(webhook)}
                className={`w-full text-left p-3 rounded-lg transition ${
                  selectedWebhook?.id === webhook.id
                    ? 'bg-blue-100 dark:bg-blue-900/30 border-2 border-blue-600'
                    : 'bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                <p className="font-semibold text-gray-900 dark:text-white truncate">
                  {webhook.url.substring(0, 30)}...
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {webhook.events?.length || 0} events •{' '}
                  <span className={webhook.active ? 'text-green-600' : 'text-red-600'}>
                    {webhook.active ? 'Active' : 'Inactive'}
                  </span>
                </p>
              </button>
            ))}
          </div>

          {webhookList.length === 0 && (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">
              No webhooks yet
            </p>
          )}
        </div>

        {/* Webhook Details */}
        <div className="md:col-span-2">
          {selectedWebhook ? (
            <div>
              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {selectedWebhook.url}
                    </h4>
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                      selectedWebhook.active
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                        : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
                    }`}>
                      {selectedWebhook.active ? '✓ Active' : '✗ Inactive'}
                    </span>
                  </div>
                  <button
                    onClick={() => handleToggleWebhook(selectedWebhook.id)}
                    className={`px-4 py-2 rounded-lg transition ${
                      selectedWebhook.active
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : 'bg-green-600 hover:bg-green-700 text-white'
                    }`}
                  >
                    {selectedWebhook.active ? 'Disable' : 'Enable'}
                  </button>
                </div>

                {/* Statistics */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  {(() => {
                    const stats = getStats(selectedWebhook.id);
                    return (
                      <>
                        <div className="bg-white dark:bg-gray-700 p-3 rounded">
                          <p className="text-sm text-gray-600 dark:text-gray-400">Delivered</p>
                          <p className="text-xl font-bold text-green-600 dark:text-green-400">
                            {stats.delivered || 0}
                          </p>
                        </div>
                        <div className="bg-white dark:bg-gray-700 p-3 rounded">
                          <p className="text-sm text-gray-600 dark:text-gray-400">Failed</p>
                          <p className="text-xl font-bold text-red-600 dark:text-red-400">
                            {stats.failed || 0}
                          </p>
                        </div>
                      </>
                    );
                  })()}
                </div>

                <div className="mb-4">
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Events ({selectedWebhook.events?.length || 0}):
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedWebhook.events?.map(event => (
                      <span
                        key={event}
                        className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full text-sm"
                      >
                        {event}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleTriggerTest}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                  >
                    Test Delivery
                  </button>
                  <button
                    onClick={() => setShowDeliveries(!showDeliveries)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    View Deliveries
                  </button>
                  <button
                    onClick={() => handleDeleteWebhook(selectedWebhook.id)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {showDeliveries && (
                <div>
                  <h5 className="font-semibold text-gray-900 dark:text-white mb-3">
                    Delivery History ({deliveryLogs.length})
                  </h5>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {deliveryLogs.map(log => (
                      <div
                        key={log.id}
                        className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            STATUS_COLORS[log.status] || STATUS_COLORS.pending
                          }`}>
                            {log.status.toUpperCase()}
                          </span>
                          <span className="text-xs text-gray-600 dark:text-gray-400">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                          {log.event}
                        </p>
                        {log.error && (
                          <p className="text-xs text-red-600 dark:text-red-400 mb-2">
                            Error: {log.error}
                          </p>
                        )}
                        {log.status === 'failed' && (
                          <button
                            onClick={() => handleResend(log.id)}
                            className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                          >
                            Retry
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-center text-gray-500 dark:text-gray-400 py-12">
              Select a webhook to view details
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
