import { useState, useCallback, useEffect } from 'react';
import { generateMockTeamMembers, generateMockInvites, INVITE_STATUS } from '@/lib/teamInvites';

/**
 * Hook for managing team invites and members
 */
export const useTeamInvites = (projectId) => {
  const [members, setMembers] = useState([]);
  const [invites, setInvites] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load mock data on mount
  useEffect(() => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      const mockMembers = generateMockTeamMembers(5);
      const mockInvites = generateMockInvites(3);
      setMembers(mockMembers);
      setInvites(mockInvites);
      setIsLoading(false);
    }, 500);
  }, [projectId]);

  const inviteMember = useCallback((email, role, message) => {
    const newInvite = {
      id: `invite_${Date.now()}`,
      email,
      role,
      status: INVITE_STATUS.PENDING,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      invited_by: 'current@example.com',
      message
    };
    setInvites(prev => [newInvite, ...prev]);
    return newInvite;
  }, []);

  const resendInvite = useCallback((inviteId) => {
    setInvites(prev =>
      prev.map(i => (i.id === inviteId ? { ...i, resent_at: new Date().toISOString() } : i))
    );
  }, []);

  const cancelInvite = useCallback((inviteId) => {
    setInvites(prev =>
      prev.map(i => (i.id === inviteId ? { ...i, status: INVITE_STATUS.CANCELLED } : i))
    );
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

  const removeMember = useCallback((memberId) => {
    setMembers(prev => prev.filter(m => m.id !== memberId));
  }, []);

  const updateMemberRole = useCallback((memberId, newRole) => {
    setMembers(prev =>
      prev.map(m => (m.id === memberId ? { ...m, role: newRole } : m))
    );
  }, []);

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
