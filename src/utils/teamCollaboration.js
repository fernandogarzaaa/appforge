/**
 * Team Collaboration System
 * Handles team management, member invitations, roles, and real-time updates
 * 
 * @typedef {Object} TeamMember
 * @property {string} id
 * @property {string} userId
 * @property {string} email
 * @property {string} name
 * @property {'owner'|'admin'|'editor'|'viewer'} role
 * @property {Date} joinedAt
 * @property {Date} lastActive
 * @property {string[]} permissions
 * @property {'active'|'inactive'|'invited'} status
 * 
 * @typedef {Object} Team
 * @property {string} id
 * @property {string} name
 * @property {string} description
 * @property {string} owner
 * @property {TeamMember[]} members
 * @property {Date} createdAt
 * @property {TeamSettings} settings
 * @property {TeamInvitation[]} invitations
 * 
 * @typedef {Object} TeamSettings
 * @property {boolean} public
 * @property {boolean} allowPublicProjects
 * @property {boolean} requireApprovalForMembers
 * @property {'editor'|'viewer'} defaultMemberRole
 * @property {boolean} allowExternalCollaborators
 * 
 * @typedef {Object} TeamInvitation
 * @property {string} id
 * @property {string} email
 * @property {string} role
 * @property {Date} sentAt
 * @property {Date} expiresAt
 * @property {boolean} accepted
 * @property {Date} [acceptedAt]
 */

const teamStore = new Map();
const teamListeners = new Map();
const memberListeners = new Map();
const INIT_KEY = 'appforge:teamCollaboration:init';

const ensureInitialized = () => {
  try {
    if (typeof localStorage === 'undefined') return;
    if (!localStorage.getItem(INIT_KEY)) {
      teamStore.clear();
      teamListeners.clear();
      memberListeners.clear();
      localStorage.setItem(INIT_KEY, 'true');
    }
  } catch (error) {
    // Ignore storage errors (e.g., SSR)
  }
};

/**
 * Create a new team
 */
export const createTeam = (name, description = '', settings = {}) => {
  ensureInitialized();
  const teamId = `team_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const team = {
    id: teamId,
    name,
    description,
    owner: getCurrentUserId(),
    members: [{
      id: `member_${Date.now()}`,
      userId: getCurrentUserId(),
      email: getCurrentUserEmail(),
      name: getCurrentUserName(),
      role: 'owner',
      joinedAt: new Date(),
      lastActive: new Date(),
      permissions: getPermissionsForRole('owner'),
      status: 'active',
    }],
    createdAt: new Date(),
    settings: {
      public: false,
      allowPublicProjects: false,
      requireApprovalForMembers: false,
      defaultMemberRole: 'editor',
      allowExternalCollaborators: true,
      ...settings,
    },
    invitations: [],
  };

  teamStore.set(teamId, team);
  notifyTeamListeners('team_created', {
    teamId: team.id,
    teamName: team.name,
    team,
  });
  
  return team;
};

/**
 * Get team by ID
 */
export const getTeam = (teamId) => {
  ensureInitialized();
  return teamStore.get(teamId);
};

/**
 * Update team settings
 */
export const updateTeamSettings = (teamId, updates) => {
  ensureInitialized();
  const team = teamStore.get(teamId);
  if (!team) throw new Error('Team not found');
  
  team.settings = { ...team.settings, ...updates };
  notifyTeamListeners('team_updated', team);
  
  return team;
};

/**
 * Invite member to team
 */
export const inviteTeamMember = (teamId, email, role = 'editor') => {
  ensureInitialized();
  const team = teamStore.get(teamId);
  if (!team) throw new Error('Team not found');
  
  // Check if user already invited/member
  const existingMember = team.members.find(m => m.email === email);
  if (existingMember) throw new Error('User already in team');
  
  const existingInvitation = team.invitations.find(i => i.email === email);
  if (existingInvitation) throw new Error('Invitation already sent');

  const now = new Date();
  const invitation = {
    id: `invite_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    email,
    role,
    status: 'pending',
    createdAt: now,
    sentAt: now,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    accepted: false,
  };

  team.invitations.push(invitation);
  notifyTeamListeners('member_invited', { teamId, invitation });
  
  return invitation;
};

/**
 * Accept team invitation
 */
export const acceptTeamInvitation = (teamId, invitationId) => {
  ensureInitialized();
  const team = teamStore.get(teamId);
  if (!team) throw new Error('Team not found');
  
  const invitation = team.invitations.find(i => i.id === invitationId);
  if (!invitation) throw new Error('Invitation not found');
  
  if (new Date() > invitation.expiresAt) {
    throw new Error('Invitation expired');
  }

  invitation.accepted = true;
  invitation.status = 'accepted';
  invitation.acceptedAt = new Date();

  // Add member to team
  const member = {
    id: invitation.id,
    userId: getCurrentUserId(),
    email: invitation.email,
    name: getCurrentUserName(),
    role: invitation.role,
    joinedAt: new Date(),
    lastActive: new Date(),
    permissions: getPermissionsForRole(invitation.role),
    status: 'active',
  };

  team.members.push(member);
  notifyMemberListeners(teamId, 'member_added', {
    teamId,
    memberId: member.id,
    member,
  });
  
  return true;
};

/**
 * Update member role
 */
export const updateMemberRole = (teamId, memberId, newRole) => {
  ensureInitialized();
  const team = teamStore.get(teamId);
  if (!team) throw new Error('Team not found');
  
  const member = team.members.find(m => m.id === memberId);
  if (!member) throw new Error('Member not found');
  
  const oldRole = member.role;
  member.role = newRole;
  member.permissions = getPermissionsForRole(newRole);
  
  notifyMemberListeners(teamId, 'member_role_updated', { member, oldRole, newRole });
  
  return member;
};

/**
 * Remove member from team
 */
export const removeTeamMember = (teamId, memberId) => {
  ensureInitialized();
  const team = teamStore.get(teamId);
  if (!team) throw new Error('Team not found');
  
  const memberIndex = team.members.findIndex(m => m.id === memberId);
  if (memberIndex === -1) throw new Error('Member not found');
  
  const member = team.members[memberIndex];
  team.members.splice(memberIndex, 1);
  
  notifyMemberListeners(teamId, 'member_removed', {
    teamId,
    memberId: member.id,
    member,
  });
  
  return member;
};

/**
 * Update member last active timestamp
 */
export const updateMemberActivity = (teamId, memberId) => {
  ensureInitialized();
  const team = teamStore.get(teamId);
  if (!team) return;
  
  const member = team.members.find(m => m.id === memberId);
  if (member) {
    member.lastActive = new Date();
  }
};

/**
 * Get team members
 */
export const getTeamMembers = (teamId) => {
  ensureInitialized();
  const team = teamStore.get(teamId);
  if (!team) return [];
  return team.members;
};

/**
 * Get member by ID
 */
export const getTeamMember = (teamId, memberId) => {
  ensureInitialized();
  const team = teamStore.get(teamId);
  if (!team) return null;
  return team.members.find(m => m.id === memberId) || null;
};

/**
 * Subscribe to team events
 */
export const onTeamEvent = (teamIdOrEventType, eventTypeOrCallback, maybeCallback) => {
  ensureInitialized();
  const isGlobal = typeof eventTypeOrCallback === 'function';
  const eventType = isGlobal ? teamIdOrEventType : eventTypeOrCallback;
  const callback = isGlobal ? eventTypeOrCallback : maybeCallback;
  const key = isGlobal ? `global:${eventType}` : `${teamIdOrEventType}:${eventType}`;
  if (!teamListeners.has(key)) {
    teamListeners.set(key, []);
  }
  teamListeners.get(key).push(callback);

  return () => {
    const callbacks = teamListeners.get(key);
    const index = callbacks.indexOf(callback);
    if (index > -1) callbacks.splice(index, 1);
  };
};

/**
 * Subscribe to member events
 */
export const onMemberEvent = (teamIdOrEventType, eventTypeOrCallback, maybeCallback) => {
  ensureInitialized();
  const isGlobal = typeof eventTypeOrCallback === 'function';
  const eventType = isGlobal ? teamIdOrEventType : eventTypeOrCallback;
  const callback = isGlobal ? eventTypeOrCallback : maybeCallback;
  const key = isGlobal ? `global:member:${eventType}` : `${teamIdOrEventType}:member:${eventType}`;
  if (!memberListeners.has(key)) {
    memberListeners.set(key, []);
  }
  memberListeners.get(key).push(callback);

  return () => {
    const callbacks = memberListeners.get(key);
    const index = callbacks.indexOf(callback);
    if (index > -1) callbacks.splice(index, 1);
  };
};

/**
 * Get permissions for role
 */
function getPermissionsForRole(role) {
  const rolePermissions = {
    owner: [
      'manage_team',
      'view_team',
      'manage_members',
      'manage_projects',
      'manage_settings',
      'delete_team',
      'invite_members',
      'remove_members',
      'change_roles',
      'access_analytics',
      'manage_webhooks',
      'manage_integrations',
    ],
    admin: [
      'view_team',
      'manage_projects',
      'manage_members',
      'invite_members',
      'remove_members',
      'change_roles',
      'access_analytics',
      'manage_webhooks',
    ],
    editor: [
      'create_projects',
      'edit_projects',
      'manage_projects',
      'view_team',
      'invite_members',
      'access_analytics',
    ],
    viewer: [
      'view_team',
      'view_projects',
      'view_analytics',
    ],
  };

  return rolePermissions[role] || [];
}

/**
 * Check if member has permission
 */
export const hasMemberPermission = (teamId, memberId, permission) => {
  ensureInitialized();
  const member = getTeamMember(teamId, memberId);
  if (!member) return false;
  return member.permissions.includes(permission);
};

/**
 * Notify team listeners
 */
function notifyTeamListeners(eventType, data) {
  const globalListeners = teamListeners.get(`global:${eventType}`) || [];
  const wildcardListeners = teamListeners.get('global:*') || [];
  const scopedListeners = teamListeners.get(`${data?.teamId}:${eventType}`) || [];
  [...globalListeners, ...wildcardListeners, ...scopedListeners].forEach(callback => callback(data));
}

/**
 * Notify member listeners
 */
function notifyMemberListeners(teamId, eventType, data) {
  const scoped = memberListeners.get(`${teamId}:member:${eventType}`) || [];
  const global = memberListeners.get(`global:member:${eventType}`) || [];
  const wildcard = memberListeners.get('global:member:*') || [];
  [...scoped, ...global, ...wildcard].forEach(callback => callback(data));
}

/**
 * Mock current user helpers
 */
function getCurrentUserId() {
  return localStorage.getItem('userId') || 'user_' + Date.now();
}

function getCurrentUserEmail() {
  return localStorage.getItem('userEmail') || 'owner@example.com';
}

function getCurrentUserName() {
  return localStorage.getItem('userName') || 'User';
}

export default {
  createTeam,
  getTeam,
  updateTeamSettings,
  inviteTeamMember,
  acceptTeamInvitation,
  updateMemberRole,
  removeTeamMember,
  updateMemberActivity,
  getTeamMembers,
  getTeamMember,
  onTeamEvent,
  onMemberEvent,
  hasMemberPermission,
};
