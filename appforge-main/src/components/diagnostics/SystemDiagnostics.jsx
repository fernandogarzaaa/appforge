import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function SystemDiagnostics() {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const runDiagnostics = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('comprehensiveDiagnostics', {});
      setResults(response.data);
      toast.success('Diagnostics completed');
    } catch (error) {
      toast.error('Failed to run diagnostics');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">System Diagnostics</h2>
          <p className="text-gray-500 mt-1">Run comprehensive health checks</p>
        </div>
        <Button onClick={runDiagnostics} disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          {loading ? 'Running...' : 'Run Diagnostics'}
        </Button>
      </div>

      {results && (
        <div className="space-y-4">
          {results.checks?.map((check, idx) => (
            <Card key={idx}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{check.name}</CardTitle>
                  {check.status === 'pass' ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">{check.message}</p>
                {check.suggestion && (
                  <p className="text-xs text-gray-500 mt-2"><strong>Suggestion:</strong> {check.suggestion}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}