import { useState, useCallback, useEffect } from 'react';

/**
 * Hook for distributed tracing
 * @returns {Object} Tracing utilities
 */
export const useDistributedTracing = () => {
  const [traces, setTraces] = useState([]);
  const [loading, setLoading] = useState(false);

  const startTrace = useCallback((operationName) => {
    const traceId = `trace-${Date.now()}`;
    const trace = {
      traceId,
      operationName,
      startTime: Date.now(),
      spans: [],
    };
    setTraces(prev => [...prev, trace]);
    return traceId;
  }, []);

  const endTrace = useCallback((traceId) => {
    setTraces(prev => prev.map(t =>
      t.traceId === traceId ? { ...t, endTime: Date.now(), duration: Date.now() - t.startTime } : t
    ));
  }, []);

  return { traces, loading, startTrace, endTrace };
};
