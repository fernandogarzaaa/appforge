import { describe, it, expect } from 'vitest';
import {
  validateEmail,
  calculateInviteExpiry,
  isInviteExpired,
  getRoleColor,
  getInviteStatusColor,
  TEAM_ROLES,
  INVITE_STATUS,
  ROLE_PERMISSIONS
} from '@/lib/teamInvites';

describe('Team Invites Utilities', () => {
  describe('validateEmail', () => {
    it('should accept valid emails', () => {
      const result = validateEmail('user@example.com');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeNull();
    });

    it('should reject empty emails', () => {
      const result = validateEmail('');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('cannot be empty');
    });

    it('should reject invalid email formats', () => {
      const result = validateEmail('not-an-email');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid');
    });

    it('should reject emails without domain', () => {
      const result = validateEmail('user@');
      expect(result.isValid).toBe(false);
    });

    it('should accept emails with plus addressing', () => {
      const result = validateEmail('user+tag@example.com');
      expect(result.isValid).toBe(true);
    });
  });

  describe('calculateInviteExpiry', () => {
    it('should return date 7 days in future', () => {
      const expiry = calculateInviteExpiry();
      const now = new Date();
      const diffDays = Math.floor((expiry - now) / (1000 * 60 * 60 * 24));
      expect(diffDays).toBe(7);
    });
  });

  describe('isInviteExpired', () => {
    it('should identify expired invites', () => {
      const pastDate = new Date(Date.now() - 86400000); // 1 day ago
      expect(isInviteExpired(pastDate)).toBe(true);
    });

    it('should identify valid invites', () => {
      const futureDate = new Date(Date.now() + 86400000); // 1 day in future
      expect(isInviteExpired(futureDate)).toBe(false);
    });
  });

  describe('Role permissions', () => {
    it('should define admin permissions', () => {
      const adminPerms = ROLE_PERMISSIONS[TEAM_ROLES.ADMIN];
      expect(adminPerms).toContain('manage_team');
      expect(adminPerms).toContain('manage_settings');
      expect(adminPerms).toContain('deploy_production');
    });

    it('should define developer permissions', () => {
      const devPerms = ROLE_PERMISSIONS[TEAM_ROLES.DEVELOPER];
      expect(devPerms).toContain('deploy_staging');
      expect(devPerms).toContain('edit_all');
      expect(devPerms).not.toContain('manage_team');
    });

    it('should define viewer permissions', () => {
      const viewerPerms = ROLE_PERMISSIONS[TEAM_ROLES.VIEWER];
      expect(viewerPerms).toContain('view_all');
      expect(viewerPerms).toHaveLength(1);
    });
  });

  describe('getRoleColor', () => {
    it('should return color for admin role', () => {
      const color = getRoleColor(TEAM_ROLES.ADMIN);
      expect(color).toContain('red');
    });

    it('should return color for developer role', () => {
      const color = getRoleColor(TEAM_ROLES.DEVELOPER);
      expect(color).toContain('blue');
    });

    it('should return color for viewer role', () => {
      const color = getRoleColor(TEAM_ROLES.VIEWER);
      expect(color).toContain('gray');
    });
  });

  describe('getInviteStatusColor', () => {
    it('should return color for pending status', () => {
      const color = getInviteStatusColor(INVITE_STATUS.PENDING);
      expect(color).toContain('yellow');
    });

    it('should return color for accepted status', () => {
      const color = getInviteStatusColor(INVITE_STATUS.ACCEPTED);
      expect(color).toContain('green');
    });

    it('should return color for rejected status', () => {
      const color = getInviteStatusColor(INVITE_STATUS.REJECTED);
      expect(color).toContain('red');
    });

    it('should return color for expired status', () => {
      const color = getInviteStatusColor(INVITE_STATUS.EXPIRED);
      expect(color).toContain('gray');
    });
  });
});
