/**
 * Team Backend Service
 * Handles team member and invite operations with base44 backend
 */

import { base44 } from '../base44Client';

export const teamService = {
  /**
   * Fetch all team members for a project
   */
  async getMembers(projectId) {
    try {
      const members = await base44.entities.TeamMember.filter({
        project_id: projectId
      });
      return members;
    } catch (error) {
      console.error('Failed to fetch team members:', error);
      throw error;
    }
  },

  /**
   * Fetch all invites for a project
   */
  async getInvites(projectId) {
    try {
      const invites = await base44.entities.TeamInvite.filter({
        project_id: projectId
      });
      return invites;
    } catch (error) {
      console.error('Failed to fetch invites:', error);
      throw error;
    }
  },

  /**
   * Invite a team member
   */
  async inviteMember(projectId, data) {
    try {
      const invite = await base44.entities.TeamInvite.create({
        project_id: projectId,
        ...data,
        status: 'pending',
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      });
      return invite;
    } catch (error) {
      console.error('Failed to invite team member:', error);
      throw error;
    }
  },

  /**
   * Resend an invitation
   */
  async resendInvite(inviteId) {
    try {
      const updated = await base44.entities.TeamInvite.update(inviteId, {
        resent_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      });
      return updated;
    } catch (error) {
      console.error('Failed to resend invite:', error);
      throw error;
    }
  },

  /**
   * Cancel an invitation
   */
  async cancelInvite(inviteId) {
    try {
      const invite = await base44.entities.TeamInvite.update(inviteId, {
        status: 'cancelled'
      });
      return invite;
    } catch (error) {
      console.error('Failed to cancel invite:', error);
      throw error;
    }
  },

  /**
   * Remove a team member
   */
  async removeMember(projectId, memberId) {
    try {
      await base44.entities.TeamMember.delete(memberId);
      return { success: true };
    } catch (error) {
      console.error('Failed to remove team member:', error);
      throw error;
    }
  },

  /**
   * Update team member role
   */
  async updateMemberRole(projectId, memberId, role) {
    try {
      const member = await base44.entities.TeamMember.update(memberId, { role });
      return member;
    } catch (error) {
      console.error('Failed to update member role:', error);
      throw error;
    }
  }
};

export default teamService;
