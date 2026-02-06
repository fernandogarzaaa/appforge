import { useState, useCallback, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

/**
 * Hook for custom workflow automation
 * @returns {Object} Workflow utilities
 */
export const useCustomWorkflows = () => {
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    base44.entities.CustomWorkflow.list('-created_date', 200)
      .then((items) => {
        if (active) setWorkflows(items || []);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const createWorkflow = useCallback(async (workflowData) => {
    setLoading(true);
    try {
      const workflow = await base44.entities.CustomWorkflow.create({
        ...workflowData,
        status: 'active',
        created_at: new Date().toISOString()
      });
      setWorkflows(prev => [workflow, ...prev]);
      return workflow;
    } finally {
      setLoading(false);
    }
  }, []);

  const executeWorkflow = useCallback(async (workflowId, input) => {
    const response = await base44.functions.invoke('executeTeamWorkflow', {
      workflowId,
      triggerData: input || {}
    });
    return response?.data || response;
  }, []);

  return { workflows, loading, createWorkflow, executeWorkflow };
};
