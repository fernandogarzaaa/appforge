import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Validate bot configuration before saving
 * Checks workflow, triggers, and node configurations
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const botConfig = await req.json();
    const errors = [];
    const warnings = [];

    // Validate basic properties
    if (!botConfig.name || botConfig.name.trim() === '') {
      errors.push('Bot name is required');
    }

    if (!botConfig.trigger || !botConfig.trigger.type) {
      errors.push('Trigger type is required');
    }

    // Validate trigger configuration
    const triggerValidation = validateTriggerConfig(botConfig.trigger);
    if (!triggerValidation.valid) {
      errors.push(...triggerValidation.errors);
    } else if (triggerValidation.warnings) {
      warnings.push(...triggerValidation.warnings);
    }

    // Validate nodes
    if (botConfig.nodes && botConfig.nodes.length === 0) {
      warnings.push('Bot has no workflow nodes');
    }

    const nodeValidation = validateNodes(botConfig.nodes || []);
    if (!nodeValidation.valid) {
      errors.push(...nodeValidation.errors);
    } else if (nodeValidation.warnings) {
      warnings.push(...nodeValidation.warnings);
    }

    return Response.json({
      valid: errors.length === 0,
      errors,
      warnings,
      suggestions: generateSuggestions(botConfig)
    });

  } catch (error) {
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
});

/**
 * Validate trigger configuration
 */
function validateTriggerConfig(trigger) {
  const errors = [];
  const warnings = [];
  
  if (!trigger) {
    return { valid: false, errors: ['Trigger configuration missing'] };
  }

  const { type, config = {} } = trigger;

  switch (type) {
    case 'schedule':
      if (!config.frequency) warnings.push('Schedule frequency not specified');
      break;
      
    case 'webhook':
    case 'api_endpoint':
      if (config.authType && config.authType !== 'none') {
        if (!config.authToken) {
          warnings.push('API authentication configured but no token provided');
        }
      }
      break;
      
    case 'email':
      if (!config.emailAddress) {
        errors.push('Email address required for email trigger');
      }
      break;
      
    case 'entity_change':
      if (!config.entityName) {
        errors.push('Entity name required for entity change trigger');
      }
      break;
      
    case 'database_change':
      if (!config.entity) {
        errors.push('Database entity required for database change trigger');
      }
      break;
      
    case 'file_upload':
      if (!config.directory) {
        errors.push('Directory required for file upload trigger');
      }
      break;
      
    default:
      errors.push(`Unknown trigger type: ${type}`);
  }

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Validate workflow nodes
 */
function validateNodes(nodes) {
  const errors = [];
  const warnings = [];
  const nodeIds = new Set();

  if (nodes.length === 0) {
    return { valid: true, warnings: ['No workflow nodes defined'] };
  }

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];

    // Check for duplicate IDs
    if (nodeIds.has(node.id)) {
      errors.push(`Duplicate node ID: ${node.id}`);
    }
    nodeIds.add(node.id);

    // Validate node properties
    if (!node.id) {
      errors.push(`Node ${i}: Missing ID`);
    }

    if (!node.type) {
      errors.push(`Node ${node.id}: Missing type`);
    }

    // Validate node-specific config
    switch (node.type) {
      case 'action':
        if (!node.config?.actionType) {
          errors.push(`Node ${node.id}: Action type required for action nodes`);
        }
        break;
        
      case 'condition':
        if (!node.config?.condition) {
          errors.push(`Node ${node.id}: Condition expression required`);
        }
        break;
        
      case 'loop':
        if (!node.config?.loopVar) {
          errors.push(`Node ${node.id}: Loop variable required`);
        }
        break;
        
      case 'parallel':
        if (!node.config?.branches) {
          warnings.push(`Node ${node.id}: No parallel branches defined`);
        }
        break;
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Generate suggestions for improvement
 */
function generateSuggestions(botConfig) {
  const suggestions = [];

  // Check for error handling
  const hasConditions = botConfig.nodes?.some(n => n.type === 'condition');
  if (!hasConditions && botConfig.nodes?.length > 1) {
    suggestions.push('Consider adding conditional nodes for error handling');
  }

  // Check for logging
  const hasLogging = botConfig.nodes?.some(n => 
    n.config?.actionType === 'log' || n.config?.details?.includes('log')
  );
  if (!hasLogging) {
    suggestions.push('Consider adding logging nodes for debugging');
  }

  // Check trigger appropriateness
  if (botConfig.trigger?.type === 'schedule' && botConfig.nodes?.some(n => 
    n.config?.actionType === 'send_email'
  )) {
    suggestions.push('This bot sends emails on schedule - ensure recipients have opted in');
  }

  return suggestions;
}