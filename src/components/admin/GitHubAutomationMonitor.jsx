import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Github, RefreshCw, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';

export default function GitHubAutomationMonitor() {
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: automationLogs = [], isLoading, refetch } = useQuery({
    queryKey: ['githubAutomationLogs'],
    queryFn: () => base44.entities.GitHubAutomationLog.list('-ran_at', 50),
  });

  useEffect(() => {
    setLogs(automationLogs);
  }, [automationLogs]);

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await refetch();
      toast.success('Logs refreshed');
    } catch (error) {
      toast.error('Failed to refresh logs');
    } finally {
      setIsRefreshing(false);
    }
  };

  const filteredLogs = logs.filter(log =>
    log.repo_name.toLowerCase().includes(filter.toLowerCase()) ||
    log.repo_owner.toLowerCase().includes(filter.toLowerCase())
  );

  const stats = {
    total: logs.length,
    success: logs.filter(l => l.status === 'success').length,
    failed: logs.filter(l => l.status === 'error').length,
    totalCommits: logs.reduce((sum, l) => sum + (l.commits_made || 0), 0),
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      success: 'bg-green-100 text-green-700',
      error: 'bg-red-100 text-red-700',
      warning: 'bg-yellow-100 text-yellow-700',
      skipped: 'bg-gray-100 text-gray-700',
    };
    return variants[status] || variants.skipped;
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
              <p className="text-sm text-gray-600">Total Runs</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{stats.success}</div>
              <p className="text-sm text-gray-600">Successful</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">{stats.failed}</div>
              <p className="text-sm text-gray-600">Failed</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{stats.totalCommits}</div>
              <p className="text-sm text-gray-600">Total Commits</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Logs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Github className="w-5 h-5" />
              <div>
                <CardTitle>Automation Logs</CardTitle>
                <CardDescription>Last 50 execution records</CardDescription>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Filter by repo name or owner..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="mb-4"
          />

          {filteredLogs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Clock className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>No automation logs yet</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1">
                      {getStatusIcon(log.status)}
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 text-sm">
                          {log.repo_owner}/{log.repo_name}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">{log.message}</p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                          <span>{format(new Date(log.ran_at), 'MMM dd, HH:mm:ss')}</span>
                          {log.execution_time_ms && (
                            <>
                              <span>•</span>
                              <span>{log.execution_time_ms}ms</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge className={getStatusBadge(log.status)}>
                        {log.status}
                      </Badge>
                      {(log.commits_made > 0 || log.files_scanned > 0) && (
                        <div className="text-xs text-gray-600 text-right">
                          {log.commits_made > 0 && <p>{log.commits_made} commits</p>}
                          {log.files_scanned > 0 && <p>{log.files_scanned} files</p>}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}