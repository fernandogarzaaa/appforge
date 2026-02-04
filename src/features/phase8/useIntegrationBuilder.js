import { useCallback, useState } from 'react';

const STORAGE_KEY = 'appforge_integration_flows';

const loadFlows = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveFlows = (flows) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(flows));
  } catch {
    // no-op
  }
};

export function useIntegrationBuilder() {
  const [flows, setFlows] = useState(loadFlows);

  const addFlow = useCallback((flow) => {
    const next = [{ ...flow, id: Date.now() }, ...flows].slice(0, 50);
    setFlows(next);
    saveFlows(next);
  }, [flows]);

  const updateFlow = useCallback((flowId, updates) => {
    const next = flows.map((flow) => (flow.id === flowId ? { ...flow, ...updates } : flow));
    setFlows(next);
    saveFlows(next);
  }, [flows]);

  return {
    flows,
    addFlow,
    updateFlow
  };
}
