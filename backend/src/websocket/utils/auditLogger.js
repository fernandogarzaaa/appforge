/**
 * Audit Logger for WebSocket Events
 * Logs important security and operational events
 */

/**
 * Log an audit event
 * @param {string} action - The action being logged
 * @param {object} details - Additional details about the action
 */
export function logAudit(action, details = {}) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    action,
    ...details
  };
  
  // Log to console (in production, send to proper logging service)
  if (process.env.NODE_ENV === 'development') {
    console.log('[AUDIT]', JSON.stringify(logEntry, null, 2));
  } else {
    console.log('[AUDIT]', JSON.stringify(logEntry));
  }
}

export default { logAudit };
