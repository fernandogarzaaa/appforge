/**
 * Team Invite Utilities
 * Handles team member invitations and permissions
 */

export const TEAM_ROLES = {
  ADMIN: 'admin',
  DEVELOPER: 'developer',
  VIEWER: 'viewer'
};

export const ROLE_PERMISSIONS = {
  [TEAM_ROLES.ADMIN]: [
    'manage_team',
    'manage_settings',
    'deploy_production',
    'view_all',
    'edit_all',
    'delete_all',
    'manage_billing'
  ],
  [TEAM_ROLES.DEVELOPER]: [
    'deploy_staging',
    'view_all',
    'edit_all',
    'create_projects'
  ],
  [TEAM_ROLES.VIEWER]: [
    'view_all'
  ]
};

export const INVITE_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled'
};

/**
 * Validate email address
 * @param {string} email - Email to validate
 * @returns {object} { isValid, error }
 */
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!email || !email.trim()) {
    return { isValid: false, error: 'Email cannot be empty' };
  }

  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Invalid email address' };
  }

  return { isValid: true, error: null };
};

/**
 * Generate invite link
 * @param {string} inviteId - Invite ID
 * @param {string} baseUrl - Base URL for the application
 * @returns {string} Full invite link
 */
export const generateInviteLink = (inviteId, baseUrl = window.location.origin) => {
  return `${baseUrl}/invite/${inviteId}?token=${generateToken()}`;
};

/**
 * Generate random token
 * @returns {string} Random token
 */
export const generateToken = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

/**
 * Calculate invite expiry date (7 days from now)
 * @returns {Date} Expiry date
 */
export const calculateInviteExpiry = () => {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date;
};

/**
 * Check if invite is expired
 * @param {Date} expiryDate - Invite expiry date
 * @returns {boolean} True if expired
 */
export const isInviteExpired = (expiryDate) => {
  return new Date(expiryDate) < new Date();
};

/**
 * Get role color for display
 * @param {string} role - Team role
 * @returns {string} CSS classes
 */
export const getRoleColor = (role) => {
  switch (role) {
    case TEAM_ROLES.ADMIN:
      return 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300';
    case TEAM_ROLES.DEVELOPER:
      return 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300';
    case TEAM_ROLES.VIEWER:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
  }
};

/**
 * Get invite status color
 * @param {string} status - Invite status
 * @returns {string} CSS classes
 */
export const getInviteStatusColor = (status) => {
  switch (status) {
    case INVITE_STATUS.PENDING:
      return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300';
    case INVITE_STATUS.ACCEPTED:
      return 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300';
    case INVITE_STATUS.REJECTED:
    case INVITE_STATUS.CANCELLED:
      return 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300';
    case INVITE_STATUS.EXPIRED:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
  }
};

/**
 * Create mock team member
 * @param {object} overrides - Override values
 * @returns {object} Mock team member
 */
export const createMockMember = (overrides = {}) => {
  return {
    id: `member_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    email: 'developer@example.com',
    role: TEAM_ROLES.DEVELOPER,
    name: 'Developer User',
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${Math.random()}`,
    joined_at: new Date().toISOString(),
    last_active: new Date(Date.now() - 3600000).toISOString(),
    ...overrides
  };
};

/**
 * Create mock invite
 * @param {object} overrides - Override values
 * @returns {object} Mock invite
 */
export const createMockInvite = (overrides = {}) => {
  return {
    id: `invite_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    email: `user${Math.floor(Math.random() * 1000)}@example.com`,
    role: TEAM_ROLES.DEVELOPER,
    status: INVITE_STATUS.PENDING,
    created_at: new Date().toISOString(),
    expires_at: calculateInviteExpiry().toISOString(),
    invited_by: 'admin@example.com',
    message: 'Welcome to our team!',
    ...overrides
  };
};

/**
 * Generate mock team members
 * @param {number} count - Number of members
 * @returns {Array} Mock team members
 */
export const generateMockTeamMembers = (count = 5) => {
  const names = ['Alice Johnson', 'Bob Smith', 'Carol White', 'David Brown', 'Eva Davis', 'Frank Miller', 'Grace Lee', 'Henry Wilson'];
  const emails = names.map(n => n.toLowerCase().replace(' ', '.') + '@example.com');
  const roles = [TEAM_ROLES.ADMIN, TEAM_ROLES.DEVELOPER, TEAM_ROLES.VIEWER];

  return Array.from({ length: Math.min(count, emails.length) }, (_, i) => {
    return createMockMember({
      email: emails[i],
      name: names[i],
      role: roles[Math.floor(Math.random() * roles.length)]
    });
  });
};

/**
 * Generate mock invites
 * @param {number} count - Number of invites
 * @returns {Array} Mock invites
 */
export const generateMockInvites = (count = 3) => {
  const statuses = [INVITE_STATUS.PENDING, INVITE_STATUS.ACCEPTED, INVITE_STATUS.EXPIRED];
  
  return Array.from({ length: count }, () => {
    return createMockInvite({
      status: statuses[Math.floor(Math.random() * statuses.length)]
    });
  });
};
