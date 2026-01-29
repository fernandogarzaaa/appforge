import { useState, useCallback, useEffect, useMemo } from 'react';
import { INVITE_STATUS } from '@/lib/teamInvites';
import { teamService } from '@/api/services';

const ROLE_PERMISSIONS = {
  owner: ['manage_team', 'delete_member', 'invite_member', 'view_team'],
  admin: ['manage_team', 'invite_member', 'view_team'],
  editor: ['invite_member', 'view_team'],
  viewer: ['view_team']
};

const ROLE_COLORS = {
  owner: 'bg-purple-100 text-purple-700',
  admin: 'bg-blue-100 text-blue-700',
  editor: 'bg-green-100 text-green-700',
  viewer: 'bg-gray-100 text-gray-700'
};

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-700',
  accepted: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-700',
  expired: 'bg-orange-100 text-orange-700'
};

/**
 * Hook for managing team invites and members
 */
export const useTeamInvites = (projectId) => {
  const [members, setMembers] = useState([]);
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadTeamData = useCallback(async () => {
    setLoading(true);
    setError(null);

    if (!projectId) {
      return;
    }

    try {
      const [membersData, invitesData] = await Promise.all([
        teamService.getMembers(projectId),
        teamService.getInvites(projectId)
      ]);
      setMembers(membersData || []);
      setInvites(invitesData || []);
    } catch (err) {
      setError(err?.message || 'Failed to fetch team data');
      console.error('Failed to fetch team data:', err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadTeamData();
  }, [loadTeamData]);

  const sendInvite = useCallback(async ({ email, role, message }) => {
    const invitePayload = {
      email,
      role,
      message,
      createdAt: new Date().toISOString(),
      status: INVITE_STATUS.PENDING
    };

    if (!projectId) {
      const localInvite = {
        id: `invite_${Date.now()}`,
        ...invitePayload,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      };
      setInvites(prev => [localInvite, ...prev]);
      return localInvite;
    }

    try {
      const newInvite = await teamService.inviteMember(projectId, invitePayload);
      setInvites(prev => [newInvite, ...prev]);
      return newInvite;
    } catch (err) {
      setError(err?.message || 'Failed to send invite');
      throw err;
    }
  }, [projectId]);

  const inviteMember = useCallback(async (email, role, message) => {
    return sendInvite({ email, role, message });
  }, [sendInvite]);

  const validateEmail = useCallback((email) => {
    if (!email) return false;
    return /\S+@\S+\.\S+/.test(email);
  }, []);

  const resendInvite = useCallback(async (inviteId) => {
    try {
      if (projectId) {
        await teamService.resendInvite(inviteId);
      }
      setInvites(prev =>
        prev.map(invite => invite.id === inviteId
          ? { ...invite, resent_at: new Date().toISOString() }
          : invite
        )
      );
    } catch (err) {
      setError(err?.message || 'Failed to resend invite');
      throw err;
    }
  }, [projectId]);

  const cancelInvite = useCallback(async (inviteId) => {
    try {
      if (projectId) {
        await teamService.cancelInvite(inviteId);
      }
      setInvites(prev =>
        prev.map(invite => invite.id === inviteId
          ? { ...invite, status: INVITE_STATUS.CANCELLED }
          : invite
        )
      );
    } catch (err) {
      setError(err?.message || 'Failed to cancel invite');
      throw err;
    }
  }, [projectId]);

  const acceptInvite = useCallback((inviteId) => {
    const invite = invites.find(i => i.id === inviteId);
    if (!invite) return;

    setInvites(prev =>
      prev.map(i => (i.id === inviteId ? { ...i, status: INVITE_STATUS.ACCEPTED } : i))
    );

    setMembers(prev => [
      ...prev,
      {
        id: `member_${Date.now()}`,
        email: invite.email,
        role: invite.role,
        joined_at: new Date().toISOString(),
        last_active: new Date().toISOString()
      }
    ]);
  }, [invites]);

  const rejectInvite = useCallback((inviteId) => {
    setInvites(prev =>
      prev.map(i => (i.id === inviteId ? { ...i, status: INVITE_STATUS.REJECTED } : i))
    );
  }, []);

  const removeMember = useCallback(async (memberId) => {
    try {
      if (projectId) {
        await teamService.removeMember(projectId, memberId);
      }
      setMembers(prev => prev.filter(m => m.id !== memberId));
    } catch (err) {
      setError(err?.message || 'Failed to remove member');
      throw err;
    }
  }, [projectId]);

  const updateMemberRole = useCallback(async (memberId, newRole) => {
    try {
      if (projectId) {
        await teamService.updateMemberRole(projectId, memberId, newRole);
      }
      setMembers(prev =>
        prev.map(m => (m.id === memberId ? { ...m, role: newRole } : m))
      );
    } catch (err) {
      setError(err?.message || 'Failed to update role');
      throw err;
    }
  }, [projectId]);

  const filterInvitesByStatus = useCallback((status) => {
    return invites.filter(invite => invite.status === status);
  }, [invites]);

  const filterMembersByRole = useCallback((role) => {
    return members.filter(member => member.role === role);
  }, [members]);

  const getExpiredInvites = useCallback(() => {
    const now = Date.now();
    return invites.filter(invite => invite.expiresAt && new Date(invite.expiresAt).getTime() < now);
  }, [invites]);

  const getPendingInvites = useCallback(() => {
    return invites.filter(i => i.status === INVITE_STATUS.PENDING);
  }, [invites]);

  const hasPermission = useCallback((role, permission) => {
    return (ROLE_PERMISSIONS[role] || []).includes(permission);
  }, []);

  const getRoleColor = useCallback((role) => {
    return ROLE_COLORS[role] || ROLE_COLORS.viewer;
  }, []);

  const getStatusColor = useCallback((status) => {
    return STATUS_COLORS[status] || STATUS_COLORS.pending;
  }, []);

  const getInviteTimeRemaining = useCallback((inviteId) => {
    const invite = invites.find(i => i.id === inviteId);
    if (!invite || !invite.expiresAt) return 0;
    const remaining = new Date(invite.expiresAt).getTime() - Date.now();
    if (remaining <= 0) return 0;
    return remaining;
  }, [invites]);

  const bulkInvite = useCallback(async (inviteList = []) => {
    const results = [];
    for (const entry of inviteList) {
      const result = await sendInvite(entry);
      results.push(result);
    }
    return results;
  }, [sendInvite]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const refresh = useCallback(async () => {
    await loadTeamData();
  }, [loadTeamData]);

  const sortInvites = useCallback((field = 'createdAt', order = 'desc') => {
    setInvites(prev => {
      const sorted = [...prev].sort((a, b) => {
        const aVal = a[field] || '';
        const bVal = b[field] || '';
        if (aVal === bVal) return 0;
        return order === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
      });
      return sorted;
    });
  }, []);

  const sortMembers = useCallback((field = 'name', order = 'asc') => {
    setMembers(prev => {
      const sorted = [...prev].sort((a, b) => {
        const aVal = a[field] || '';
        const bVal = b[field] || '';
        if (aVal === bVal) return 0;
        return order === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
      });
      return sorted;
    });
  }, []);

  const stats = useMemo(() => ({
    totalMembers: members.length,
    totalInvites: invites.length,
    pendingInvites: invites.filter(invite => invite.status === INVITE_STATUS.PENDING).length,
  }), [members, invites]);

  return {
    members,
    invites,
    loading,
    isLoading: loading,
    error,
    sendInvite,
    inviteMember,
    validateEmail,
    resendInvite,
    cancelInvite,
    acceptInvite,
    rejectInvite,
    removeMember,
    updateMemberRole,
    filterInvitesByStatus,
    filterMembersByRole,
    getExpiredInvites,
    getPendingInvites,
    hasPermission,
    getRoleColor,
    getStatusColor,
    getInviteTimeRemaining,
    bulkInvite,
    clearError,
    refresh,
    sortInvites,
    sortMembers,
    stats
  };
};

export default useTeamInvites;
