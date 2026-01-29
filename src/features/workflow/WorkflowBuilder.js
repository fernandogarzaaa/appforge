/**
 * Custom Workflow Builder
 * Visual workflow creation with triggers, conditions, and actions
 */

/**
 * Workflow builder with visual editor support
 */
export class WorkflowBuilder {
  constructor(name) {
    this.workflow = {
      id: Date.now(),
      name,
      description: '',
      triggers: [],
      conditions: [],
      actions: [],
      enabled: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * Add trigger to workflow
   */
  addTrigger(trigger) {
    this.workflow.triggers.push({
      id: Date.now(),
      type: trigger.type,
      config: trigger.config || {},
      description: trigger.description || `${trigger.type} trigger`
    });
    return this;
  }

  /**
   * Add condition to workflow
   */
  addCondition(condition) {
    this.workflow.conditions.push({
      id: Date.now(),
      type: condition.type, // 'if', 'and', 'or'
      field: condition.field,
      operator: condition.operator, // 'equals', 'contains', 'greater', 'less', etc.
      value: condition.value,
      description: condition.description || `${condition.field} ${condition.operator} ${condition.value}`
    });
    return this;
  }

  /**
   * Add action to workflow
   */
  addAction(action) {
    this.workflow.actions.push({
      id: Date.now(),
      type: action.type,
      config: action.config || {},
      description: action.description || `${action.type} action`,
      order: this.workflow.actions.length
    });
    return this;
  }

  /**
   * Build workflow
   */
  build() {
    this.workflow.updatedAt = new Date().toISOString();
    return this.workflow;
  }

  /**
   * Validate workflow
   */
  validate() {
    const errors = [];

    if (!this.workflow.name) {
      errors.push('Workflow name is required');
    }

    if (this.workflow.triggers.length === 0) {
      errors.push('At least one trigger is required');
    }

    if (this.workflow.actions.length === 0) {
      errors.push('At least one action is required');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Export workflow as JSON
   */
  export() {
    return JSON.stringify(this.workflow, null, 2);
  }

  /**
   * Import workflow from JSON
   */
  static import(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      const builder = new WorkflowBuilder(data.name);
      builder.workflow = data;
      return builder;
    } catch (error) {
      throw new Error(`Failed to import workflow: ${error.message}`);
    }
  }
}

/**
 * Workflow trigger types
 */
export const TRIGGER_TYPES = {
  'MANUAL': {
    name: 'Manual Trigger',
    description: 'Manually triggered by user',
    config: {}
  },
  'SCHEDULED': {
    name: 'Scheduled Trigger',
    description: 'Triggered on schedule',
    config: {
      schedule: 'daily', // daily, weekly, monthly
      time: '09:00'
    }
  },
  'WEBHOOK': {
    name: 'Webhook Trigger',
    description: 'Triggered by external webhook',
    config: {
      url: '',
      method: 'POST'
    }
  },
  'FILE_CHANGE': {
    name: 'File Change Trigger',
    description: 'Triggered when file changes',
    config: {
      path: '',
      events: ['create', 'modify', 'delete']
    }
  },
  'CODE_PUSH': {
    name: 'Code Push Trigger',
    description: 'Triggered on code push',
    config: {
      branch: 'main',
      repository: ''
    }
  },
  'PR_EVENT': {
    name: 'Pull Request Event',
    description: 'Triggered on PR event',
    config: {
      events: ['opened', 'closed', 'merged']
    }
  }
};

/**
 * Workflow condition operators
 */
export const CONDITION_OPERATORS = {
  'equals': (field, value) => field === value,
  'not_equals': (field, value) => field !== value,
  'contains': (field, value) => String(field).includes(String(value)),
  'not_contains': (field, value) => !String(field).includes(String(value)),
  'greater': (field, value) => Number(field) > Number(value),
  'less': (field, value) => Number(field) < Number(value),
  'greater_equal': (field, value) => Number(field) >= Number(value),
  'less_equal': (field, value) => Number(field) <= Number(value),
  'matches_regex': (field, value) => new RegExp(value).test(String(field)),
  'exists': (field) => field !== null && field !== undefined
};

/**
 * Workflow action types
 */
export const ACTION_TYPES = {
  'SEND_NOTIFICATION': {
    name: 'Send Notification',
    description: 'Send notification to team',
    config: {
      channel: 'slack',
      message: ''
    }
  },
  'CREATE_ISSUE': {
    name: 'Create Issue',
    description: 'Create new issue in tracker',
    config: {
      title: '',
      description: '',
      labels: []
    }
  },
  'UPDATE_CODE': {
    name: 'Update Code',
    description: 'Automatically update code',
    config: {
      find: '',
      replace: ''
    }
  },
  'RUN_TEST': {
    name: 'Run Tests',
    description: 'Run test suite',
    config: {
      suite: 'all',
      timeout: 30000
    }
  },
  'DEPLOY': {
    name: 'Deploy',
    description: 'Deploy to environment',
    config: {
      environment: 'staging',
      branch: 'main'
    }
  },
  'SEND_EMAIL': {
    name: 'Send Email',
    description: 'Send email notification',
    config: {
      to: '',
      subject: '',
      template: ''
    }
  },
  'WEBHOOK_CALL': {
    name: 'Call Webhook',
    description: 'Call external webhook',
    config: {
      url: '',
      method: 'POST',
      payload: {}
    }
  },
  'LOG_EVENT': {
    name: 'Log Event',
    description: 'Log event for tracking',
    config: {
      category: '',
      message: ''
    }
  }
};

/**
 * Evaluate workflow conditions
 */
export function evaluateConditions(conditions, context) {
  if (conditions.length === 0) return true;

  return conditions.every(cond => {
    const operator = CONDITION_OPERATORS[cond.operator];
    if (!operator) return false;

    const field = context[cond.field];
    return operator(field, cond.value);
  });
}

/**
 * Execute workflow
 */
export async function executeWorkflow(workflow, context = {}) {
  const result = {
    workflowId: workflow.id,
    startTime: new Date().toISOString(),
    status: 'running',
    actionsExecuted: [],
    errors: []
  };

  try {
    // Evaluate conditions
    if (!evaluateConditions(workflow.conditions, context)) {
      result.status = 'skipped';
      result.reason = 'Conditions not met';
      return result;
    }

    // Execute actions in order
    for (const action of workflow.actions) {
      try {
        const actionResult = await executeAction(action, context);
        result.actionsExecuted.push({
          actionId: action.id,
          type: action.type,
          status: 'success',
          result: actionResult
        });
      } catch (error) {
        result.errors.push({
          actionId: action.id,
          type: action.type,
          error: error.message
        });
        // Continue execution even if action fails
      }
    }

    result.status = result.errors.length === 0 ? 'success' : 'partial';
    result.endTime = new Date().toISOString();

  } catch (error) {
    result.status = 'failed';
    result.error = error.message;
  }

  return result;
}

/**
 * Execute single action
 */
async function executeAction(action, context) {
  switch (action.type) {
    case 'SEND_NOTIFICATION':
      return sendNotification(action.config);

    case 'CREATE_ISSUE':
      return createIssue(action.config);

    case 'UPDATE_CODE':
      return updateCode(action.config);

    case 'RUN_TEST':
      return runTests(action.config);

    case 'DEPLOY':
      return deploy(action.config);

    case 'SEND_EMAIL':
      return sendEmail(action.config);

    case 'WEBHOOK_CALL':
      return callWebhook(action.config);

    case 'LOG_EVENT':
      return logEvent(action.config);

    default:
      throw new Error(`Unknown action type: ${action.type}`);
  }
}

/**
 * Action implementations
 */
async function sendNotification(config) {
  // Mock implementation
  return { channel: config.channel, message: config.message };
}

async function createIssue(config) {
  // Mock implementation
  return { issueId: `ISSUE-${Date.now()}`, ...config };
}

async function updateCode(config) {
  // Mock implementation
  return { find: config.find, replace: config.replace, applied: true };
}

async function runTests(config) {
  // Mock implementation
  return { suite: config.suite, passed: true, tests: 42 };
}

async function deploy(config) {
  // Mock implementation
  return { environment: config.environment, branch: config.branch, deployed: true };
}

async function sendEmail(config) {
  // Mock implementation
  return { to: config.to, subject: config.subject, sent: true };
}

async function callWebhook(config) {
  try {
    const response = await fetch(config.url, {
      method: config.method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config.payload)
    });
    return { status: response.status, ok: response.ok };
  } catch (error) {
    throw new Error(`Webhook call failed: ${error.message}`);
  }
}

async function logEvent(config) {
  // Mock implementation
  return { category: config.category, message: config.message, logged: true };
}

/**
 * Save workflow
 */
export function saveWorkflow(workflow) {
  const key = 'appforge_custom_workflows';
  const workflows = JSON.parse(localStorage.getItem(key) || '[]');
  
  const existing = workflows.findIndex(w => w.id === workflow.id);
  if (existing >= 0) {
    workflows[existing] = workflow;
  } else {
    workflows.push(workflow);
  }
  
  localStorage.setItem(key, JSON.stringify(workflows));
  return workflow;
}

/**
 * Get workflows
 */
export function getWorkflows() {
  return JSON.parse(localStorage.getItem('appforge_custom_workflows') || '[]');
}

/**
 * Delete workflow
 */
export function deleteWorkflow(workflowId) {
  const key = 'appforge_custom_workflows';
  let workflows = JSON.parse(localStorage.getItem(key) || '[]');
  workflows = workflows.filter(w => w.id !== workflowId);
  localStorage.setItem(key, JSON.stringify(workflows));
}
