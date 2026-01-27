import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Download } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function BotTestReport({ botId }) {
  const [selectedResult, setSelectedResult] = useState(null);

  const { data: testResults = [] } = useQuery({
    queryKey: ['botTestResults', botId],
    queryFn: () => base44.entities.BotTestResult.filter({ bot_id: botId }, '-run_at')
  });

  const generateReport = () => {
    const report = {
      timestamp: new Date().toISOString(),
      totalTests: testResults.length,
      passed: testResults.filter(r => r.status === 'passed').length,
      failed: testResults.filter(r => r.status === 'failed').length,
      details: testResults.map(r => ({
        testName: r.id,
        status: r.status,
        assertions: `${r.passed_assertions}/${r.total_assertions}`,
        time: r.execution_time_ms,
        errors: r.error_message
      }))
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bot-test-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-semibold">Test Report</h3>
          <p className="text-xs text-gray-600">Latest test runs</p>
        </div>
        {testResults.length > 0 && (
          <Button size="sm" variant="outline" onClick={generateReport}>
            <Download className="w-3 h-3 mr-1" /> Export JSON
          </Button>
        )}
      </div>

      {/* Stats */}
      {testResults.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-gray-600">Total Runs</p>
              <p className="text-2xl font-bold">{testResults.length}</p>
            </CardContent>
          </Card>
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-4">
              <p className="text-xs text-green-700">Passed</p>
              <p className="text-2xl font-bold text-green-600">
                {testResults.filter(r => r.status === 'passed').length}
              </p>
            </CardContent>
          </Card>
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-4">
              <p className="text-xs text-red-700">Failed</p>
              <p className="text-2xl font-bold text-red-600">
                {testResults.filter(r => r.status === 'failed').length}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Results Table */}
      {testResults.length > 0 ? (
        <Card>
          <CardContent className="pt-4">
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {testResults.map((result) => (
                <div
                  key={result.id}
                  className="p-3 border rounded hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => setSelectedResult(result)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {result.status === 'passed' ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                        )}
                        <span className="text-sm font-semibold">Test Run {result.id.slice(-6)}</span>
                        <Badge variant={result.status === 'passed' ? 'default' : 'destructive'} className="text-xs">
                          {result.status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 mt-2 text-xs text-gray-600">
                        <div>
                          Assertions: <span className="font-semibold text-gray-900">{result.passed_assertions}/{result.total_assertions}</span>
                        </div>
                        <div>
                          Duration: <span className="font-semibold text-gray-900">{result.execution_time_ms}ms</span>
                        </div>
                        <div>
                          {new Date(result.created_date).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-gray-500">No test results yet</p>
          </CardContent>
        </Card>
      )}

      {/* Detail Modal */}
      {selectedResult && (
        <Dialog open={!!selectedResult} onOpenChange={() => setSelectedResult(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Test Result Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-600">Status</p>
                  <Badge variant={selectedResult.status === 'passed' ? 'default' : 'destructive'}>
                    {selectedResult.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Duration</p>
                  <p className="font-semibold">{selectedResult.execution_time_ms}ms</p>
                </div>
              </div>

              {/* Assertions */}
              <div>
                <h4 className="font-semibold text-sm mb-2">Assertions ({selectedResult.passed_assertions}/{selectedResult.total_assertions})</h4>
                <div className="space-y-2">
                  {selectedResult.assertion_results?.map((assertion, idx) => (
                    <div key={idx} className={`p-2 rounded text-xs ${assertion.passed ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                      <div className="flex items-center gap-2">
                        {assertion.passed ? (
                          <CheckCircle2 className="w-3 h-3 text-green-600" />
                        ) : (
                          <XCircle className="w-3 h-3 text-red-600" />
                        )}
                        <span className="font-semibold">{assertion.variable}</span>
                      </div>
                      <div className="mt-1 text-xs text-gray-600">
                        <p>Expected: {JSON.stringify(assertion.expected_value)}</p>
                        <p>Actual: {JSON.stringify(assertion.actual_value)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Logs */}
              {selectedResult.logs && selectedResult.logs.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-2">Logs</h4>
                  <pre className="bg-gray-900 text-gray-100 p-3 rounded text-xs overflow-x-auto max-h-48">
                    {selectedResult.logs.join('\n')}
                  </pre>
                </div>
              )}

              {/* Error Message */}
              {selectedResult.error_message && (
                <div className="p-3 bg-red-50 border border-red-200 rounded">
                  <p className="text-xs text-red-800 font-semibold">Error</p>
                  <p className="text-xs text-red-700 mt-1">{selectedResult.error_message}</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}