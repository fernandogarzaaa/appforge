import { useState, useEffect, useCallback } from 'react';

/**
 * Hook for organization management in multi-tenant environment
 * @returns {Object} Organization management utilities
 */
export const useOrganizationManager = () => {
  const [organizations, setOrganizations] = useState([]);
  const [currentOrg, setCurrentOrg] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Fetch all organizations for current user
   */
  const fetchOrganizations = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Mock organizations
      const orgs = [
        {
          id: 'org-1',
          name: 'Acme Corporation',
          plan: 'Enterprise',
          memberCount: 45,
          createdAt: '2024-01-15',
          status: 'active',
        },
        {
          id: 'org-2',
          name: 'Startup Inc',
          plan: 'Pro',
          memberCount: 8,
          createdAt: '2024-03-20',
          status: 'active',
        },
      ];

      setOrganizations(orgs);
      if (!currentOrg && orgs.length > 0) {
        setCurrentOrg(orgs[0]);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [currentOrg]);

  /**
   * Create new organization
   */
  const createOrganization = useCallback(async (orgData) => {
    setLoading(true);
    setError(null);

    try {
      const newOrg = {
        id: `org-${Date.now()}`,
        ...orgData,
        createdAt: new Date().toISOString(),
        status: 'active',
        memberCount: 1,
      };

      setOrganizations(prev => [...prev, newOrg]);
      return newOrg;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Update organization
   */
  const updateOrganization = useCallback(async (orgId, updates) => {
    setLoading(true);
    setError(null);

    try {
      setOrganizations(prev =>
        prev.map(org => (org.id === orgId ? { ...org, ...updates } : org))
      );
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Delete organization
   */
  const deleteOrganization = useCallback(async (orgId) => {
    setLoading(true);
    setError(null);

    try {
      setOrganizations(prev => prev.filter(org => org.id !== orgId));
      if (currentOrg?.id === orgId) {
        setCurrentOrg(null);
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentOrg]);

  /**
   * Add member to organization
   */
  const addMember = useCallback(async (email, role = 'member') => {
    setLoading(true);
    setError(null);

    try {
      const newMember = {
        id: `member-${Date.now()}`,
        email,
        role,
        joinedAt: new Date().toISOString(),
        status: 'active',
      };

      setMembers(prev => [...prev, newMember]);
      return newMember;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Remove member from organization
   */
  const removeMember = useCallback(async (memberId) => {
    setLoading(true);
    setError(null);

    try {
      setMembers(prev => prev.filter(m => m.id !== memberId));
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  return {
    organizations,
    currentOrg,
    members,
    loading,
    error,
    setCurrentOrg,
    createOrganization,
    updateOrganization,
    deleteOrganization,
    addMember,
    removeMember,
  };
};
