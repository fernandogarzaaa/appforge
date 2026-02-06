import { useState, useCallback, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

/**
 * useTeamWorkflows Hook
 * Manages team automations, webhooks, and workflow integrations
 * Persists to backend API instead of localStorage
 * 
 * @returns {Object} Team workflows management interface
 */
export function useTeamWorkflows() {
  const [workflows, setWorkflows] = useState([]);
  const [webhooks, setWebhooks] = useState([]);
  const [automations, setAutomations] = useState([]);
  const [integratedServices, setIntegratedServices] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  // Load workflows from backend on mount
  useEffect(() => {
    loadTeamWorkflows();
  }, []);

  const loadTeamWorkflows = async () => {
    try {
      const [workflowList, webhookList, automationList, serviceList] = await Promise.all([
        base44.entities.TeamWorkflow.list('-created_date', 200),
        base44.entities.Webhook.filter({ scope: 'team' }, '-created_date', 200),
        base44.entities.TeamAutomation.list('-created_date', 200),
        base44.entities.TeamIntegration.list('-created_date', 200),
      ]);

      setWorkflows(workflowList || []);
      setWebhooks(webhookList || []);
      setAutomations(automationList || []);

      const services = (serviceList || []).reduce((acc, service) => {
        if (service?.service) {
          acc[service.service] = service;
        }
        return acc;
      }, {});
      setIntegratedServices(services);
    } catch (error) {
      console.error('Failed to load team workflows:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Create a new workflow
   * @param {Object} workflow - Workflow configuration
   */
  const createWorkflow = useCallback(async (workflow) => {
    const newWorkflow = await base44.entities.TeamWorkflow.create({
      ...workflow,
      enabled: true,
      executions: 0,
      last_run: null,
      success_count: 0,
      failure_count: 0,
      created_at: new Date().toISOString(),
    });
    setWorkflows((prev) => [newWorkflow, ...prev]);
    return newWorkflow;
  }, []);

  /**
   * Delete a workflow
   */
  const deleteWorkflow = useCallback(async (workflowId) => {
    await base44.entities.TeamWorkflow.delete(workflowId);
    setWorkflows((prev) => prev.filter(w => w.id !== workflowId));
  }, []);

  /**
   * Enable/disable a workflow
   */
  const toggleWorkflow = useCallback(async (workflowId) => {
    const workflow = workflows.find(w => w.id === workflowId);
    if (!workflow) return;
    const updated = await base44.entities.TeamWorkflow.update(workflowId, {
      enabled: !workflow.enabled,
      updated_at: new Date().toISOString()
    });
    setWorkflows((prev) => prev.map(w => w.id === workflowId ? updated : w));
  }, [workflows]);

  /**
   * Register a webhook integration
   * @param {Object} webhook - Webhook configuration
   */
  const registerWebhook = useCallback(async (webhook) => {
    const newWebhook = await base44.entities.Webhook.create({
      url: webhook.url,
      events: [webhook.event],
      secret: webhook.secret || generateWebhookToken(),
      is_active: true,
      scope: 'team',
      created_at: new Date().toISOString(),
      verified: false
    });
    setWebhooks((prev) => [newWebhook, ...prev]);
    return newWebhook;
  }, []);

  /**
   * Verify webhook by sending test event
   */
  const verifyWebhook = useCallback(async (webhookId) => {
    const webhook = webhooks.find(w => w.id === webhookId);
    if (!webhook) return false;

    await base44.functions.invoke('processWebhookDelivery', {
      event_type: webhook.events?.[0] || 'team.test',
      payload: { test: true, timestamp: new Date().toISOString() },
      webhook_id: webhook.id
    });

    const updated = await base44.entities.Webhook.update(webhookId, {
      verified: true,
      last_event: new Date().toISOString()
    });

    setWebhooks((prev) => prev.map(w => w.id === webhookId ? updated : w));
    return true;
  }, [webhooks]);

  /**
   * Delete a webhook
   */
  const deleteWebhook = useCallback(async (webhookId) => {
    await base44.entities.Webhook.delete(webhookId);
    setWebhooks((prev) => prev.filter(w => w.id !== webhookId));
  }, []);

  /**
   * Create standup automation
   */
  const createStandupAutomation = useCallback(async (config) => {
    const automation = await base44.entities.TeamAutomation.create({
      type: 'standup',
      ...config,
      enabled: true,
      last_run: null,
      schedule: config.schedule || 'daily',
      time: config.time || '09:00',
      members: config.members || [],
      format: config.format || 'summary',
      created_at: new Date().toISOString()
    });
    setAutomations((prev) => [automation, ...prev]);
    return automation;
  }, []);

  /**
   * Create PR notification automation
   */
  const createPRNotificationAutomation = useCallback(async (config) => {
    const automation = await base44.entities.TeamAutomation.create({
      type: 'pr-notification',
      ...config,
      enabled: true,
      notify_on: config.notifyOn || ['created', 'reviewed', 'merged'],
      channels: config.channels || ['slack'],
      template: config.template || 'default',
      filters: config.filters || {
        labels: [],
        authors: [],
        minReviewers: 0
      },
      created_at: new Date().toISOString()
    });
    setAutomations((prev) => [automation, ...prev]);
    return automation;
  }, []);

  /**
   * Create issue automation
   */
  const createIssueAutomation = useCallback(async (config) => {
    const automation = await base44.entities.TeamAutomation.create({
      type: 'issue-automation',
      ...config,
      enabled: true,
      triggers: config.triggers || ['created', 'commented'],
      actions: config.actions || ['assign', 'label', 'notify'],
      rules: config.rules || [],
      created_at: new Date().toISOString()
    });
    setAutomations((prev) => [automation, ...prev]);
    return automation;
  }, []);

  /**
   * Delete automation
   */
  const deleteAutomation = useCallback(async (automationId) => {
    await base44.entities.TeamAutomation.delete(automationId);
    setAutomations((prev) => prev.filter(a => a.id !== automationId));
  }, []);

  /**
   * Toggle automation enabled/disabled
   */
  const toggleAutomation = useCallback(async (automationId) => {
    const automation = automations.find(a => a.id === automationId);
    if (!automation) return;
    const updated = await base44.entities.TeamAutomation.update(automationId, {
      enabled: !automation.enabled,
      updated_at: new Date().toISOString()
    });
    setAutomations((prev) => prev.map(a => a.id === automationId ? updated : a));
  }, [automations]);

  /**
   * Connect to external service (Slack, Teams, etc.)
   */
  const connectService = useCallback(async (service, config) => {
    const integration = await base44.entities.TeamIntegration.create({
      service,
      config,
      connected_at: new Date().toISOString(),
      is_connected: true,
      health: 'healthy'
    });
    setIntegratedServices(prev => ({ ...prev, [service]: integration }));
    return integration;
  }, []);

  /**
   * Disconnect service
   */
  const disconnectService = useCallback(async (service) => {
    const integration = integratedServices[service];
    if (integration?.id) {
      await base44.entities.TeamIntegration.delete(integration.id);
    }
    const updated = { ...integratedServices };
    delete updated[service];
    setIntegratedServices(updated);
  }, [integratedServices]);

  /**
   * Get service health status
   */
  const getServiceHealth = useCallback((service) => {
    return integratedServices[service]?.health || 'disconnected';
  }, [integratedServices]);

  /**
   * Execute a workflow manually
   */
  const executeWorkflow = useCallback(async (workflowId) => {
    const response = await base44.functions.invoke('executeTeamWorkflow', {
      workflowId,
      triggerData: {}
    });
    await loadTeamWorkflows();
    return response?.data || response;
  }, []);

  /**
   * Get workflow execution history
   */
  const getWorkflowHistory = useCallback((workflowId) => {
    const workflow = workflows.find(w => w.id === workflowId);
    if (!workflow) return [];

    return {
      totalExecutions: workflow.executions,
      successCount: workflow.successCount,
      failureCount: workflow.failureCount,
      successRate: workflow.executions > 0
        ? ((workflow.successCount / workflow.executions) * 100).toFixed(1)
        : 0,
      lastRun: workflow.lastRun
    };
  }, [workflows]);

  /**
   * Generate webhook URL
   */
  const generateWebhookToken = useCallback(() => {
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const bytes = new Uint8Array(16);
      crypto.getRandomValues(bytes);
      return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
    }
    return `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
  }, []);

  return {
    // Workflows
    workflows,
    createWorkflow,
    deleteWorkflow,
    toggleWorkflow,
    executeWorkflow,
    getWorkflowHistory,

    // Webhooks
    webhooks,
    registerWebhook,
    verifyWebhook,
    deleteWebhook,

    // Automations
    automations,
    createStandupAutomation,
    createPRNotificationAutomation,
    createIssueAutomation,
    deleteAutomation,
    toggleAutomation,

    // Services
    integratedServices,
    connectService,
    disconnectService,
    getServiceHealth
  };
}
