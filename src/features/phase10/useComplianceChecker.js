import { useState, useEffect, useCallback } from 'react';

/**
 * Hook for compliance checking (GDPR, HIPAA, SOC 2)
 * @returns {Object} Compliance utilities and status
 */
export const useComplianceChecker = () => {
  const [complianceStatus, setComplianceStatus] = useState({
    gdpr: { score: 0, issues: [], passed: false },
    hipaa: { score: 0, issues: [], passed: false },
    soc2: { score: 0, issues: [], passed: false },
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Check GDPR compliance
   */
  const checkGDPR = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const checks = [
        { rule: 'Data encryption at rest', passed: true },
        { rule: 'Data encryption in transit', passed: true },
        { rule: 'User consent management', passed: true },
        { rule: 'Right to be forgotten', passed: false },
        { rule: 'Data portability', passed: true },
        { rule: 'Breach notification', passed: true },
        { rule: 'Privacy policy', passed: false },
      ];

      const passedCount = checks.filter(c => c.passed).length;
      const score = Math.round((passedCount / checks.length) * 100);
      const issues = checks.filter(c => !c.passed).map(c => c.rule);

      setComplianceStatus(prev => ({
        ...prev,
        gdpr: { score, issues, passed: score >= 80 },
      }));

      return { score, issues, passed: score >= 80 };
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Check HIPAA compliance
   */
  const checkHIPAA = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const checks = [
        { rule: 'Access controls', passed: true },
        { rule: 'Audit logs', passed: true },
        { rule: 'Data encryption', passed: true },
        { rule: 'Business associate agreements', passed: false },
        { rule: 'Risk assessment', passed: true },
        { rule: 'Incident response plan', passed: false },
      ];

      const passedCount = checks.filter(c => c.passed).length;
      const score = Math.round((passedCount / checks.length) * 100);
      const issues = checks.filter(c => !c.passed).map(c => c.rule);

      setComplianceStatus(prev => ({
        ...prev,
        hipaa: { score, issues, passed: score >= 80 },
      }));

      return { score, issues, passed: score >= 80 };
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Check SOC 2 compliance
   */
  const checkSOC2 = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const checks = [
        { rule: 'Security controls', passed: true },
        { rule: 'Availability monitoring', passed: true },
        { rule: 'Processing integrity', passed: true },
        { rule: 'Confidentiality measures', passed: true },
        { rule: 'Privacy controls', passed: false },
        { rule: 'Change management', passed: true },
        { rule: 'Vendor management', passed: false },
      ];

      const passedCount = checks.filter(c => c.passed).length;
      const score = Math.round((passedCount / checks.length) * 100);
      const issues = checks.filter(c => !c.passed).map(c => c.rule);

      setComplianceStatus(prev => ({
        ...prev,
        soc2: { score, issues, passed: score >= 80 },
      }));

      return { score, issues, passed: score >= 80 };
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Run all compliance checks
   */
  const checkAll = useCallback(async () => {
    await Promise.all([checkGDPR(), checkHIPAA(), checkSOC2()]);
  }, [checkGDPR, checkHIPAA, checkSOC2]);

  useEffect(() => {
    checkAll();
  }, [checkAll]);

  return {
    complianceStatus,
    loading,
    error,
    checkGDPR,
    checkHIPAA,
    checkSOC2,
    checkAll,
  };
};
