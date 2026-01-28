import { useState, useCallback, useEffect } from 'react';
import { INVITE_STATUS } from '@/lib/teamInvites';
import { teamService } from '@/api/services';

/**
 * Hook for managing team invites and members
 */
export const useTeamInvites = (projectId) => {
  const [members, setMembers] = useState([]);
  const [invites, setInvites] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load team data from backend
  useEffect(() => {
    const fetchTeamData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [membersData, invitesData] = await Promise.all([
          teamService.getMembers(projectId),
          teamService.getInvites(projectId)
        ]);
        setMembers(membersData);
        setInvites(invitesData);
      } catch (err) {
        setError(err.message);
        console.error('Failed to fetch team data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    if (projectId) {
      fetchTeamData();
    }
  }, [projectId]);

  const inviteMember = useCallback(async (email, role, message) => {
    try {
      const newInvite = await teamService.inviteMember(projectId, { email, role, message });
      setInvites(prev => [newInvite, ...prev]);
      return newInvite;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [projectId]);

  const resendInvite = useCallback(async (inviteId) => {
    try {
      await teamService.resendInvite(inviteId);
      setInvites(prev =>
        prev.map(i => (i.id === inviteId ? { ...i, resent_at: new Date().toISOString() } : i))
      );
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const cancelInvite = useCallback(async (inviteId) => {
    try {
      await teamService.cancelInvite(inviteId);
      setInvites(prev =>
        prev.map(i => (i.id === inviteId ? { ...i, status: INVITE_STATUS.CANCELLED } : i))
      );
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const acceptInvite = useCallback((inviteId) => {
    const invite = invites.find(i => i.id === inviteId);
    if (invite) {
      setInvites(prev =>
        prev.map(i => (i.id === inviteId ? { ...i, status: INVITE_STATUS.ACCEPTED } : i))
      );
      
      // Add to members
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
    }
  }, [invites]);

  const rejectInvite = useCallback((inviteId) => {
    setInvites(prev =>
      prev.map(i => (i.id === inviteId ? { ...i, status: INVITE_STATUS.REJECTED } : i))
    );
  }, []);

  const removeMember = useCallback(async (memberId) => {
    try {
      await teamService.removeMember(projectId, memberId);
      setMembers(prev => prev.filter(m => m.id !== memberId));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [projectId]);

  const updateMemberRole = useCallback(async (memberId, newRole) => {
    try {
      await teamService.updateMemberRole(projectId, memberId, newRole);
      setMembers(prev =>
        prev.map(m => (m.id === memberId ? { ...m, role: newRole } : m))
      );
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [projectId]);

  const getPendingInvites = useCallback(() => {
    return invites.filter(i => i.status === INVITE_STATUS.PENDING);
  }, [invites]);

  return {
    members,
    invites,
    isLoading,
    error,
    inviteMember,
    resendInvite,
    cancelInvite,
    acceptInvite,
    rejectInvite,
    removeMember,
    updateMemberRole,
    getPendingInvites
  };
};

export default useTeamInvites;
