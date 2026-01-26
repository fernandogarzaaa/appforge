import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Activity, AlertCircle, CheckCircle2, Loader2, 
  AlertTriangle, Lightbulb, TrendingUp, Zap 
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function SystemDiagnostics() {
  const [diagnostics, setDiagnostics] = useState(null);
  const [loading, setLoading] = useState(false);

  const runDiagnostics = async () => {
    setLoading(true);
    try {
      const { data } = await base44.functions.invoke('comprehensiveDiagnostics', {});
      setDiagnostics(data);
    } catch (error) {
      console.error('Diagnostics failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50';
      case 'warning': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-blue-600 bg-blue-50';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      default: return 'text-blue-600';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">System Diagnostics</h2>
          <p className="text-gray-500 mt-1">Comprehensive health check and feature analysis</p>
        </div>
        <Button 
          onClick={runDiagnostics}
          disabled={loading}
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Running...
            </>
          ) : (
            <>
              <Activity className="w-4 h-4 mr-2" />
              Run Diagnostics
            </>
          )}
        </Button>
      </div>

      {diagnostics && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Summary Card */}
          <Card className="border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-600" />
                System Health: {diagnostics.summary.health.toUpperCase()}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-indigo-600">
                    {diagnostics.summary.score}%
                  </div>
                  <div className="text-sm text-gray-500">Health Score</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {diagnostics.summary.passedChecks}/{diagnostics.summary.totalChecks}
                  </div>
                  <div className="text-sm text-gray-500">Checks Passed</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-600">
                    {diagnostics.summary.criticalIssues}
                  </div>
                  <div className="text-sm text-gray-500">Critical Issues</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-600">
                    {diagnostics.summary.totalSuggestions}
                  </div>
                  <div className="text-sm text-gray-500">Suggestions</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* System Checks */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                System Checks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {diagnostics.checks.map((check, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      {check.status === 'passed' ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-red-600" />
                      )}
                      <span className="font-medium">{check.name}</span>
                    </div>
                    <Badge variant={check.status === 'passed' ? 'default' : 'destructive'}>
                      {check.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Issues */}
          {diagnostics.issues.length > 0 && (
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  Issues Found ({diagnostics.issues.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {diagnostics.issues.map((issue, idx) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-lg border-l-4 ${getSeverityColor(issue.severity)}`}
                    >
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 mt-0.5" />
                        <div>
                          <div className="font-semibold text-sm uppercase">
                            {issue.severity} - {issue.type}
                          </div>
                          <p className="text-sm mt-1">{issue.message}</p>
                          {issue.entity && (
                            <Badge variant="outline" className="mt-2">
                              {issue.entity}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Suggestions */}
          <Card className="border-yellow-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-yellow-600" />
                Feature Suggestions ({diagnostics.suggestions.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {diagnostics.suggestions.map((suggestion, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-lg border bg-gray-50"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1">
                        <Zap className={`w-5 h-5 mt-0.5 ${getPriorityColor(suggestion.priority)}`} />
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs">
                              {suggestion.type}
                            </Badge>
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${getPriorityColor(suggestion.priority)}`}
                            >
                              {suggestion.priority} priority
                            </Badge>
                          </div>
                          <p className="text-sm">{suggestion.message}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <Card>
            <CardHeader>
              <CardTitle>System Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Entity Records</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {Object.entries(diagnostics.stats.entities || {}).map(([name, count]) => (
                      <div key={name} className="p-3 rounded-lg bg-gray-50 border">
                        <div className="text-2xl font-bold text-indigo-600">{count}</div>
                        <div className="text-xs text-gray-600">{name}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {diagnostics.stats.agents && (
                  <div>
                    <h4 className="font-semibold mb-2">AI Agents Status</h4>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(diagnostics.stats.agents).map(([name, status]) => (
                        <Badge 
                          key={name}
                          variant={status === 'configured' ? 'default' : 'outline'}
                        >
                          {name}: {status}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {!diagnostics && !loading && (
        <Card>
          <CardContent className="py-12 text-center">
            <Activity className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Run System Diagnostics
            </h3>
            <p className="text-gray-500 mb-6">
              Check your app's health, identify issues, and get feature suggestions
            </p>
            <Button 
              onClick={runDiagnostics}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              <Activity className="w-4 h-4 mr-2" />
              Start Diagnostics
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}