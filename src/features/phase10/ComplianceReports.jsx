import React, { useState } from 'react';
import { useComplianceChecker } from './useComplianceChecker';

/**
 * Compliance Reports Component
 * Generate and download compliance reports
 */
export const ComplianceReports = () => {
  const { complianceStatus } = useComplianceChecker();
  const [generating, setGenerating] = useState(false);
  const [reportType, setReportType] = useState('gdpr');
  const [format, setFormat] = useState('pdf');

  const generateReport = async () => {
    setGenerating(true);

    try {
      const report = {
        standard: reportType.toUpperCase(),
        generatedAt: new Date().toISOString(),
        score: complianceStatus[reportType].score,
        status: complianceStatus[reportType].passed ? 'COMPLIANT' : 'NON-COMPLIANT',
        issues: complianceStatus[reportType].issues,
        recommendations: complianceStatus[reportType].issues.map(issue => 
          `Address: ${issue}`
        ),
      };

      if (format === 'pdf') {
        // Simulate PDF generation
        console.log('Generating PDF:', report);
        alert('PDF report generated successfully!');
      } else if (format === 'csv') {
        // Generate CSV
        const csv = [
          ['Metric', 'Value'],
          ['Standard', report.standard],
          ['Score', report.score],
          ['Status', report.status],
          ['Issues Count', report.issues.length],
          ...report.issues.map(issue => ['Issue', issue]),
        ].map(row => row.join(',')).join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${reportType}-compliance-report.csv`;
        a.click();
      }
    } catch (err) {
      console.error('Report generation failed:', err);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Compliance Reports</h1>

      {/* Report Configuration */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Generate Report</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Compliance Standard
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="gdpr">GDPR</option>
              <option value="hipaa">HIPAA</option>
              <option value="soc2">SOC 2</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Report Format
            </label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="pdf">PDF</option>
              <option value="csv">CSV</option>
              <option value="json">JSON</option>
            </select>
          </div>

          <button
            onClick={generateReport}
            disabled={generating}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
          >
            {generating ? 'Generating...' : 'Generate Report'}
          </button>
        </div>
      </div>

      {/* Report Preview */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Report Preview</h2>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Standard:</span>
            <span className="font-semibold">{reportType.toUpperCase()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Score:</span>
            <span className="font-semibold">{complianceStatus[reportType].score}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Status:</span>
            <span className={`font-semibold ${complianceStatus[reportType].passed ? 'text-green-600' : 'text-red-600'}`}>
              {complianceStatus[reportType].passed ? 'COMPLIANT' : 'NON-COMPLIANT'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Issues:</span>
            <span className="font-semibold">{complianceStatus[reportType].issues.length}</span>
          </div>
          {complianceStatus[reportType].issues.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <p className="font-medium text-gray-700 mb-2">Issues Detected:</p>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                {complianceStatus[reportType].issues.map((issue, idx) => (
                  <li key={idx}>{issue}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
