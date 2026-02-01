/**
 * Team Service
 * Handles team collaboration with AppForge backend
 */

import appforgeClient from '../appforgeClient';

export const teamService = {
  /**
   * Get all user teams
   */
  async getTeams() {
    try {
      const response = await appforgeClient.get('/teams');
      return {
        success: true,
        teams: response.data.teams || response.data
      };
    } catch (error) {
      return {
        success: false,
        teams: [],
        error: error.response?.data?.message || 'Failed to fetch teams'
      };
    }
  },

  /**
   * Get a specific team
   */
  async getTeam(teamId) {
    try {
      const response = await appforgeClient.get(`/teams/${teamId}`);
      return {
        success: true,
        team: response.data.team || response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch team'
      };
    }
  },

  /**
   * Create a new team
   */
  async createTeam(teamData) {
    try {
      const response = await appforgeClient.post('/teams', {
        name: teamData.name,
        description: teamData.description,
        settings: teamData.settings
      });

      return {
        success: true,
        team: response.data.team || response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to create team'
      };
    }
  },

  /**
   * Update team
   */
  async updateTeam(teamId, updates) {
    try {
      const response = await appforgeClient.put(`/teams/${teamId}`, updates);
      return {
        success: true,
        team: response.data.team || response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to update team'
      };
    }
  },

  /**
   * Delete team
   */
  async deleteTeam(teamId) {
    try {
      await appforgeClient.delete(`/teams/${teamId}`);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to delete team'
      };
    }
  },

  /**
   * Get team members
   */
  async getTeamMembers(teamId) {
    try {
      const response = await appforgeClient.get(`/teams/${teamId}/members`);
      return {
        success: true,
        members: response.data.members || response.data
      };
    } catch (error) {
      return {
        success: false,
        members: [],
        error: error.response?.data?.message || 'Failed to fetch members'
      };
    }
  },

  /**
   * Invite team member
   */
  async inviteTeamMember(teamId, email, role = 'member') {
    try {
      const response = await appforgeClient.post(`/teams/${teamId}/invite`, {
        email,
        role
      });

      return {
        success: true,
        invitation: response.data.invitation || response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to send invitation'
      };
    }
  },

  /**
   * Update member role
   */
  async updateMemberRole(teamId, memberId, newRole) {
    try {
      const response = await appforgeClient.put(
        `/teams/${teamId}/members/${memberId}`,
        { role: newRole }
      );

      return {
        success: true,
        member: response.data.member || response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to update role'
      };
    }
  },

  /**
   * Remove team member
   */
  async removeMember(teamId, memberId) {
    try {
      await appforgeClient.delete(`/teams/${teamId}/members/${memberId}`);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to remove member'
      };
    }
  },

  /**
   * Get team activity
   */
  async getTeamActivity(teamId, options = {}) {
    try {
      const params = new URLSearchParams();
      if (options.limit) params.append('limit', options.limit);
      if (options.offset) params.append('offset', options.offset);

      const response = await appforgeClient.get(
        `/teams/${teamId}/activity?${params.toString()}`
      );

      return {
        success: true,
        activities: response.data.activities || response.data
      };
    } catch (error) {
      return {
        success: false,
        activities: [],
        error: error.response?.data?.message || 'Failed to fetch activity'
      };
    }
  },

  /**
   * Get team permissions
   */
  async getTeamPermissions(teamId) {
    try {
      const response = await appforgeClient.get(`/teams/${teamId}/permissions`);
      return {
        success: true,
        permissions: response.data.permissions || response.data
      };
    } catch (error) {
      return {
        success: false,
        permissions: [],
        error: error.response?.data?.message || 'Failed to fetch permissions'
      };
    }
  },

  /**
   * Update team permissions
   */
  async updateTeamPermissions(teamId, permissions) {
    try {
      const response = await appforgeClient.put(
        `/teams/${teamId}/permissions`,
        { permissions }
      );

      return {
        success: true,
        permissions: response.data.permissions || response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to update permissions'
      };
    }
  }
};

export default teamService;
