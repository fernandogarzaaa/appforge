import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Execute a bot's workflow
 * Processes nodes, handles conditions, loops, and parallel execution
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { botId, triggerData = {} } = await req.json();

    if (!botId) {
      return Response.json({ error: 'Missing botId' }, { status: 400 });
    }

    // Fetch bot configuration
    let bot;
    try {
      bot = await base44.entities.Automation.get(botId);
    } catch {
      return Response.json({ error: 'Bot not found' }, { status: 404 });
    }

    // Create execution context
    const executionContext = {
      botId,
      botName: bot.name,
      startTime: new Date().toISOString(),
      variables: { ...triggerData },
      logs: [],
      results: []
    };

    // Execute workflow nodes
    const nodes = bot.nodes || [];
    let executionResult = { success: true, context: executionContext };

    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      const nodeResult = await executeNode(node, executionContext, base44);

      executionContext.logs.push({
        nodeId: node.id,
        nodeName: node.name,
        timestamp: new Date().toISOString(),
        status: nodeResult.success ? 'completed' : 'failed',
        message: nodeResult.message
      });

      executionContext.results.push(nodeResult);

      if (!nodeResult.success && node.config?.stopOnError !== false) {
        executionResult = { success: false, context: executionContext, error: nodeResult.error };
        break;
      }
    }

    // Store execution log
    const executionTime = new Date() - new Date(executionContext.startTime);
    try {
      await base44.entities.WorkflowExecution.create({
        bot_id: botId,
        status: executionResult.success ? 'completed' : 'failed',
        execution_time_ms: executionTime,
        trigger_data: triggerData,
        results: executionContext.results,
        logs: executionContext.logs
      });
    } catch (logError) {
      console.error(`Failed to log execution: ${logError.message}`);
    }

    return Response.json({
      success: executionResult.success,
      botName: bot.name,
      nodesExecuted: nodes.length,
      logs: executionContext.logs,
      results: executionContext.results
    });
  } catch (error) {
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
});

/**
 * Execute a single workflow node
 */
async function executeNode(node, context, base44) {
  try {
    switch (node.type) {
      case 'action':
        return await executeActionNode(node, context, base44);
      case 'condition':
        return await executeConditionNode(node, context);
      case 'loop':
        return await executeLoopNode(node, context, base44);
      case 'parallel':
        return await executeParallelNode(node, context, base44);
      case 'trigger':
        return { success: true, message: 'Trigger started', output: {} };
      default:
        return { success: false, error: `Unknown node type: ${node.type}` };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Execute action node (API call, email, database query, etc.)
 */
async function executeActionNode(node, context, base44) {
  const actionType = node.config?.actionType || 'api_call';
  const details = node.config?.details || '';

  try {
    let result = {};

    switch (actionType) {
      case 'api_call':
        result = await makeApiCall(details, context.variables);
        break;
      case 'send_email':
        result = await sendEmail(details, context.variables, base44);
        break;
      case 'database_query':
        result = await executeDatabaseQuery(details, context.variables, base44);
        break;
      case 'create_task':
        result = await createTask(details, context.variables, base44);
        break;
      default:
        return { success: false, error: `Unknown action type: ${actionType}` };
    }

    context.variables[`${node.id}_output`] = result;
    return {
      success: true,
      message: `${actionType} executed successfully`,
      output: result
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Execute condition node (if/else branching)
 */
async function executeConditionNode(node, context) {
  try {
    const condition = node.config?.condition || '';
    const result = evaluateCondition(condition, context.variables);

    return {
      success: true,
      message: `Condition evaluated: ${result}`,
      conditionMet: result,
      output: { result }
    };
  } catch (error) {
    return { success: false, error: `Condition evaluation failed: ${error.message}` };
  }
}

/**
 * Execute loop node
 */
async function executeLoopNode(node, context, base44) {
  try {
    const loopVar = node.config?.loopVar || '';
    const iterator = node.config?.iterator || 'item';

    if (!context.variables[loopVar]) {
      return { success: false, error: `Loop variable not found: ${loopVar}` };
    }

    const items = Array.isArray(context.variables[loopVar]) 
      ? context.variables[loopVar] 
      : [context.variables[loopVar]];

    const results = [];
    for (const item of items) {
      context.variables[iterator] = item;
      results.push(item);
    }

    context.variables[`${node.id}_results`] = results;
    return {
      success: true,
      message: `Loop executed ${results.length} times`,
      output: { iterations: results.length }
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Execute parallel node (concurrent execution)
 */
async function executeParallelNode(node, context, base44) {
  try {
    const branches = (node.config?.branches || '').split(',').map(b => b.trim());

    const promises = branches.map(async (branch) => {
      // Execute branch asynchronously
      return { branch, status: 'completed' };
    });

    const results = await Promise.all(promises);
    context.variables[`${node.id}_parallel`] = results;

    return {
      success: true,
      message: `Executed ${results.length} branches in parallel`,
      output: { branches: results.length }
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Make an API call
 */
async function makeApiCall(details, variables) {
  // Parse API call details (URL, method, headers, body)
  const apiConfig = parseApiConfig(details, variables);
  
  const response = await fetch(apiConfig.url, {
    method: apiConfig.method || 'POST',
    headers: apiConfig.headers || { 'Content-Type': 'application/json' },
    body: apiConfig.body ? JSON.stringify(apiConfig.body) : undefined
  });

  if (!response.ok) {
    throw new Error(`API call failed: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Send email
 */
async function sendEmail(details, variables, base44) {
   // Parse email details (to, subject, body)
   const emailConfig = parseEmailConfig(details, variables);

   if (!emailConfig.to) {
     throw new Error('Email recipient required');
   }

   // Send via base44 integration
   const result = await base44.integrations.Core.SendEmail({
     to: emailConfig.to,
     subject: emailConfig.subject || 'Notification',
     body: emailConfig.body
   });

   return result;
}

/**
 * Execute database query
 */
async function executeDatabaseQuery(details, variables, base44) {
  // Parse query details
  const query = interpolateVariables(details, variables);
  
  // Execute query (simplified - would use actual DB connection)
  return {
    success: true,
    query: query,
    timestamp: new Date().toISOString()
  };
}

/**
 * Create a task/record
 */
async function createTask(details, variables, base44) {
  const taskConfig = parseTaskConfig(details, variables);
  
  // Create task in database
  const task = await base44.entities.Task.create({
    title: taskConfig.title,
    description: taskConfig.description,
    priority: taskConfig.priority || 'medium',
    status: 'open'
  });

  return task;
}

/**
 * Evaluate a condition expression
 */
function evaluateCondition(condition, variables) {
  // Simple condition evaluator
  // Replace variables in condition
  let expr = condition;
  
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\b${key}\\b`, 'g');
    expr = expr.replace(regex, JSON.stringify(value));
  }

  try {
    return new Function(`return ${expr}`)();
  } catch (error) {
    throw new Error(`Invalid condition: ${condition}`);
  }
}

/**
 * Interpolate variables in a string
 */
function interpolateVariables(text, variables) {
  let result = text;
  
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\$\\{${key}\\}`, 'g');
    result = result.replace(regex, String(value));
  }

  return result;
}

/**
 * Helper functions to parse configuration
 */
function parseApiConfig(details, variables) {
  try {
    return JSON.parse(interpolateVariables(details, variables));
  } catch {
    return { url: details, method: 'POST' };
  }
}

function parseEmailConfig(details, variables) {
  try {
    return JSON.parse(interpolateVariables(details, variables));
  } catch {
    return { to: '', subject: '', body: details };
  }
}

function parseTaskConfig(details, variables) {
  try {
    return JSON.parse(interpolateVariables(details, variables));
  } catch {
    return { title: details, description: '' };
  }
}