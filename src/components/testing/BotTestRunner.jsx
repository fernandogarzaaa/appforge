import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export default function BotTestRunner({ botId, botNodes }) {
  const queryClient = useQueryClient();
  const [isRunning, setIsRunning] = useState(false);
  const [selectedTests, setSelectedTests] = useState([]);

  const { data: testCases = [] } = useQuery({
    queryKey: ['botTestCases', botId],
    queryFn: () => base44.entities.BotTestCase.filter({ bot_id: botId, status: 'active' })
  });

  const { data: testResults = [] } = useQuery({
    queryKey: ['botTestResults', botId],
    queryFn: () => base44.entities.BotTestResult.filter({ bot_id: botId }, '-run_at', 50)
  });

  const runTestsMutation = useMutation({
    mutationFn: async (testIds) => {
      setIsRunning(true);
      try {
        const response = await base44.functions.invoke('runBotTests', {
          botId,
          testIds: testIds.length > 0 ? testIds : testCases.map(t => t.id),
          botNodes
        });
        return response.data;
      } finally {
        setIsRunning(false);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['botTestResults', botId] });
      toast.success('Tests completed');
      setSelectedTests([]);
    },
    onError: (error) => {
      toast.error('Test run failed: ' + error.message);
    }
  });

  const handleRunTests = () => {
    if (selectedTests.length === 0 && testCases.length === 0) {
      toast.error('No test cases to run');
      return;
    }
    runTestsMutation.mutate(selectedTests);
  };

  const handleSelectAll = () => {
    if (selectedTests.length === testCases.length) {
      setSelectedTests([]);
    } else {
      setSelectedTests(testCases.map(t => t.id));
    }
  };

  const getResultIcon = (status) => {
    switch (status) {
      case 'passed': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return null;
    }
  };

  const passRate = testResults.length > 0
    ? Math.round((testResults.filter(r => r.status === 'passed').length / testResults.length) * 100)
    : 0;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-600">Total Tests</p>
              <p className="text-2xl font-bold">{testCases.length}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Passed</p>
              <p className="text-2xl font-bold text-green-600">{testResults.filter(r => r.status === 'passed').length}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Failed</p>
              <p className="text-2xl font-bold text-red-600">{testResults.filter(r => r.status === 'failed').length}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Pass Rate</p>
              <p className="text-2xl font-bold">{passRate}%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Selection & Execution */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Test Cases</CardTitle>
            <Button
              size="sm"
              onClick={handleRunTests}
              disabled={isRunning || testCases.length === 0}
            >
              {isRunning ? (
                <>
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" /> Running...
                </>
              ) : (
                <>
                  <Play className="w-3 h-3 mr-1" /> Run Tests
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={selectedTests.length === testCases.length && testCases.length > 0}
              onChange={handleSelectAll}
              className="rounded"
            />
            <span className="text-xs font-semibold">Select All</span>
          </div>

          <div className="space-y-1">
            {testCases.map((test) => {
              const result = testResults.find(r => r.test_case_id === test.id);
              return (
                <div key={test.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded">
                  <input
                    type="checkbox"
                    checked={selectedTests.includes(test.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedTests([...selectedTests, test.id]);
                      } else {
                        setSelectedTests(selectedTests.filter(id => id !== test.id));
                      }
                    }}
                    className="rounded"
                  />
                  <span className="text-xs flex-1">{test.name}</span>
                  {result && (
                    <div className="flex items-center gap-1">
                      {getResultIcon(result.status)}
                      <span className="text-xs font-semibold">{result.passed_assertions}/{result.total_assertions}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent Results */}
      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Recent Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {testResults.slice(0, 10).map((result) => (
              <div key={result.id} className="p-2 border rounded flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs font-semibold">Test #{result.id.slice(-4)}</p>
                  <p className="text-xs text-gray-600">
                    {result.execution_time_ms}ms • {result.passed_assertions}/{result.total_assertions} passed
                  </p>
                </div>
                <Badge
                  variant={result.status === 'passed' ? 'default' : 'destructive'}
                  className="text-xs"
                >
                  {result.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}