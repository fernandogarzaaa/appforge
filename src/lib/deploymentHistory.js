/**
 * Deployment History Utilities
 * Handles deployment tracking, filtering, and status management
 */

export const DEPLOYMENT_STATUS = {
  PENDING: 'pending',
  BUILDING: 'building',
  DEPLOYING: 'deploying',
  SUCCESS: 'success',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  ROLLED_BACK: 'rolled_back'
};

export const DEPLOYMENT_ENVIRONMENTS = {
  DEVELOPMENT: 'development',
  STAGING: 'staging',
  PRODUCTION: 'production'
};

const statusColors = {
  [DEPLOYMENT_STATUS.PENDING]: 'bg-gray-100 text-gray-700',
  [DEPLOYMENT_STATUS.BUILDING]: 'bg-blue-100 text-blue-700',
  [DEPLOYMENT_STATUS.DEPLOYING]: 'bg-cyan-100 text-cyan-700',
  [DEPLOYMENT_STATUS.SUCCESS]: 'bg-green-100 text-green-700',
  [DEPLOYMENT_STATUS.FAILED]: 'bg-red-100 text-red-700',
  [DEPLOYMENT_STATUS.CANCELLED]: 'bg-yellow-100 text-yellow-700',
  [DEPLOYMENT_STATUS.ROLLED_BACK]: 'bg-orange-100 text-orange-700'
};

const statusIcons = {
  [DEPLOYMENT_STATUS.PENDING]: '⏳',
  [DEPLOYMENT_STATUS.BUILDING]: '🔨',
  [DEPLOYMENT_STATUS.DEPLOYING]: '🚀',
  [DEPLOYMENT_STATUS.SUCCESS]: '✅',
  [DEPLOYMENT_STATUS.FAILED]: '❌',
  [DEPLOYMENT_STATUS.CANCELLED]: '⛔',
  [DEPLOYMENT_STATUS.ROLLED_BACK]: '↩️'
};

/**
 * Get deployment status badge color
 * @param {string} status - Deployment status
 * @returns {string} CSS classes for badge
 */
export const getStatusColor = (status) => {
  return statusColors[status] || statusColors[DEPLOYMENT_STATUS.PENDING];
};

/**
 * Get deployment status icon
 * @param {string} status - Deployment status
 * @returns {string} Status icon
 */
export const getStatusIcon = (status) => {
  return statusIcons[status] || '❓';
};

/**
 * Check if deployment can be rolled back
 * @param {object} deployment - Deployment object
 * @returns {boolean} True if rollback is possible
 */
export const canRollback = (deployment) => {
  return deployment.status === DEPLOYMENT_STATUS.SUCCESS && deployment.previous_version;
};

/**
 * Format deployment duration
 * @param {number} seconds - Duration in seconds
 * @returns {string} Formatted duration
 */
export const formatDuration = (seconds) => {
  if (!seconds) return '0s';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const parts = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

  return parts.join(' ');
};

/**
 * Calculate deployment statistics
 * @param {Array} deployments - Array of deployments
 * @returns {object} Statistics object
 */
export const calculateDeploymentStats = (deployments) => {
  const stats = {
    total: deployments.length,
    successful: 0,
    failed: 0,
    pending: 0,
    averageDuration: 0,
    successRate: 0
  };

  let totalDuration = 0;
  let countWithDuration = 0;

  deployments.forEach(d => {
    switch (d.status) {
      case DEPLOYMENT_STATUS.SUCCESS:
        stats.successful++;
        break;
      case DEPLOYMENT_STATUS.FAILED:
      case DEPLOYMENT_STATUS.CANCELLED:
        stats.failed++;
        break;
      case DEPLOYMENT_STATUS.PENDING:
      case DEPLOYMENT_STATUS.BUILDING:
      case DEPLOYMENT_STATUS.DEPLOYING:
        stats.pending++;
        break;
    }

    if (d.duration) {
      totalDuration += d.duration;
      countWithDuration++;
    }
  });

  if (countWithDuration > 0) {
    stats.averageDuration = Math.round(totalDuration / countWithDuration);
  }

  if (stats.total > 0) {
    stats.successRate = Math.round((stats.successful / stats.total) * 100);
  }

  return stats;
};

/**
 * Filter deployments by criteria
 * @param {Array} deployments - Array of deployments
 * @param {object} filters - Filter criteria
 * @returns {Array} Filtered deployments
 */
export const filterDeployments = (deployments, filters = {}) => {
  let filtered = [...deployments];

  if (filters.status && filters.status !== 'all') {
    filtered = filtered.filter(d => d.status === filters.status);
  }

  if (filters.environment && filters.environment !== 'all') {
    filtered = filtered.filter(d => d.environment === filters.environment);
  }

  if (filters.branch) {
    filtered = filtered.filter(d => d.branch && d.branch.includes(filters.branch));
  }

  if (filters.startDate) {
    const start = new Date(filters.startDate).getTime();
    filtered = filtered.filter(d => new Date(d.created_at).getTime() >= start);
  }

  if (filters.endDate) {
    const end = new Date(filters.endDate).getTime();
    filtered = filtered.filter(d => new Date(d.created_at).getTime() <= end);
  }

  return filtered;
};

/**
 * Sort deployments
 * @param {Array} deployments - Array of deployments
 * @param {string} sortBy - Sort field (date, status, duration)
 * @param {string} order - Sort order (asc, desc)
 * @returns {Array} Sorted deployments
 */
export const sortDeployments = (deployments, sortBy = 'date', order = 'desc') => {
  const sorted = [...deployments];

  sorted.sort((a, b) => {
    let aVal, bVal;

    switch (sortBy) {
      case 'date':
        aVal = new Date(a.created_at).getTime();
        bVal = new Date(b.created_at).getTime();
        break;
      case 'duration':
        aVal = a.duration || 0;
        bVal = b.duration || 0;
        break;
      case 'status':
        aVal = a.status;
        bVal = b.status;
        break;
      default:
        return 0;
    }

    if (aVal < bVal) return order === 'asc' ? -1 : 1;
    if (aVal > bVal) return order === 'asc' ? 1 : -1;
    return 0;
  });

  return sorted;
};

/**
 * Create mock deployment for testing
 * @param {object} overrides - Override values
 * @returns {object} Mock deployment
 */
export const createMockDeployment = (overrides = {}) => {
  const timestamp = new Date();
  timestamp.setHours(timestamp.getHours() - Math.random() * 720); // Random time within last 30 days

  const statuses = Object.values(DEPLOYMENT_STATUS);
  const environments = Object.values(DEPLOYMENT_ENVIRONMENTS);

  return {
    id: `deploy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    project_id: 'proj_default',
    status: statuses[Math.floor(Math.random() * statuses.length)],
    environment: environments[Math.floor(Math.random() * environments.length)],
    version: `v${Math.floor(Math.random() * 100)}.${Math.floor(Math.random() * 100)}.${Math.floor(Math.random() * 100)}`,
    branch: Math.random() > 0.5 ? 'main' : 'develop',
    commit_hash: Math.random().toString(36).substr(2, 9),
    commit_message: 'Fixed critical performance issue',
    triggered_by: 'automation',
    created_at: timestamp.toISOString(),
    started_at: new Date(timestamp.getTime() + 30000).toISOString(),
    completed_at: new Date(timestamp.getTime() + 300000).toISOString(),
    duration: Math.floor(Math.random() * 600),
    error_message: Math.random() > 0.85 ? 'Build failed: Module not found' : null,
    previous_version: Math.random() > 0.3 ? `v${Math.floor(Math.random() * 100)}.${Math.floor(Math.random() * 100)}.${Math.floor(Math.random() * 100)}` : null,
    ...overrides
  };
};

/**
 * Generate mock deployment history
 * @param {number} count - Number of deployments to generate
 * @returns {Array} Array of mock deployments
 */
export const generateMockDeploymentHistory = (count = 20) => {
  return Array.from({ length: count }, (_, i) => {
    const timestamp = new Date();
    timestamp.setHours(timestamp.getHours() - i * 2);
    
    return createMockDeployment({
      created_at: timestamp.toISOString()
    });
  });
};
