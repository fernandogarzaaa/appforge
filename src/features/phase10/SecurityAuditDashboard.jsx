import React, { useState } from 'react';
import { useComplianceChecker } from './useComplianceChecker';
import { usePenetrationTesting } from './usePenetrationTesting';

/**
 * Security Audit Dashboard Component
 * Displays security score, vulnerabilities, and compliance status
 */
export const SecurityAuditDashboard = () => {
  const { complianceStatus, checkAll } = useComplianceChecker();
  const { vulnerabilities, testResults, runSecurityScan } = usePenetrationTesting();
  const [scanning, setScanning] = useState(false);

  const handleScan = async () => {
    setScanning(true);
    await runSecurityScan('https://appforge.fun');
    await checkAll();
    setScanning(false);
  };

  const overallScore = Math.round(
    (complianceStatus.gdpr.score + complianceStatus.hipaa.score + complianceStatus.soc2.score) / 3
  );

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Security Audit Dashboard</h1>
        <button
          onClick={handleScan}
          disabled={scanning}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
        >
          {scanning ? 'Scanning...' : 'Run Security Scan'}
        </button>
      </div>

      {/* Overall Security Score */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Overall Security Score</h2>
        <div className="flex items-center justify-center">
          <div className="text-center">
            <p className={`text-6xl font-bold ${getScoreColor(overallScore)}`}>{overallScore}</p>
            <p className="text-gray-500 mt-2">Out of 100</p>
          </div>
        </div>
      </div>

      {/* Compliance Status */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Compliance Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {['gdpr', 'hipaa', 'soc2'].map(standard => (
            <div key={standard} className="p-4 border border-gray-200 rounded-lg">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-lg uppercase">{standard}</h3>
                <span className={`text-2xl font-bold ${getScoreColor(complianceStatus[standard].score)}`}>
                  {complianceStatus[standard].score}%
                </span>
              </div>
              <div className="space-y-2">
                {complianceStatus[standard].issues.length > 0 ? (
                  <>
                    <p className="text-sm text-red-600 font-medium">
                      {complianceStatus[standard].issues.length} issues found:
                    </p>
                    {complianceStatus[standard].issues.map((issue, idx) => (
                      <p key={idx} className="text-xs text-gray-600">• {issue}</p>
                    ))}
                  </>
                ) : (
                  <p className="text-sm text-green-600 font-medium">✓ All checks passed</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Vulnerabilities */}
      {vulnerabilities.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Detected Vulnerabilities</h2>
          <div className="space-y-3">
            {vulnerabilities.map(vuln => (
              <div key={vuln.id} className={`p-4 border-l-4 rounded ${
                vuln.severity === 'HIGH' ? 'border-red-500 bg-red-50' :
                vuln.severity === 'MEDIUM' ? 'border-yellow-500 bg-yellow-50' :
                'border-blue-500 bg-blue-50'
              }`}>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-900">{vuln.type}</h3>
                    <p className="text-sm text-gray-600">{vuln.location}</p>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      vuln.severity === 'HIGH' ? 'bg-red-200 text-red-800' :
                      vuln.severity === 'MEDIUM' ? 'bg-yellow-200 text-yellow-800' :
                      'bg-blue-200 text-blue-800'
                    }`}>
                      {vuln.severity}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">CVSS: {vuln.cvss}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-700 mb-2">{vuln.description}</p>
                <p className="text-sm text-green-700">
                  <strong>Fix:</strong> {vuln.remediation}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Test Results Summary */}
      {testResults && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Latest Scan Results</h2>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-sm text-gray-500">Total Vulnerabilities</p>
              <p className="text-2xl font-bold text-gray-900">{testResults.totalVulnerabilities}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500">High Severity</p>
              <p className="text-2xl font-bold text-red-600">{testResults.high}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500">Medium Severity</p>
              <p className="text-2xl font-bold text-yellow-600">{testResults.medium}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500">Low Severity</p>
              <p className="text-2xl font-bold text-blue-600">{testResults.low}</p>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-4">
            Last scan: {new Date(testResults.timestamp).toLocaleString()}
          </p>
        </div>
      )}
    </div>
  );
};
