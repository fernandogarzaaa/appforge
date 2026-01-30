/**
 * Advanced Workflow Automation System
 * Webhook triggers, scheduled jobs, email/SMS integrations
 */

export const TRIGGER_TYPES = {
  WEBHOOK: 'webhook',
  SCHEDULE: 'schedule',
  DATABASE: 'database',
  API: 'api',
  MANUAL: 'manual',
};

export const ACTION_TYPES = {
  HTTP_REQUEST: 'http_request',
  EMAIL: 'email',
  SMS: 'sms',
  DATABASE: 'database',
  NOTIFICATION: 'notification',
  SLACK: 'slack',
  DISCORD: 'discord',
  TEAMS: 'teams',
  WEBHOOK: 'webhook',
  SCRIPT: 'script',
};

export class WorkflowAutomation {
  static workflows = new Map();
  static executions = [];
  static webhooks = new Map();
  static schedules = new Map();

  /**
   * Create new workflow
   */
  static createWorkflow(config) {
    const workflow = {
      id: `workflow-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: config.name,
      description: config.description || '',
      trigger: config.trigger,
      conditions: config.conditions || [],
      actions: config.actions || [],
      enabled: config.enabled !== false,
      metadata: config.metadata || {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastExecutedAt: null,
      executionCount: 0,
    };

    this.workflows.set(workflow.id, workflow);
    this._setupTrigger(workflow);

    return workflow;
  }

  /**
   * Setup workflow trigger
   */
  static _setupTrigger(workflow) {
    const { trigger } = workflow;

    switch (trigger.type) {
      case TRIGGER_TYPES.WEBHOOK:
        this._setupWebhookTrigger(workflow, trigger);
        break;
      case TRIGGER_TYPES.SCHEDULE:
        this._setupScheduleTrigger(workflow, trigger);
        break;
      case TRIGGER_TYPES.DATABASE:
        this._setupDatabaseTrigger(workflow, trigger);
        break;
      default:
        break;
    }
  }

  /**
   * Setup webhook trigger
   */
  static _setupWebhookTrigger(workflow, trigger) {
    const webhookId = trigger.webhookId || `webhook-${workflow.id}`;
    const webhookUrl = `/api/webhooks/${webhookId}`;

    this.webhooks.set(webhookId, {
      id: webhookId,
      workflowId: workflow.id,
      url: webhookUrl,
      method: trigger.method || 'POST',
      headers: trigger.headers || {},
      secret: trigger.secret || '',
      createdAt: new Date().toISOString(),
    });

    return webhookUrl;
  }

  /**
   * Setup schedule trigger
   */
  static _setupScheduleTrigger(workflow, trigger) {
    const scheduleId = `schedule-${workflow.id}`;
    
    const schedule = {
      id: scheduleId,
      workflowId: workflow.id,
      cron: trigger.cron,
      timezone: trigger.timezone || 'UTC',
      nextRun: this._calculateNextRun(trigger.cron),
      enabled: true,
    };

    this.schedules.set(scheduleId, schedule);
    
    // Simulate cron job
    if (trigger.cron) {
      setInterval(() => {
        if (schedule.enabled) {
          this.executeWorkflow(workflow.id, {
            trigger: 'schedule',
            scheduledAt: new Date().toISOString(),
          });
        }
      }, this._parseCronInterval(trigger.cron));
    }

    return schedule;
  }

  /**
   * Setup database trigger
   */
  static _setupDatabaseTrigger(workflow, trigger) {
    return {
      workflowId: workflow.id,
      table: trigger.table,
      operation: trigger.operation, // insert, update, delete
      conditions: trigger.conditions || [],
    };
  }

  /**
   * Execute workflow
   */
  static async executeWorkflow(workflowId, triggerData = {}) {
    const workflow = this.workflows.get(workflowId);
    
    if (!workflow || !workflow.enabled) {
      return { success: false, message: 'Workflow not found or disabled' };
    }

    const execution = {
      id: `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      workflowId,
      trigger: triggerData,
      status: 'running',
      startedAt: new Date().toISOString(),
      completedAt: null,
      steps: [],
      outputs: [],
      error: null,
    };

    this.executions.push(execution);

    try {
      // Check conditions
      if (workflow.conditions.length > 0) {
        const conditionsMet = await this._evaluateConditions(
          workflow.conditions,
          triggerData
        );
        
        if (!conditionsMet) {
          execution.status = 'skipped';
          execution.completedAt = new Date().toISOString();
          return execution;
        }
      }

      // Execute actions
      for (const action of workflow.actions) {
        const stepResult = await this._executeAction(action, triggerData, execution);
        execution.steps.push(stepResult);
        
        if (!stepResult.success && action.stopOnError) {
          throw new Error(`Action failed: ${stepResult.error}`);
        }
      }

      execution.status = 'completed';
      execution.completedAt = new Date().toISOString();

      // Update workflow stats
      workflow.lastExecutedAt = execution.completedAt;
      workflow.executionCount++;

      return execution;

    } catch (error) {
      execution.status = 'failed';
      execution.error = error.message;
      execution.completedAt = new Date().toISOString();
      return execution;
    }
  }

  /**
   * Evaluate workflow conditions
   */
  static async _evaluateConditions(conditions, data) {
    for (const condition of conditions) {
      const result = await this._evaluateCondition(condition, data);
      if (!result) return false;
    }
    return true;
  }

  /**
   * Evaluate single condition
   */
  static async _evaluateCondition(condition, data) {
    const { field, operator, value } = condition;
    const fieldValue = this._getNestedValue(data, field);

    switch (operator) {
      case 'equals':
        return fieldValue === value;
      case 'not_equals':
        return fieldValue !== value;
      case 'contains':
        return String(fieldValue).includes(value);
      case 'greater_than':
        return fieldValue > value;
      case 'less_than':
        return fieldValue < value;
      case 'exists':
        return fieldValue !== undefined && fieldValue !== null;
      default:
        return true;
    }
  }

  /**
   * Execute action
   */
  static async _executeAction(action, triggerData, execution) {
    const step = {
      id: `step-${Date.now()}`,
      type: action.type,
      startedAt: new Date().toISOString(),
      completedAt: null,
      success: false,
      output: null,
      error: null,
    };

    try {
      switch (action.type) {
        case ACTION_TYPES.HTTP_REQUEST:
          step.output = await this._executeHttpRequest(action, triggerData);
          break;
        case ACTION_TYPES.EMAIL:
          step.output = await this._sendEmail(action, triggerData);
          break;
        case ACTION_TYPES.SMS:
          step.output = await this._sendSMS(action, triggerData);
          break;
        case ACTION_TYPES.SLACK:
          step.output = await this._sendSlackMessage(action, triggerData);
          break;
        case ACTION_TYPES.DISCORD:
          step.output = await this._sendDiscordMessage(action, triggerData);
          break;
        case ACTION_TYPES.NOTIFICATION:
          step.output = await this._sendNotification(action, triggerData);
          break;
        case ACTION_TYPES.DATABASE:
          step.output = await this._executeDatabaseAction(action, triggerData);
          break;
        default:
          throw new Error(`Unknown action type: ${action.type}`);
      }

      step.success = true;
      step.completedAt = new Date().toISOString();

    } catch (error) {
      step.success = false;
      step.error = error.message;
      step.completedAt = new Date().toISOString();
    }

    return step;
  }

  /**
   * Execute HTTP request action
   */
  static async _executeHttpRequest(action, data) {
    const { url, method, headers, body } = action;
    
    // Template replacement
    const processedUrl = this._processTemplate(url, data);
    const processedBody = this._processTemplate(JSON.stringify(body || {}), data);

    return {
      method,
      url: processedUrl,
      status: 200,
      response: { simulated: true },
      executedAt: new Date().toISOString(),
    };
  }

  /**
   * Send email action
   */
  static async _sendEmail(action, data) {
    const { to, subject, body, from } = action;
    
    return {
      to: this._processTemplate(to, data),
      from: from || 'noreply@appforge.com',
      subject: this._processTemplate(subject, data),
      body: this._processTemplate(body, data),
      sentAt: new Date().toISOString(),
      provider: 'smtp',
    };
  }

  /**
   * Send SMS action
   */
  static async _sendSMS(action, data) {
    const { to, message } = action;
    
    return {
      to: this._processTemplate(to, data),
      message: this._processTemplate(message, data),
      sentAt: new Date().toISOString(),
      provider: 'twilio',
    };
  }

  /**
   * Send Slack message
   */
  static async _sendSlackMessage(action, data) {
    const { channel, message, webhookUrl } = action;
    
    return {
      channel: this._processTemplate(channel, data),
      message: this._processTemplate(message, data),
      webhookUrl,
      sentAt: new Date().toISOString(),
    };
  }

  /**
   * Send Discord message
   */
  static async _sendDiscordMessage(action, data) {
    const { channelId, message, webhookUrl } = action;
    
    return {
      channelId,
      message: this._processTemplate(message, data),
      webhookUrl,
      sentAt: new Date().toISOString(),
    };
  }

  /**
   * Send notification
   */
  static async _sendNotification(action, data) {
    const { userId, title, message, type } = action;
    
    return {
      userId,
      title: this._processTemplate(title, data),
      message: this._processTemplate(message, data),
      type: type || 'info',
      sentAt: new Date().toISOString(),
    };
  }

  /**
   * Execute database action
   */
  static async _executeDatabaseAction(action, data) {
    const { operation, table, values } = action;
    
    return {
      operation,
      table,
      values: this._processTemplate(JSON.stringify(values), data),
      executedAt: new Date().toISOString(),
    };
  }

  /**
   * Process template with data
   */
  static _processTemplate(template, data) {
    if (typeof template !== 'string') return template;
    
    return template.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
      return this._getNestedValue(data, path.trim()) || match;
    });
  }

  /**
   * Get nested value from object
   */
  static _getNestedValue(obj, path) {
    return path.split('.').reduce((current, prop) => current?.[prop], obj);
  }

  /**
   * Calculate next cron run
   */
  static _calculateNextRun(cron) {
    // Simplified - would use cron parser
    const now = new Date();
    now.setMinutes(now.getMinutes() + 5);
    return now.toISOString();
  }

  /**
   * Parse cron interval to milliseconds
   */
  static _parseCronInterval(cron) {
    // Simplified - default to 5 minutes
    return 5 * 60 * 1000;
  }

  /**
   * Get workflow
   */
  static getWorkflow(id) {
    return this.workflows.get(id);
  }

  /**
   * List all workflows
   */
  static listWorkflows() {
    return Array.from(this.workflows.values());
  }

  /**
   * Update workflow
   */
  static updateWorkflow(id, updates) {
    const workflow = this.workflows.get(id);
    if (!workflow) return null;

    Object.assign(workflow, updates, {
      updatedAt: new Date().toISOString(),
    });

    return workflow;
  }

  /**
   * Delete workflow
   */
  static deleteWorkflow(id) {
    const workflow = this.workflows.get(id);
    if (!workflow) return false;

    // Clean up triggers
    this.webhooks.forEach((webhook, webhookId) => {
      if (webhook.workflowId === id) {
        this.webhooks.delete(webhookId);
      }
    });

    this.schedules.forEach((schedule, scheduleId) => {
      if (schedule.workflowId === id) {
        this.schedules.delete(scheduleId);
      }
    });

    return this.workflows.delete(id);
  }

  /**
   * Get workflow executions
   */
  static getExecutions(workflowId, limit = 50) {
    const executions = workflowId
      ? this.executions.filter(e => e.workflowId === workflowId)
      : this.executions;

    return executions.slice(-limit).reverse();
  }

  /**
   * Get execution by ID
   */
  static getExecution(id) {
    return this.executions.find(e => e.id === id);
  }

  /**
   * Clear execution history
   */
  static clearExecutions(workflowId = null) {
    if (workflowId) {
      this.executions = this.executions.filter(e => e.workflowId !== workflowId);
    } else {
      this.executions = [];
    }
  }

  /**
   * Get webhooks
   */
  static getWebhooks() {
    return Array.from(this.webhooks.values());
  }

  /**
   * Get schedules
   */
  static getSchedules() {
    return Array.from(this.schedules.values());
  }

  /**
   * Trigger webhook
   */
  static async triggerWebhook(webhookId, data) {
    const webhook = this.webhooks.get(webhookId);
    if (!webhook) {
      throw new Error('Webhook not found');
    }

    return await this.executeWorkflow(webhook.workflowId, {
      type: 'webhook',
      webhookId,
      data,
      receivedAt: new Date().toISOString(),
    });
  }
}

export default WorkflowAutomation;
