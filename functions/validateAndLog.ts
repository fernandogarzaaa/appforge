// Shared validation and logging utility
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

export async function validateInput(data, schema) {
  const errors = [];
  
  if (schema.agentId && (!data.agentId || typeof data.agentId !== 'string' || data.agentId.length < 5)) {
    errors.push('Invalid agentId');
  }
  
  if (schema.userId && (!data.userId || typeof data.userId !== 'string' || !data.userId.includes('@'))) {
    errors.push('Invalid userId');
  }
  
  if (schema.parameters && data.parameters && typeof data.parameters !== 'object') {
    errors.push('Invalid parameters format');
  }
  
  return errors;
}

export async function logAction(base44, userId, actionType, agentId, details, success, errorMsg) {
  try {
    const config = await base44.asServiceRole.entities.CoachingSystemConfig.list();
    if (config.length > 0 && config[0].audit_logging_enabled) {
      await base44.asServiceRole.entities.CoachingAuditLog.create({
        user_id: userId,
        action_type: actionType,
        agent_id: agentId,
        details,
        success,
        error_message: errorMsg,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Audit logging failed:', error);
  }
}

export async function checkRateLimit(base44, userId) {
  try {
    const config = await base44.asServiceRole.entities.CoachingSystemConfig.list();
    if (config.length === 0) return true;
    
    const limit = config[0].rate_limit_per_hour || 10;
    const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
    
    const logs = await base44.asServiceRole.entities.CoachingAuditLog.filter({
      user_id: userId
    });
    
    const recentActions = logs.filter(l => l.timestamp > oneHourAgo);
    return recentActions.length < limit;
  } catch (error) {
    console.error('Rate limit check error:', error);
    return true;
  }
}

export async function getSystemStatus(base44) {
  try {
    const config = await base44.asServiceRole.entities.CoachingSystemConfig.list();
    if (config.length > 0) {
      return config[0];
    }
    return null;
  } catch (error) {
    console.error('Config fetch error:', error);
    return null;
  }
}