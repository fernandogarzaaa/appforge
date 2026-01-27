import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle2, XCircle, AlertTriangle, Info, RefreshCw
} from 'lucide-react';

export default function ProjectHealthReport() {
  const { data: report, isLoading, refetch } = useQuery({
    queryKey: ['healthReport'],
    queryFn: async () => {
      const response = await base44.functions.invoke('runProjectDiagnostics', {});
      return response.data;
    }
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-500" />
          <p>Running diagnostics...</p>
        </CardContent>
      </Card>
    );
  }

  const issues = report?.issues || [];
  const warnings = report?.warnings || [];
  const suggestions = report?.suggestions || [];

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-500" />;
      default:
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">Errors</div>
                <div className="text-3xl font-bold text-red-600">{issues.length}</div>
              </div>
              <XCircle className="w-12 h-12 text-red-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">Warnings</div>
                <div className="text-3xl font-bold text-yellow-600">{warnings.length}</div>
              </div>
              <AlertTriangle className="w-12 h-12 text-yellow-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">Suggestions</div>
                <div className="text-3xl font-bold text-blue-600">{suggestions.length}</div>
              </div>
              <Info className="w-12 h-12 text-blue-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Issues */}
      {issues.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-500" />
                Critical Issues
              </CardTitle>
              <Badge variant="destructive">{issues.length}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {issues.map((issue, idx) => (
                <div key={idx} className="border-l-4 border-red-500 bg-red-50 p-4 rounded">
                  <div className="font-semibold text-red-900 mb-1">{issue.title}</div>
                  <p className="text-sm text-red-700">{issue.description}</p>
                  {issue.fix && (
                    <div className="mt-2 text-xs text-red-600 bg-red-100 p-2 rounded">
                      💡 Fix: {issue.fix}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              Warnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {warnings.map((warning, idx) => (
                <div key={idx} className="border-l-4 border-yellow-500 bg-yellow-50 p-4 rounded">
                  <div className="font-semibold text-yellow-900 mb-1">{warning.title}</div>
                  <p className="text-sm text-yellow-700">{warning.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="w-5 h-5 text-blue-500" />
              Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {suggestions.map((suggestion, idx) => (
                <div key={idx} className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded">
                  <div className="font-semibold text-blue-900 mb-1">{suggestion.title}</div>
                  <p className="text-sm text-blue-700">{suggestion.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {issues.length === 0 && warnings.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-green-500" />
            <h3 className="text-xl font-bold mb-2">All Systems Operational</h3>
            <p className="text-gray-500">No issues detected in your project</p>
          </CardContent>
        </Card>
      )}

      <Button onClick={() => refetch()} variant="outline" className="w-full">
        <RefreshCw className="w-4 h-4 mr-2" />
        Re-run Diagnostics
      </Button>
    </div>
  );
}