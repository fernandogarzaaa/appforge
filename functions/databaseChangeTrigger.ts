import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Monitor database changes and trigger bots
 * This should be called by entity automations
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { entityName, eventType, entityId, newData, oldData } = await req.json();

    if (!entityName || !eventType) {
      return Response.json(
        { error: 'Missing entityName or eventType' },
        { status: 400 }
      );
    }

    // Find bots configured to monitor this entity
    const bots = await base44.entities.Automation.filter({
      trigger_type: 'database_change'
    });

    const matchingBots = bots.filter(bot => {
      const config = bot.trigger?.config || {};
      
      // Check if this bot monitors the changed entity
      if (config.entity !== entityName) return false;
      
      // Check event type
      if (config.event !== 'all' && config.event !== eventType) return false;
      
      // Check conditions if specified
      if (config.conditions && eventType === 'update') {
        if (!evaluateConditions(config.conditions, newData)) return false;
      }
      
      return true;
    });

    const triggeredBots = [];

    for (const bot of matchingBots) {
      try {
        // Check debounce
        const debounce = parseInt(bot.trigger?.config?.debounce || '0');
        if (debounce > 0) {
          const lastExecution = await getLastExecution(bot.id, base44);
          if (lastExecution && Date.now() - new Date(lastExecution).getTime() < debounce * 1000) {
            continue; // Skip due to debounce
          }
        }

        // Prepare trigger data
        const triggerData = {
          entityName,
          eventType,
          entityId,
          changeType: eventType,
          timestamp: new Date().toISOString(),
          newData: eventType === 'insert' || eventType === 'update' ? newData : null,
          oldData: eventType === 'update' || eventType === 'delete' ? oldData : null
        };

        // Execute bot workflow
        const result = await base44.functions.invoke('executeBotWorkflow', {
          botId: bot.id,
          triggerData
        });

        triggeredBots.push({
          botId: bot.id,
          botName: bot.name,
          success: result.success,
          executedNodes: result.nodesExecuted
        });

        // Create trigger log
        await base44.entities.TriggerLog.create({
          bot_id: bot.id,
          trigger_type: 'database_change',
          entity_name: entityName,
          event_type: eventType,
          entity_id: entityId,
          status: result.success ? 'success' : 'failed',
          logs: result.logs
        });

      } catch (error) {
        console.error(`Failed to trigger bot ${bot.id}: ${error.message}`);
        triggeredBots.push({
          botId: bot.id,
          botName: bot.name,
          success: false,
          error: error.message
        });
      }
    }

    return Response.json({
      success: true,
      entityName,
      eventType,
      botsTriggered: triggeredBots.length,
      bots: triggeredBots
    });

  } catch (error) {
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
});

/**
 * Get last execution time for debounce check
 */
async function getLastExecution(botId, base44) {
  try {
    const executions = await base44.entities.WorkflowExecution.filter(
      { bot_id: botId },
      '-created_date',
      1
    );
    return executions.length > 0 ? executions[0].created_date : null;
  } catch {
    return null;
  }
}

/**
 * Evaluate database conditions
 * Simple condition evaluator for WHERE clause style conditions
 */
function evaluateConditions(conditions, data) {
  try {
    // Parse simple conditions like "status = 'active' AND amount > 1000"
    const conditionParts = conditions.split(/\s+AND\s+/i);
    
    for (const condition of conditionParts) {
      if (!evaluateSingleCondition(condition.trim(), data)) {
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error(`Condition evaluation failed: ${error.message}`);
    return false;
  }
}

/**
 * Evaluate a single condition
 */
function evaluateSingleCondition(condition, data) {
  // Match pattern: field operator value
  // Examples: status = 'active', amount > 1000, count != 0
  const match = condition.match(/^(\w+)\s*(=|!=|>|<|>=|<=)\s*(.+)$/);
  
  if (!match) return false;
  
  const [, field, operator, valueStr] = match;
  const fieldValue = data[field];
  let value = valueStr.trim();
  
  // Parse value (remove quotes if present)
  if ((value.startsWith("'") && value.endsWith("'")) || 
      (value.startsWith('"') && value.endsWith('"'))) {
    value = value.slice(1, -1);
  } else if (!isNaN(value)) {
    value = Number(value);
  }
  
  // Evaluate condition
  switch (operator) {
    case '=': return fieldValue == value;
    case '!=': return fieldValue != value;
    case '>': return fieldValue > value;
    case '<': return fieldValue < value;
    case '>=': return fieldValue >= value;
    case '<=': return fieldValue <= value;
    default: return false;
  }
}