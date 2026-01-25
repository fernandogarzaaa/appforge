import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { nodes, initialContext = {} } = await req.json();

    if (!nodes || nodes.length === 0) {
      return Response.json({ error: 'No nodes to execute' }, { status: 400 });
    }

    let context = { ...initialContext };
    const executionLog = [];

    // Build node map for quick lookup
    const nodeMap = nodes.reduce((map, node) => {
      map[node.id] = node;
      return map;
    }, {});

    async function executeNode(nodeId) {
      const node = nodeMap[nodeId];
      if (!node) throw new Error(`Node ${nodeId} not found`);

      executionLog.push({ nodeId, type: node.type, timestamp: new Date().toISOString() });

      switch (node.type) {
        case 'condition':
          return executeCondition(node, context);

        case 'loop':
          return executeLoop(node, context, executeNode);

        case 'parallel':
          return executeParallel(node, context, executeNode);

        case 'api_call':
          return await executeApiCall(node, context);

        case 'database_query':
          return await executeDatabaseQuery(node, context, base44);

        case 'data_transform':
          return executeDataTransform(node, context);

        case 'filter':
          return executeFilter(node, context);

        case 'delay':
          return await executeDelay(node);

        default:
          return context;
      }
    }

    function executeCondition(node, ctx) {
      const { conditions, elseNodeId } = node.config;
      
      for (const condition of conditions || []) {
        const fieldValue = getNestedValue(ctx, condition.field);
        const condValue = condition.value;

        if (evaluateCondition(fieldValue, condition.operator, condValue)) {
          if (condition.thenNodeId) {
            return executeNode(condition.thenNodeId);
          }
          return ctx;
        }
      }

      if (elseNodeId) {
        return executeNode(elseNodeId);
      }
      return ctx;
    }

    async function executeLoop(node, ctx, executor) {
      const { arrayField, itemVariableName, loopNodeId, maxIterations } = node.config;
      const array = getNestedValue(ctx, arrayField) || [];
      
      let loopContext = ctx;
      const iterations = Math.min(array.length, maxIterations || 1000);

      for (let i = 0; i < iterations; i++) {
        loopContext = {
          ...loopContext,
          [itemVariableName]: array[i],
          __loopIndex: i
        };

        if (loopNodeId) {
          loopContext = await executor(loopNodeId);
        }
      }

      return loopContext;
    }

    async function executeParallel(node, ctx, executor) {
      const { paths } = node.config;
      const promises = (paths || [])
        .filter(p => p.nodeId)
        .map(p => executor(p.nodeId));

      await Promise.all(promises);
      return ctx;
    }

    async function executeApiCall(node, ctx) {
      const { method, url, headers = {}, body, responseVariableName } = node.config;
      
      // Interpolate context variables in URL
      const interpolatedUrl = url.replace(/\{(\w+)\}/g, (match, key) => {
        return getNestedValue(ctx, key) || match;
      });

      const options = {
        method,
        headers: { 'Content-Type': 'application/json', ...headers }
      };

      if (body) {
        options.body = typeof body === 'string' ? body : JSON.stringify(body);
      }

      const response = await fetch(interpolatedUrl, options);
      const data = await response.json();

      return {
        ...ctx,
        [responseVariableName || 'apiResponse']: data,
        __lastStatusCode: response.status
      };
    }

    async function executeDatabaseQuery(node, ctx, base44Client) {
      const { entityName, operation, filter, data, variableName } = node.config;
      
      if (!entityName) throw new Error('Entity name required for database query');

      let result;
      const entity = base44Client.entities[entityName];

      if (!entity) throw new Error(`Entity ${entityName} not found`);

      switch (operation) {
        case 'list':
          result = await entity.list();
          break;
        case 'filter':
          result = await entity.filter(filter || {});
          break;
        case 'create':
          result = await entity.create(data || {});
          break;
        case 'update':
          if (filter?.id) {
            result = await entity.update(filter.id, data || {});
          }
          break;
        case 'delete':
          if (filter?.id) {
            result = await entity.delete(filter.id);
          }
          break;
      }

      return {
        ...ctx,
        [variableName || 'dbResult']: result
      };
    }

    function executeDataTransform(node, ctx) {
      const { sourceVariable, transformations = [], outputVariable } = node.config;
      let value = getNestedValue(ctx, sourceVariable);

      for (const trans of transformations) {
        value = applyTransformation(value, trans.type, trans.params);
      }

      return {
        ...ctx,
        [outputVariable || 'transformed']: value
      };
    }

    function executeFilter(node, ctx) {
      const { arrayVariable, conditions, outputVariable } = node.config;
      const array = getNestedValue(ctx, arrayVariable) || [];

      const filtered = array.filter(item => {
        return (conditions || []).every(cond => {
          const itemValue = getNestedValue(item, cond.field);
          return evaluateCondition(itemValue, cond.operator, cond.value);
        });
      });

      return {
        ...ctx,
        [outputVariable || 'filtered']: filtered
      };
    }

    async function executeDelay(node) {
      const { duration, unit = 'seconds' } = node.config;
      let ms = duration * 1000;
      if (unit === 'minutes') ms = duration * 60 * 1000;
      if (unit === 'hours') ms = duration * 60 * 60 * 1000;

      await new Promise(resolve => setTimeout(resolve, ms));
      return ctx;
    }

    function applyTransformation(value, type, params = {}) {
      switch (type) {
        case 'format_date':
          return new Date(value).toISOString();
        case 'calculate':
          return eval(params.expression?.replace(/\{(\w+)\}/g, (m, k) => getNestedValue(context, k)));
        case 'concatenate':
          const parts = params.parts || [];
          return parts.join(params.separator || '');
        case 'extract':
          return new RegExp(params.pattern || '').exec(value)?.[0];
        case 'uppercase':
          return String(value).toUpperCase();
        case 'lowercase':
          return String(value).toLowerCase();
        case 'trim':
          return String(value).trim();
        case 'round':
          return Math.round(value * Math.pow(10, params.decimalPlaces || 0)) / Math.pow(10, params.decimalPlaces || 0);
        default:
          return value;
      }
    }

    function evaluateCondition(fieldValue, operator, condValue) {
      switch (operator) {
        case 'equals': return fieldValue == condValue;
        case 'notEquals': return fieldValue != condValue;
        case 'greaterThan': return fieldValue > condValue;
        case 'lessThan': return fieldValue < condValue;
        case 'greaterOrEqual': return fieldValue >= condValue;
        case 'lessOrEqual': return fieldValue <= condValue;
        case 'contains': return String(fieldValue).includes(condValue);
        case 'notContains': return !String(fieldValue).includes(condValue);
        case 'startsWith': return String(fieldValue).startsWith(condValue);
        case 'endsWith': return String(fieldValue).endsWith(condValue);
        default: return false;
      }
    }

    function getNestedValue(obj, path) {
      if (!path) return obj;
      return path.split('.').reduce((curr, prop) => curr?.[prop], obj);
    }

    // Execute from first node
    const firstNode = nodes[0];
    await executeNode(firstNode.id);

    return Response.json({
      success: true,
      context,
      executionLog
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});