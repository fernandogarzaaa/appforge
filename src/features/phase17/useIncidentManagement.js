import { useState, useCallback } from 'react';

/**
 * Hook for incident management
 * @returns {Object} Incident management utilities
 */
export const useIncidentManagement = () => {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(false);

  const createIncident = useCallback(async (incidentData) => {
    setLoading(true);
    try {
      const incident = {
        id: `inc-${Date.now()}`,
        ...incidentData,
        createdAt: new Date().toISOString(),
        status: 'open',
        severity: incidentData.severity || 'medium',
      };
      setIncidents(prev => [...prev, incident]);
      return incident;
    } finally {
      setLoading(false);
    }
  }, []);

  const resolveIncident = useCallback(async (incidentId, resolution) => {
    setIncidents(prev => prev.map(inc =>
      inc.id === incidentId ? { ...inc, status: 'resolved', resolution, resolvedAt: new Date().toISOString() } : inc
    ));
  }, []);

  return { incidents, loading, createIncident, resolveIncident };
};
