import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { 
  Activity, CheckCircle2, XCircle, Clock, ArrowRight, 
  ArrowLeft, Search, Filter, RefreshCw, Code
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function WebhookMonitor() {
  const [selectedLog, setSelectedLog] = useState(null);
  const [filter, setFilter] = useState({ status: 'all', direction: 'all' });
  const [search, setSearch] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);

  const { data: logs = [], refetch } = useQuery({
    queryKey: ['webhookLogs', filter],
    queryFn: async () => {
      let query = {};
      if (filter.status !== 'all') query.status = filter.status;
      if (filter.direction !== 'all') query.direction = filter.direction;
      return await base44.entities.WebhookLog.filter(query, '-created_date', 100);
    },
    refetchInterval: autoRefresh ? 5000 : false
  });

  const { data: integrations = [] } = useQuery({
    queryKey: ['integrations'],
    queryFn: () => base44.entities.ExternalBotIntegration.list()
  });

  const integrationMap = Object.fromEntries(integrations.map(i => [i.id, i]));

  const filteredLogs = logs.filter(log => {
    if (!search) return true;
    const integration = integrationMap[log.integration_id];
    return integration?.name?.toLowerCase().includes(search.toLowerCase()) ||
           log.error_message?.toLowerCase().includes(search.toLowerCase());
  });

  const stats = {
    total: logs.length,
    success: logs.filter(l => l.status === 'success').length,
    failed: logs.filter(l => l.status === 'failed').length,
    avgDuration: logs.length > 0 ? Math.round(logs.reduce((sum, l) => sum + (l.duration_ms || 0), 0) / logs.length) : 0
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Webhook Monitor</h1>
          <p className="text-gray-500">Real-time webhook activity and logs</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={autoRefresh ? 'default' : 'outline'}
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <Activity className={`w-4 h-4 mr-2 ${autoRefresh ? 'animate-pulse' : ''}`} />
            {autoRefresh ? 'Live' : 'Paused'}
          </Button>
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-gray-500">Total Requests</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{stats.success}</div>
            <div className="text-sm text-gray-500">Successful</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
            <div className="text-sm text-gray-500">Failed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.avgDuration}ms</div>
            <div className="text-sm text-gray-500">Avg Duration</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search logs..."
            className="pl-10"
          />
        </div>
        <Select value={filter.status} onValueChange={(v) => setFilter({ ...filter, status: v })}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="success">Success</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filter.direction} onValueChange={(v) => setFilter({ ...filter, direction: v })}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Direction</SelectItem>
            <SelectItem value="incoming">Incoming</SelectItem>
            <SelectItem value="outgoing">Outgoing</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Logs */}
      <div className="space-y-2">
        {filteredLogs.map(log => {
          const integration = integrationMap[log.integration_id];
          return (
            <Card 
              key={log.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedLog(log)}
            >
              <CardContent className="py-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 flex-1">
                    {log.status === 'success' ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : log.status === 'failed' ? (
                      <XCircle className="w-5 h-5 text-red-500" />
                    ) : (
                      <Clock className="w-5 h-5 text-yellow-500" />
                    )}
                    {log.direction === 'incoming' ? (
                      <ArrowRight className="w-4 h-4 text-blue-500" />
                    ) : (
                      <ArrowLeft className="w-4 h-4 text-purple-500" />
                    )}
                    <div className="flex-1">
                      <div className="font-medium">{integration?.name || 'Unknown Integration'}</div>
                      <div className="text-sm text-gray-500">
                        {new Date(log.created_date).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <Badge variant={log.status === 'success' ? 'default' : 'destructive'}>
                    {log.http_status || log.status}
                  </Badge>
                  {log.duration_ms && (
                    <span className="text-sm text-gray-500">{log.duration_ms}ms</span>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}

        {filteredLogs.length === 0 && (
          <Card className="text-center py-12">
            <Activity className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold mb-2">No Webhook Logs</h3>
            <p className="text-gray-500">Webhook activity will appear here</p>
          </Card>
        )}
      </div>

      {/* Log Details Modal */}
      {selectedLog && (
        <Dialog open={true} onOpenChange={() => setSelectedLog(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Code className="w-5 h-5" />
                Webhook Details
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-500">Status</div>
                  <Badge variant={selectedLog.status === 'success' ? 'default' : 'destructive'}>
                    {selectedLog.status}
                  </Badge>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Direction</div>
                  <div className="font-medium capitalize">{selectedLog.direction}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">HTTP Status</div>
                  <div className="font-medium">{selectedLog.http_status}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Duration</div>
                  <div className="font-medium">{selectedLog.duration_ms}ms</div>
                </div>
              </div>

              {selectedLog.request_body && (
                <div>
                  <div className="text-sm font-semibold mb-2">Request Body</div>
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs overflow-x-auto">
                    {JSON.stringify(selectedLog.request_body, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.response_body && (
                <div>
                  <div className="text-sm font-semibold mb-2">Response Body</div>
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs overflow-x-auto">
                    {JSON.stringify(selectedLog.response_body, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.error_message && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="text-sm font-semibold text-red-900 mb-1">Error</div>
                  <div className="text-sm text-red-700">{selectedLog.error_message}</div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}