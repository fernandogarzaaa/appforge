import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Bug, AlertTriangle, CheckCircle, Zap, Copy, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function AITestingDebugger({ projectId }) {
  const [code, setCode] = useState('');
  const [errorLogs, setErrorLogs] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [copiedIndex, setCopiedIndex] = useState(null);

  const analyzeMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('aiTestingDebugger', {
        projectId,
        code,
        errorLogs: errorLogs.split('\n').filter(l => l.trim()),
        testCoverage: []
      });
      return response.data;
    },
    onSuccess: (data) => {
      setAnalysis(data.analysis);
      toast.success('Analysis complete!');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to analyze code');
    }
  });

  const getSeverityColor = (severity) => {
    const colors = {
      critical: 'bg-red-100 text-red-800 border-red-300',
      high: 'bg-orange-100 text-orange-800 border-orange-300',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      low: 'bg-blue-100 text-blue-800 border-blue-300'
    };
    return colors[severity] || colors.low;
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(0);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-6 border border-amber-200">
        <div className="flex items-start gap-3 mb-4">
          <Bug className="w-5 h-5 text-amber-600 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-semibold text-gray-900">AI Testing & Debugging</h3>
            <p className="text-sm text-gray-600">Identify and fix bugs, security issues, and performance problems</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Code to Analyze</label>
            <Textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Paste your code here..."
              className="rounded-lg h-32 font-mono text-xs"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Error Logs (Optional)</label>
            <Textarea
              value={errorLogs}
              onChange={(e) => setErrorLogs(e.target.value)}
              placeholder="Paste error messages here (one per line)..."
              className="rounded-lg h-20 font-mono text-xs"
            />
          </div>

          <Button
            onClick={() => analyzeMutation.mutate()}
            disabled={!code.trim() || analyzeMutation.isPending}
            className="w-full bg-gradient-to-r from-amber-600 to-orange-600 text-white"
          >
            {analyzeMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Analyze Code
              </>
            )}
          </Button>
        </div>
      </div>

      {analysis && (
        <div className="space-y-4">
          {analysis.summary && (
            <Card className="border-l-4 border-l-amber-500">
              <CardContent className="p-4">
                <p className="text-sm text-gray-700">{analysis.summary}</p>
              </CardContent>
            </Card>
          )}

          {analysis.issues && analysis.issues.length > 0 && (
            <Card>
              <CardContent className="p-6 space-y-4">
                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  Found {analysis.issues.length} Issue{analysis.issues.length !== 1 ? 's' : ''}
                </h4>
                <div className="space-y-3">
                  {analysis.issues.map((issue, idx) => (
                    <div key={idx} className={`p-3 rounded-lg border ${getSeverityColor(issue.severity)}`}>
                      <div className="flex items-start justify-between mb-2">
                        <span className="font-medium">{issue.type}</span>
                        <Badge className={`${getSeverityColor(issue.severity)} border`}>
                          {issue.severity.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-sm mb-2">{issue.description}</p>
                      {issue.line && (
                        <p className="text-xs text-gray-600 mb-2">Line {issue.line}</p>
                      )}
                      {issue.fix && (
                        <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
                          {issue.fix}
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {analysis.testCases && analysis.testCases.length > 0 && (
            <Card>
              <CardContent className="p-6 space-y-4">
                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  Suggested Test Cases ({analysis.testCases.length})
                </h4>
                <div className="space-y-2">
                  {analysis.testCases.map((test, idx) => (
                    <div key={idx} className="p-3 bg-green-50 rounded-lg border border-green-200 text-sm font-mono">
                      <div className="flex justify-between items-start gap-2">
                        <span className="flex-1">{test}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopy(test)}
                        >
                          {copiedIndex === idx ? (
                            <Check className="w-3 h-3 text-green-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {analysis.performanceTips && analysis.performanceTips.length > 0 && (
            <Card>
              <CardContent className="p-6 space-y-4">
                <h4 className="font-semibold text-gray-900">Performance Tips</h4>
                <ul className="space-y-2">
                  {analysis.performanceTips.map((tip, idx) => (
                    <li key={idx} className="flex gap-3 text-sm">
                      <span className="text-indigo-600 font-bold">•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}