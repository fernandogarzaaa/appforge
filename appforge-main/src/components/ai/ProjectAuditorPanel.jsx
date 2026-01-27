import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Zap, MessageCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ProjectAuditorPanel() {
  const [isRunning, setIsRunning] = useState(false);
  const [auditResult, setAuditResult] = useState(null);
  const [autoFixing, setAutoFixing] = useState(false);

  const runAudit = async () => {
    setIsRunning(true);
    try {
      const { data } = await base44.functions.invoke('auditProject', {});
      setAuditResult(data);
      toast.success('Project audit completed');
    } catch (error) {
      toast.error('Failed to run audit');
      console.error(error);
    } finally {
      setIsRunning(false);
    }
  };

  const autoFixIssues = async () => {
    if (!auditResult?.audit_report) {
      toast.error('Run audit first');
      return;
    }

    setAutoFixing(true);
    try {
      const allIssues = [
        ...auditResult.audit_report.critical,
        ...auditResult.audit_report.high,
        ...auditResult.audit_report.medium,
        ...auditResult.audit_report.low
      ];

      const { data } = await base44.functions.invoke('autoFixIssues', {
        issues: allIssues
      });

      // Report findings
      await base44.functions.invoke('reportAuditFindings', {
        audit_report: auditResult.audit_report,
        fixes_applied: data.fixes
      });

      toast.success(`Fixed ${data.fixes.summary.total_fixed} issues and sent WhatsApp report`);
      setAuditResult(prev => ({ ...prev, fixes: data.fixes }));
    } catch (error) {
      toast.error('Failed to auto-fix issues');
      console.error(error);
    } finally {
      setAutoFixing(false);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  const whatsappUrl = base44.agents.getWhatsAppConnectURL('project_auditor');

  return (
    <div className="w-full space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>🔍 Project Auditor</span>
              <Zap className="w-4 h-4 text-amber-500" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Automatically scan your project for errors, bugs, and issues. The agent will identify problems and fix them with full autonomy.
            </p>
            <Button 
              onClick={runAudit} 
              disabled={isRunning} 
              className="w-full bg-amber-600 hover:bg-amber-700"
            >
              {isRunning && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isRunning ? 'Running Audit...' : 'Start Project Audit'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>💬 WhatsApp Reports</span>
              <MessageCircle className="w-4 h-4 text-green-500" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Receive detailed audit reports directly on WhatsApp. Get instant notifications about issues and fixes.
            </p>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full"
            >
              <Button className="w-full bg-green-600 hover:bg-green-700">
                <MessageCircle className="h-4 w-4 mr-2" />
                Connect WhatsApp
              </Button>
            </a>
          </CardContent>
        </Card>
      </div>

      {auditResult && (
        <Card className="border-l-4 border-l-amber-500">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Audit Results</span>
              <Badge variant="outline">
                {auditResult.audit_report.summary.total} Issues Found
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <div className="text-2xl font-bold text-red-600">
                  {auditResult.audit_report.summary.critical_count}
                </div>
                <div className="text-xs text-red-600 mt-1">Critical</div>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                <div className="text-2xl font-bold text-orange-600">
                  {auditResult.audit_report.summary.high_count}
                </div>
                <div className="text-xs text-orange-600 mt-1">High</div>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <div className="text-2xl font-bold text-yellow-600">
                  {auditResult.audit_report.summary.medium_count}
                </div>
                <div className="text-xs text-yellow-600 mt-1">Medium</div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="text-2xl font-bold text-blue-600">
                  {auditResult.audit_report.summary.low_count}
                </div>
                <div className="text-xs text-blue-600 mt-1">Low</div>
              </div>
            </div>

            {/* Issues List */}
            {[
              { level: 'critical', items: auditResult.audit_report.critical, icon: '🔴' },
              { level: 'high', items: auditResult.audit_report.high, icon: '🟠' },
              { level: 'medium', items: auditResult.audit_report.medium, icon: '🟡' }
            ].map(({ level, items, icon }) =>
              items.length > 0 && (
                <div key={level} className="space-y-2">
                  <h4 className="font-semibold text-gray-900">
                    {icon} {level.charAt(0).toUpperCase() + level.slice(1)} Priority Issues
                  </h4>
                  <div className="space-y-2">
                    {items.map((issue, idx) => (
                      <div key={idx} className={`p-3 rounded-lg border ${getSeverityColor(level)}`}>
                        <div className="font-medium text-sm">{issue.type}</div>
                        <div className="text-sm">{issue.description}</div>
                        {issue.file && <div className="text-xs opacity-75 mt-1">📄 {issue.file}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )
            )}

            {/* Recommendations */}
            {auditResult.recommendations && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 space-y-2">
                <h4 className="font-semibold text-gray-900">💡 Recommendations</h4>
                {auditResult.recommendations.map((rec, idx) => (
                  <div key={idx} className="text-sm text-gray-700">• {rec}</div>
                ))}
              </div>
            )}

            {/* Fixes Applied */}
            {auditResult.fixes && (
              <div className="bg-green-50 p-4 rounded-lg border border-green-200 space-y-2">
                <h4 className="font-semibold text-green-900 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" /> Fixes Applied
                </h4>
                <div className="text-sm text-green-700">
                  ✅ {auditResult.fixes.summary.total_fixed} issues fixed
                  {auditResult.fixes.summary.total_failed > 0 && (
                    <> • ⚠️ {auditResult.fixes.summary.total_failed} failed</>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4 border-t">
              <Button 
                onClick={runAudit} 
                disabled={isRunning}
                variant="outline"
                className="flex-1"
              >
                {isRunning ? 'Auditing...' : 'Re-run Audit'}
              </Button>
              {!auditResult.fixes && (
                <Button 
                  onClick={autoFixIssues} 
                  disabled={autoFixing || auditResult.audit_report.summary.total === 0}
                  className="flex-1 bg-amber-600 hover:bg-amber-700"
                >
                  {autoFixing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {autoFixing ? 'Fixing...' : 'Auto-Fix All Issues'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}