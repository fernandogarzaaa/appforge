import { useCallback, useState } from 'react';

export function useCodeSmellDetector() {
  const [findings, setFindings] = useState([]);

  const analyze = useCallback((source) => {
    const issues = [];
    if (source.includes('any')) {
      issues.push({ id: `smell_${Date.now()}`, type: 'typescript-any', severity: 'medium' });
    }
    if (source.length > 5000) {
      issues.push({ id: `smell_${Date.now() + 1}`, type: 'file-too-large', severity: 'low' });
    }
    setFindings(issues);
    return issues;
  }, []);

  return { findings, analyze };
}
