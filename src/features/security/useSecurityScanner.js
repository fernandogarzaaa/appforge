import { useState, useCallback } from 'react';
import axios from 'axios';

/**
 * Hook for security scanning and vulnerability detection
 * Integrates vulnerability scanning, dependency checking, and compliance
 */
export const useSecurityScanner = () => {
  const [scanResults, setScanResults] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState(null);
  const [lastScanTime, setLastScanTime] = useState(null);
  const [vulnerabilities, setVulnerabilities] = useState([]);
  const [complianceIssues, setComplianceIssues] = useState([]);

  /**
   * Scan code for vulnerabilities
   */
  const scanCode = useCallback(async (code, language = 'javascript') => {
    try {
      setIsScanning(true);
      setError(null);

      const response = await axios.post(
        '/api/security/scan-code',
        {
          code,
          language,
          scanTypes: ['vulnerabilities', 'dependencies', 'secrets', 'compliance'],
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
        }
      );

      setScanResults(response.data);
      setVulnerabilities(response.data.vulnerabilities || []);
      setComplianceIssues(response.data.complianceIssues || []);
      setLastScanTime(new Date());

      return response.data;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setIsScanning(false);
    }
  }, []);

  /**
   * Scan dependencies for known vulnerabilities
   */
  const scanDependencies = useCallback(async (packageJson) => {
    try {
      setIsScanning(true);
      setError(null);

      const response = await axios.post(
        '/api/security/scan-dependencies',
        {
          packageJson,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
        }
      );

      setVulnerabilities(response.data.vulnerabilities || []);
      setLastScanTime(new Date());

      return response.data;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setIsScanning(false);
    }
  }, []);

  /**
   * Check for secrets in code (API keys, passwords, tokens)
   */
  const checkSecrets = useCallback(async (code) => {
    try {
      const response = await axios.post(
        '/api/security/check-secrets',
        { code },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
        }
      );

      return response.data.secrets || [];
    } catch (err) {
      setError(err.message);
      return [];
    }
  }, []);

  /**
   * Check compliance with rules
   */
  const checkCompliance = useCallback(async (code, language, rules = []) => {
    try {
      const response = await axios.post(
        '/api/security/check-compliance',
        {
          code,
          language,
          rules: rules.length > 0 ? rules : null, // Use default if not specified
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
        }
      );

      setComplianceIssues(response.data.issues || []);
      return response.data;
    } catch (err) {
      setError(err.message);
      return null;
    }
  }, []);

  /**
   * Get security recommendations
   */
  const getRecommendations = useCallback(async () => {
    try {
      const response = await axios.get('/api/security/recommendations', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      return response.data.recommendations || [];
    } catch (err) {
      setError(err.message);
      return [];
    }
  }, []);

  /**
   * Generate security report
   */
  const generateReport = useCallback(async (filters = {}) => {
    try {
      setIsScanning(true);

      const response = await axios.post(
        '/api/security/generate-report',
        filters,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
        }
      );

      return response.data;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setIsScanning(false);
    }
  }, []);

  /**
   * Create custom security rule
   */
  const createRule = useCallback(async (rule) => {
    try {
      const response = await axios.post('/api/security/rules/create', rule, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      return response.data.rule;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  /**
   * Update security rule
   */
  const updateRule = useCallback(async (ruleId, updates) => {
    try {
      const response = await axios.patch(`/api/security/rules/${ruleId}`, updates, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      return response.data.rule;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  /**
   * Delete security rule
   */
  const deleteRule = useCallback(async (ruleId) => {
    try {
      await axios.delete(`/api/security/rules/${ruleId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  /**
   * Get audit log
   */
  const getAuditLog = useCallback(async (filters = {}) => {
    try {
      const response = await axios.get('/api/security/audit-log', {
        params: filters,
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      return response.data.logs || [];
    } catch (err) {
      setError(err.message);
      return [];
    }
  }, []);

  /**
   * Export scan results
   */
  const exportResults = useCallback(async (format = 'json') => {
    try {
      const response = await axios.get('/api/security/export-results', {
        params: { format },
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
        responseType: format === 'pdf' ? 'blob' : 'json',
      });

      if (format === 'pdf') {
        // Handle PDF download
        const url = window.URL.createObjectURL(response.data);
        const a = document.createElement('a');
        a.href = url;
        a.download = `security-report.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      }

      return response.data;
    } catch (err) {
      setError(err.message);
      return null;
    }
  }, []);

  return {
    // State
    scanResults,
    isScanning,
    error,
    lastScanTime,
    vulnerabilities,
    complianceIssues,

    // Methods
    scanCode,
    scanDependencies,
    checkSecrets,
    checkCompliance,
    getRecommendations,
    generateReport,
    createRule,
    updateRule,
    deleteRule,
    getAuditLog,
    exportResults,
  };
};

export default useSecurityScanner;
