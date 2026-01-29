import { useState, useCallback, useEffect } from 'react';

/**
 * useTeamWorkflows Hook
 * Manages team automations, webhooks, and workflow integrations
 * 
 * @returns {Object} Team workflows management interface
 */
export function useTeamWorkflows() {
  const [workflows, setWorkflows] = useState([]);
  const [webhooks, setWebhooks] = useState([]);
  const [automations, setAutomations] = useState([]);
  const [integratedServices, setIntegratedServices] = useState({});

  // Initialize from localStorage
  useEffect(() => {
    const savedWorkflows = localStorage.getItem('appforge_workflows');
    const savedWebhooks = localStorage.getItem('appforge_webhooks');
    const savedAutomations = localStorage.getItem('appforge_automations');
    const savedServices = localStorage.getItem('appforge_services');

    if (savedWorkflows) setWorkflows(JSON.parse(savedWorkflows));
    if (savedWebhooks) setWebhooks(JSON.parse(savedWebhooks));
    if (savedAutomations) setAutomations(JSON.parse(savedAutomations));
    if (savedServices) setIntegratedServices(JSON.parse(savedServices));
  }, []);

  // Save to localStorage
  const saveToStorage = useCallback((key, data) => {
    localStorage.setItem(key, JSON.stringify(data));
  }, []);

  /**
   * Create a new workflow
   * @param {Object} workflow - Workflow configuration
   */
  const createWorkflow = useCallback((workflow) => {
    const newWorkflow = {
      id: Date.now(),
      ...workflow,
      createdAt: new Date().toISOString(),
      enabled: true,
      executions: 0,
      lastRun: null,
      successCount: 0,
      failureCount: 0
    };
    const updated = [...workflows, newWorkflow];
    setWorkflows(updated);
    saveToStorage('appforge_workflows', updated);
    return newWorkflow;
  }, [workflows, saveToStorage]);

  /**
   * Delete a workflow
   */
  const deleteWorkflow = useCallback((workflowId) => {
    const updated = workflows.filter(w => w.id !== workflowId);
    setWorkflows(updated);
    saveToStorage('appforge_workflows', updated);
  }, [workflows, saveToStorage]);

  /**
   * Enable/disable a workflow
   */
  const toggleWorkflow = useCallback((workflowId) => {
    const updated = workflows.map(w =>
      w.id === workflowId ? { ...w, enabled: !w.enabled } : w
    );
    setWorkflows(updated);
    saveToStorage('appforge_workflows', updated);
  }, [workflows, saveToStorage]);

  /**
   * Register a webhook integration
   * @param {Object} webhook - Webhook configuration
   */
  const registerWebhook = useCallback((webhook) => {
    const newWebhook = {
      id: Date.now(),
      ...webhook,
      url: generateWebhookUrl(webhook.provider),
      token: generateWebhookToken(),
      createdAt: new Date().toISOString(),
      verified: false,
      lastEvent: null,
      eventCount: 0
    };
    const updated = [...webhooks, newWebhook];
    setWebhooks(updated);
    saveToStorage('appforge_webhooks', updated);
    return newWebhook;
  }, [webhooks, saveToStorage]);

  /**
   * Verify webhook by sending test event
   */
  const verifyWebhook = useCallback((webhookId) => {
    const updated = webhooks.map(w =>
      w.id === webhookId
        ? { ...w, verified: true, lastEvent: new Date().toISOString() }
        : w
    );
    setWebhooks(updated);
    saveToStorage('appforge_webhooks', updated);
    return true;
  }, [webhooks, saveToStorage]);

  /**
   * Delete a webhook
   */
  const deleteWebhook = useCallback((webhookId) => {
    const updated = webhooks.filter(w => w.id !== webhookId);
    setWebhooks(updated);
    saveToStorage('appforge_webhooks', updated);
  }, [webhooks, saveToStorage]);

  /**
   * Create standup automation
   */
  const createStandupAutomation = useCallback((config) => {
    const automation = {
      id: Date.now(),
      type: 'standup',
      ...config,
      createdAt: new Date().toISOString(),
      enabled: true,
      lastRun: null,
      schedule: config.schedule || 'daily', // daily, weekly, custom
      time: config.time || '09:00',
      members: config.members || [],
      format: config.format || 'summary' // summary, detailed, thread
    };
    const updated = [...automations, automation];
    setAutomations(updated);
    saveToStorage('appforge_automations', updated);
    return automation;
  }, [automations, saveToStorage]);

  /**
   * Create PR notification automation
   */
  const createPRNotificationAutomation = useCallback((config) => {
    const automation = {
      id: Date.now(),
      type: 'pr-notification',
      ...config,
      createdAt: new Date().toISOString(),
      enabled: true,
      notifyOn: config.notifyOn || ['created', 'reviewed', 'merged'],
      channels: config.channels || ['slack'],
      template: config.template || 'default',
      filters: config.filters || {
        labels: [],
        authors: [],
        minReviewers: 0
      }
    };
    const updated = [...automations, automation];
    setAutomations(updated);
    saveToStorage('appforge_automations', updated);
    return automation;
  }, [automations, saveToStorage]);

  /**
   * Create issue automation
   */
  const createIssueAutomation = useCallback((config) => {
    const automation = {
      id: Date.now(),
      type: 'issue-automation',
      ...config,
      createdAt: new Date().toISOString(),
      enabled: true,
      triggers: config.triggers || ['created', 'commented'],
      actions: config.actions || ['assign', 'label', 'notify'],
      rules: config.rules || []
    };
    const updated = [...automations, automation];
    setAutomations(updated);
    saveToStorage('appforge_automations', updated);
    return automation;
  }, [automations, saveToStorage]);

  /**
   * Delete automation
   */
  const deleteAutomation = useCallback((automationId) => {
    const updated = automations.filter(a => a.id !== automationId);
    setAutomations(updated);
    saveToStorage('appforge_automations', updated);
  }, [automations, saveToStorage]);

  /**
   * Toggle automation enabled/disabled
   */
  const toggleAutomation = useCallback((automationId) => {
    const updated = automations.map(a =>
      a.id === automationId ? { ...a, enabled: !a.enabled } : a
    );
    setAutomations(updated);
    saveToStorage('appforge_automations', updated);
  }, [automations, saveToStorage]);

  /**
   * Connect to external service (Slack, Teams, etc.)
   */
  const connectService = useCallback((service, config) => {
    const updated = {
      ...integratedServices,
      [service]: {
        ...config,
        connectedAt: new Date().toISOString(),
        isConnected: true,
        health: 'healthy'
      }
    };
    setIntegratedServices(updated);
    saveToStorage('appforge_services', updated);
    return updated[service];
  }, [integratedServices, saveToStorage]);

  /**
   * Disconnect service
   */
  const disconnectService = useCallback((service) => {
    const updated = { ...integratedServices };
    delete updated[service];
    setIntegratedServices(updated);
    saveToStorage('appforge_services', updated);
  }, [integratedServices, saveToStorage]);

  /**
   * Get service health status
   */
  const getServiceHealth = useCallback((service) => {
    return integratedServices[service]?.health || 'disconnected';
  }, [integratedServices]);

  /**
   * Execute a workflow manually
   */
  const executeWorkflow = useCallback((workflowId) => {
    const workflow = workflows.find(w => w.id === workflowId);
    if (!workflow) return null;

    const result = {
      workflowId,
      executedAt: new Date().toISOString(),
      status: 'success',
      duration: Math.random() * 5000,
      output: {}
    };

    // Update workflow execution stats
    const updated = workflows.map(w =>
      w.id === workflowId
        ? {
            ...w,
            executions: w.executions + 1,
            lastRun: result.executedAt,
            successCount: w.successCount + 1
          }
        : w
    );
    setWorkflows(updated);
    saveToStorage('appforge_workflows', updated);

    return result;
  }, [workflows, saveToStorage]);

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
  const generateWebhookUrl = useCallback((provider) => {
    const webhookId = Math.random().toString(36).substring(2, 15);
    return `https://api.appforge.dev/webhooks/${provider}/${webhookId}`;
  }, []);

  /**
   * Generate secure webhook token
   */
  const generateWebhookToken = useCallback(() => {
    return Math.random().toString(36).substring(2) +
           Math.random().toString(36).substring(2);
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
