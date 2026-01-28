import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as teams from '@/utils/teamCollaboration';

describe('Team Collaboration System', () => {
  let testTeamId;

  beforeEach(() => {
    // Clear state before each test
    localStorage.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('createTeam', () => {
    it('should create a team', () => {
      const team = teams.createTeam('Engineering', 'Product engineering team');
      
      expect(team).toBeDefined();
      expect(team.name).toBe('Engineering');
      expect(team.description).toBe('Product engineering team');
      expect(team.id).toBeDefined();
      expect(team.createdAt).toBeDefined();
      
      testTeamId = team.id;
    });

    it('should generate unique team IDs', () => {
      const team1 = teams.createTeam('Team 1');
      const team2 = teams.createTeam('Team 2');

      expect(team1.id).not.toBe(team2.id);
    });

    it('should initialize with owner member', () => {
      const team = teams.createTeam('Test Team');
      const members = teams.getTeamMembers(team.id);

      expect(members).toBeDefined();
      expect(members.length).toBeGreaterThan(0);
    });
  });

  describe('inviteTeamMember', () => {
    it('should invite a member to team', () => {
      const team = teams.createTeam('Test Team');
      const invitation = teams.inviteTeamMember(team.id, 'user@example.com', 'editor');

      expect(invitation).toBeDefined();
      expect(invitation.email).toBe('user@example.com');
      expect(invitation.role).toBe('editor');
      expect(invitation.status).toBe('pending');
    });

    it('should set 7-day expiry', () => {
      const team = teams.createTeam('Test Team');
      const invitation = teams.inviteTeamMember(team.id, 'user@example.com', 'viewer');

      const expiryTime = new Date(invitation.expiresAt).getTime();
      const createdTime = new Date(invitation.createdAt).getTime();
      const sevenDays = 7 * 24 * 60 * 60 * 1000;

      expect(expiryTime - createdTime).toBeLessThanOrEqual(sevenDays + 1000);
      expect(expiryTime - createdTime).toBeGreaterThan(sevenDays - 1000);
    });

    it('should support different roles', () => {
      const team = teams.createTeam('Test Team');
      const roles = ['viewer', 'editor', 'admin'];

      roles.forEach(role => {
        const invitation = teams.inviteTeamMember(
          team.id,
          `user${role}@example.com`,
          role
        );
        expect(invitation.role).toBe(role);
      });
    });
  });

  describe('acceptTeamInvitation', () => {
    it('should accept invitation', () => {
      const team = teams.createTeam('Test Team');
      const invitation = teams.inviteTeamMember(team.id, 'newuser@example.com', 'editor');

      const result = teams.acceptTeamInvitation(team.id, invitation.id);
      expect(result).toBe(true);
    });

    it('should add member to team after accepting', () => {
      const team = teams.createTeam('Test Team');
      const invitation = teams.inviteTeamMember(team.id, 'newuser@example.com', 'editor');
      const initialCount = teams.getTeamMembers(team.id).length;

      teams.acceptTeamInvitation(team.id, invitation.id);
      const newCount = teams.getTeamMembers(team.id).length;

      expect(newCount).toBeGreaterThan(initialCount);
    });

    it('should set member role from invitation', () => {
      const team = teams.createTeam('Test Team');
      const invitation = teams.inviteTeamMember(team.id, 'admin@example.com', 'admin');

      teams.acceptTeamInvitation(team.id, invitation.id);
      const member = teams.getTeamMember(team.id, invitation.id);

      expect(member?.role).toBe('admin');
    });
  });

  describe('updateMemberRole', () => {
    it('should update member role', () => {
      const team = teams.createTeam('Test Team');
      const invitation = teams.inviteTeamMember(team.id, 'user@example.com', 'editor');
      teams.acceptTeamInvitation(team.id, invitation.id);

      const member = teams.getTeamMembers(team.id).find(m => m.email === 'user@example.com');
      teams.updateMemberRole(team.id, member.id, 'admin');

      const updated = teams.getTeamMember(team.id, member.id);
      expect(updated?.role).toBe('admin');
    });

    it('should support all role transitions', () => {
      const team = teams.createTeam('Test Team');
      const invitation = teams.inviteTeamMember(team.id, 'user@example.com', 'viewer');
      teams.acceptTeamInvitation(team.id, invitation.id);

      const member = teams.getTeamMembers(team.id).find(m => m.email === 'user@example.com');
      const roles = ['viewer', 'editor', 'admin'];

      roles.forEach(role => {
        teams.updateMemberRole(team.id, member.id, role);
        const updated = teams.getTeamMember(team.id, member.id);
        expect(updated?.role).toBe(role);
      });
    });
  });

  describe('removeTeamMember', () => {
    it('should remove member from team', () => {
      const team = teams.createTeam('Test Team');
      const invitation = teams.inviteTeamMember(team.id, 'user@example.com', 'editor');
      teams.acceptTeamInvitation(team.id, invitation.id);

      const initialCount = teams.getTeamMembers(team.id).length;
      const member = teams.getTeamMembers(team.id).find(m => m.email === 'user@example.com');

      teams.removeTeamMember(team.id, member.id);
      const newCount = teams.getTeamMembers(team.id).length;

      expect(newCount).toBeLessThan(initialCount);
    });

    it('should not find removed member', () => {
      const team = teams.createTeam('Test Team');
      const invitation = teams.inviteTeamMember(team.id, 'user@example.com', 'editor');
      teams.acceptTeamInvitation(team.id, invitation.id);

      const member = teams.getTeamMembers(team.id).find(m => m.email === 'user@example.com');
      teams.removeTeamMember(team.id, member.id);

      const found = teams.getTeamMember(team.id, member.id);
      expect(found).toBeNull();
    });
  });

  describe('getTeamMembers', () => {
    it('should return all team members', () => {
      const team = teams.createTeam('Test Team');
      const invitation1 = teams.inviteTeamMember(team.id, 'user1@example.com', 'editor');
      const invitation2 = teams.inviteTeamMember(team.id, 'user2@example.com', 'viewer');

      teams.acceptTeamInvitation(team.id, invitation1.id);
      teams.acceptTeamInvitation(team.id, invitation2.id);

      const members = teams.getTeamMembers(team.id);
      expect(members.length).toBeGreaterThanOrEqual(2);
    });

    it('should not include removed members', () => {
      const team = teams.createTeam('Test Team');
      const invitation = teams.inviteTeamMember(team.id, 'user@example.com', 'editor');
      teams.acceptTeamInvitation(team.id, invitation.id);

      const member = teams.getTeamMembers(team.id).find(m => m.email === 'user@example.com');
      teams.removeTeamMember(team.id, member.id);

      const updated = teams.getTeamMembers(team.id);
      expect(updated.find(m => m.email === 'user@example.com')).toBeUndefined();
    });
  });

  describe('hasMemberPermission', () => {
    it('should check owner permissions', () => {
      const team = teams.createTeam('Test Team');
      const owner = teams.getTeamMembers(team.id)[0];

      expect(teams.hasMemberPermission(team.id, owner.id, 'manage_team')).toBe(true);
      expect(teams.hasMemberPermission(team.id, owner.id, 'view_team')).toBe(true);
    });

    it('should check editor permissions', () => {
      const team = teams.createTeam('Test Team');
      const invitation = teams.inviteTeamMember(team.id, 'user@example.com', 'editor');
      teams.acceptTeamInvitation(team.id, invitation.id);

      const member = teams.getTeamMembers(team.id).find(m => m.email === 'user@example.com');
      expect(teams.hasMemberPermission(team.id, member.id, 'view_team')).toBe(true);
    });

    it('should check viewer permissions', () => {
      const team = teams.createTeam('Test Team');
      const invitation = teams.inviteTeamMember(team.id, 'user@example.com', 'viewer');
      teams.acceptTeamInvitation(team.id, invitation.id);

      const member = teams.getTeamMembers(team.id).find(m => m.email === 'user@example.com');
      expect(teams.hasMemberPermission(team.id, member.id, 'manage_team')).toBe(false);
    });
  });

  describe('Team Events', () => {
    it('should emit team creation event', (done) => {
      const unsubscribe = teams.onTeamEvent('team_created', (event) => {
        expect(event.teamId).toBeDefined();
        expect(event.teamName).toBeDefined();
        unsubscribe();
        done();
      });

      teams.createTeam('Event Test Team');
    });

    it('should emit member added event', (done) => {
      const team = teams.createTeam('Test Team');

      const unsubscribe = teams.onMemberEvent('member_added', (event) => {
        expect(event.memberId).toBeDefined();
        unsubscribe();
        done();
      });

      const invitation = teams.inviteTeamMember(team.id, 'user@example.com', 'editor');
      teams.acceptTeamInvitation(team.id, invitation.id);
    });

    it('should emit member removed event', (done) => {
      const team = teams.createTeam('Test Team');
      const invitation = teams.inviteTeamMember(team.id, 'user@example.com', 'editor');
      teams.acceptTeamInvitation(team.id, invitation.id);

      const unsubscribe = teams.onMemberEvent('member_removed', (event) => {
        expect(event.memberId).toBeDefined();
        unsubscribe();
        done();
      });

      const member = teams.getTeamMembers(team.id).find(m => m.email === 'user@example.com');
      teams.removeTeamMember(team.id, member.id);
    });
  });

  describe('Team Settings', () => {
    it('should have default settings', () => {
      const team = teams.createTeam('Test Team');
      expect(team.settings).toBeDefined();
    });

    it('should preserve settings on team creation', () => {
      const team = teams.createTeam('Test Team', 'Description');
      const retrieved = teams.getTeam(team.id);

      expect(retrieved.settings).toBeDefined();
    });
  });
});
