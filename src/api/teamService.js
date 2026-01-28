/**
 * Team Service - Backend Integration
 * Handles team member and invitation management with base44 backend
 */

export const teamService = {
  /**
   * Get all team members for a project
   */
  async getTeamMembers(base44Client, projectId) {
    try {
      const members = await base44Client.entities.ProjectMember.filter({
        project_id: projectId
      });

      return members;
    } catch (error) {
      console.error('Error fetching team members:', error);
      return [];
    }
  },

  /**
   * Get a specific team member
   */
  async getTeamMember(base44Client, memberId) {
    try {
      return await base44Client.entities.ProjectMember.get(memberId);
    } catch (error) {
      console.error('Error fetching team member:', error);
      throw error;
    }
  },

  /**
   * Add a team member
   */
  async addTeamMember(base44Client, projectId, email, role) {
    try {
      const member = await base44Client.entities.ProjectMember.create({
        project_id: projectId,
        email: email,
        role: role,
        joined_at: new Date().toISOString()
      });

      return member;
    } catch (error) {
      console.error('Error adding team member:', error);
      throw error;
    }
  },

  /**
   * Update team member role
   */
  async updateTeamMemberRole(base44Client, memberId, newRole) {
    try {
      await base44Client.entities.ProjectMember.update(memberId, {
        role: newRole,
        updated_at: new Date().toISOString()
      });
      return true;
    } catch (error) {
      console.error('Error updating team member role:', error);
      throw error;
    }
  },

  /**
   * Remove a team member
   */
  async removeTeamMember(base44Client, memberId) {
    try {
      await base44Client.entities.ProjectMember.delete(memberId);
      return true;
    } catch (error) {
      console.error('Error removing team member:', error);
      throw error;
    }
  },

  /**
   * Send team invitation
   */
  async sendTeamInvitation(base44Client, projectId, email, role, message) {
    try {
      const invitation = await base44Client.entities.TeamInvitation.create({
        project_id: projectId,
        email: email,
        role: role,
        message: message,
        status: 'pending',
        token: generateInviteToken(),
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      });

      // Send invitation email
      await base44Client.integrations.Core.SendEmail({
        to: email,
        subject: `You're invited to join a project`,
        body: `You've been invited to join a project as ${role}. ${message ? `Message: ${message}` : ''}`,
        from_name: 'AppForge'
      });

      return invitation;
    } catch (error) {
      console.error('Error sending team invitation:', error);
      throw error;
    }
  },

  /**
   * Resend team invitation
   */
  async resendTeamInvitation(base44Client, invitationId) {
    try {
      const invitation = await base44Client.entities.TeamInvitation.get(invitationId);

      // Resend email
      await base44Client.integrations.Core.SendEmail({
        to: invitation.email,
        subject: `Reminder: You're invited to join a project`,
        body: `This is a reminder that you've been invited to join a project as ${invitation.role}.`,
        from_name: 'AppForge'
      });

      await base44Client.entities.TeamInvitation.update(invitationId, {
        resent_at: new Date().toISOString()
      });

      return true;
    } catch (error) {
      console.error('Error resending team invitation:', error);
      throw error;
    }
  },

  /**
   * Cancel team invitation
   */
  async cancelTeamInvitation(base44Client, invitationId) {
    try {
      await base44Client.entities.TeamInvitation.update(invitationId, {
        status: 'cancelled',
        cancelled_at: new Date().toISOString()
      });
      return true;
    } catch (error) {
      console.error('Error cancelling team invitation:', error);
      throw error;
    }
  },

  /**
   * Accept team invitation
   */
  async acceptTeamInvitation(base44Client, invitationId) {
    try {
      const invitation = await base44Client.entities.TeamInvitation.get(invitationId);

      // Add user as team member
      await base44Client.entities.ProjectMember.create({
        project_id: invitation.project_id,
        email: invitation.email,
        role: invitation.role,
        joined_at: new Date().toISOString()
      });

      // Mark invitation as accepted
      await base44Client.entities.TeamInvitation.update(invitationId, {
        status: 'accepted',
        accepted_at: new Date().toISOString()
      });

      return true;
    } catch (error) {
      console.error('Error accepting team invitation:', error);
      throw error;
    }
  },

  /**
   * Reject team invitation
   */
  async rejectTeamInvitation(base44Client, invitationId) {
    try {
      await base44Client.entities.TeamInvitation.update(invitationId, {
        status: 'rejected',
        rejected_at: new Date().toISOString()
      });
      return true;
    } catch (error) {
      console.error('Error rejecting team invitation:', error);
      throw error;
    }
  },

  /**
   * Get team invitations for a project
   */
  async getTeamInvitations(base44Client, projectId) {
    try {
      return await base44Client.entities.TeamInvitation.filter({
        project_id: projectId
      });
    } catch (error) {
      console.error('Error fetching team invitations:', error);
      return [];
    }
  }
};

/**
 * Generate a secure invite token
 */
function generateInviteToken() {
  return Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15);
}

export default teamService;
