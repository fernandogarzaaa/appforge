import { useCallback, useState } from 'react';

export function useSecurityScanner() {
  const [scans, setScans] = useState([]);
  const [isScanning, setIsScanning] = useState(false);

  const runScan = useCallback(async (projectId, dependencies = []) => {
    setIsScanning(true);
    try {
      const [auditResponse, vulnResponse] = await Promise.all([
        fetch('/api/securityAudit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId, scope: 'application' })
        }),
        fetch('/api/vulnerabilityScan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dependencies })
        })
      ]);

      const audit = await auditResponse.json();
      const vulnerability = await vulnResponse.json();

      const record = {
        id: `scan_${Date.now()}`,
        projectId,
        audit,
        vulnerability,
        createdAt: new Date().toISOString(),
      };
      setScans((prev) => [record, ...prev]);
      return record;
    } finally {
      setIsScanning(false);
    }
  }, []);

  return { scans, isScanning, runScan };
}
