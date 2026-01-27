import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Clock, Loader2, ChevronDown } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function PipelineRunsViewer({ botId }) {
  const [selectedRun, setSelectedRun] = useState(null);
  const [expandedRun, setExpandedRun] = useState(null);

  const { data: runs = [] } = useQuery({
    queryKey: ['pipelineRuns', botId],
    queryFn: () => base44.entities.PipelineRun.filter({ bot_id: botId }, '-started_at')
  });

  const getStatusIcon = (status) => {
    switch (status) {
      case 'passed': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'running': return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'pending': return <Clock className="w-4 h-4 text-gray-500" />;
      default: return null;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'passed': return 'bg-green-50 border-green-200';
      case 'failed': return 'bg-red-50 border-red-200';
      case 'running': return 'bg-blue-50 border-blue-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold">Pipeline Runs ({runs.length})</h3>
        <p className="text-xs text-gray-600">Latest executions</p>
      </div>

      <div className="space-y-2">
        {runs.length > 0 ? (
          runs.slice(0, 20).map((run) => (
            <Card key={run.id} className={`border cursor-pointer transition-colors ${getStatusColor(run.status)}`}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(run.status)}
                      <span className="font-semibold text-sm">
                        {run.trigger_source === 'push' ? '📤 Push' : 
                         run.trigger_source === 'pull_request' ? '🔀 PR' :
                         run.trigger_source === 'manual' ? '👤 Manual' : '⏰ Scheduled'}
                        {' '}{run.git_ref}
                      </span>
                      <Badge variant={run.status === 'passed' ? 'default' : run.status === 'failed' ? 'destructive' : 'secondary'} className="text-xs">
                        {run.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">{run.commit_message || `Commit: ${run.commit_hash?.slice(0, 7)}`}</p>
                    <div className="flex gap-4 mt-2 text-xs text-gray-600">
                      <span>By: {run.author_email}</span>
                      <span>Duration: {run.duration_seconds ? `${run.duration_seconds.toFixed(1)}s` : '—'}</span>
                      <span>{new Date(run.started_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setExpandedRun(expandedRun === run.id ? null : run.id)}
                  >
                    <ChevronDown className={`w-4 h-4 transition-transform ${expandedRun === run.id ? 'rotate-180' : ''}`} />
                  </Button>
                </div>

                {expandedRun === run.id && (
                  <div className="mt-4 pt-4 border-t space-y-3">
                    {/* Stage Results */}
                    {run.stage_results && run.stage_results.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold mb-2">Stages</p>
                        <div className="space-y-1">
                          {run.stage_results.map((stage, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-xs">
                              {stage.status === 'passed' ? (
                                <CheckCircle2 className="w-3 h-3 text-green-500" />
                              ) : (
                                <XCircle className="w-3 h-3 text-red-500" />
                              )}
                              <span>{stage.stage_name}</span>
                              <span className="text-gray-500">{stage.duration_seconds?.toFixed(1)}s</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Test Results */}
                    {run.test_results && (
                      <div className="p-2 bg-white rounded border text-xs">
                        <p className="font-semibold mb-1">Tests</p>
                        <p>{run.test_results.passed_tests}/{run.test_results.total_tests} passed</p>
                      </div>
                    )}

                    {/* Logs */}
                    {run.logs && run.logs.length > 0 && (
                      <div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full text-xs"
                          onClick={() => setSelectedRun(run)}
                        >
                          View Full Logs
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-sm text-gray-500">No pipeline runs yet</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Logs Modal */}
      {selectedRun && (
        <Dialog open={!!selectedRun} onOpenChange={() => setSelectedRun(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Pipeline Run Logs</DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              <div className="p-3 bg-gray-900 rounded text-xs text-gray-100 font-mono max-h-96 overflow-y-auto">
                {selectedRun.logs?.map((log, idx) => (
                  <div key={idx}>{log}</div>
                ))}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}