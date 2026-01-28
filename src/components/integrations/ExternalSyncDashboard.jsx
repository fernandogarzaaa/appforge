import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle2, AlertCircle, RefreshCw, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

export default function ExternalSyncDashboard() {
  const [showDialog, setShowDialog] = useState(false);
  const [editingSync, setEditingSync] = useState(null);
  const queryClient = useQueryClient();

  const { data: syncs } = useQuery({
    queryKey: ['external-analytics-syncs'],
    queryFn: () => base44.entities.ExternalAnalyticsSync.list('-created_date', 20)
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ExternalAnalyticsSync.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['external-analytics-syncs'] });
      toast.success('Sync configured');
      setShowDialog(false);
    }
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, active }) => base44.entities.ExternalAnalyticsSync.update(id, { is_active: active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['external-analytics-syncs'] });
      toast.success('Sync updated');
    }
  });

  const testMutation = useMutation({
    mutationFn: (id) => base44.entities.ExternalAnalyticsSync.update(id, { connection_status: 'testing' }),
    onSuccess: () => {
      toast.success('Testing connection...');
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['external-analytics-syncs'] });
      }, 2000);
    }
  });

  const activeSyncs = syncs?.filter(s => s.is_active) || [];
  const connectedSyncs = syncs?.filter(s => s.connection_status === 'connected') || [];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          External Analytics Sync
        </h3>
        <Button size="sm" onClick={() => { setEditingSync(null); setShowDialog(true); }}>
          Add Sync
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-2">
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-slate-600">Configured</p>
            <p className="text-2xl font-bold">{syncs?.length || 0}</p>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-4">
            <p className="text-xs text-green-600">Connected</p>
            <p className="text-2xl font-bold text-green-700">{connectedSyncs.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-slate-600">Active</p>
            <p className="text-2xl font-bold">{activeSyncs.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Syncs List */}
      <div className="space-y-2">
        {syncs?.map(sync => (
          <Card key={sync.id} className={sync.connection_status === 'connected' ? 'border-green-200 bg-green-50' : ''}>
            <CardContent className="pt-4">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h4 className="font-semibold flex items-center gap-2">
                    {sync.platform_name.toUpperCase()}
                    {sync.connection_status === 'connected' && (
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    )}
                    {sync.connection_status === 'error' && (
                      <AlertCircle className="w-4 h-4 text-red-600" />
                    )}
                  </h4>
                  <p className="text-sm text-slate-600 mt-1">
                    Direction: {sync.sync_direction} | Frequency: {sync.sync_frequency}
                  </p>
                </div>
                <Badge className={
                  sync.connection_status === 'connected' ? 'bg-green-600' :
                  sync.connection_status === 'error' ? 'bg-red-600' : 'bg-slate-400'
                }>
                  {sync.connection_status}
                </Badge>
              </div>

              {/* Sync Info */}
              {sync.last_sync && (
                <div className="text-xs text-slate-600 mb-3 p-2 bg-white rounded">
                  <p>Last Sync: {new Date(sync.last_sync).toLocaleTimeString()}</p>
                  <p>Records: {sync.records_synced_last} | Success Rate: {sync.success_rate || 0}%</p>
                </div>
              )}

              {/* Metrics Being Synced */}
              {sync.metrics_to_sync?.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-semibold text-slate-600 mb-1">Metrics:</p>
                  <div className="flex gap-1 flex-wrap">
                    {sync.metrics_to_sync.slice(0, 3).map((m, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {m.local_metric}
                      </Badge>
                    ))}
                    {sync.metrics_to_sync.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{sync.metrics_to_sync.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 flex-wrap">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => toggleMutation.mutate({ id: sync.id, active: !sync.is_active })}
                >
                  {sync.is_active ? 'Disable' : 'Enable'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => testMutation.mutate(sync.id)}
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Test
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => { setEditingSync(sync); setShowDialog(true); }}
                >
                  Config
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configure External Sync</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold">Platform</label>
              <Select defaultValue={editingSync?.platform_name || 'datadog'}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="datadog">Datadog</SelectItem>
                  <SelectItem value="new_relic">New Relic</SelectItem>
                  <SelectItem value="splunk">Splunk</SelectItem>
                  <SelectItem value="sumologic">SumoLogic</SelectItem>
                  <SelectItem value="grafana">Grafana</SelectItem>
                  <SelectItem value="elastic">Elastic</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-semibold">Sync Direction</label>
              <Select defaultValue={editingSync?.sync_direction || 'push'}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="push">Push (Send Data)</SelectItem>
                  <SelectItem value="pull">Pull (Receive Data)</SelectItem>
                  <SelectItem value="bidirectional">Bidirectional</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-semibold">Sync Frequency</label>
              <Select defaultValue={editingSync?.sync_frequency || '15min'}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="realtime">Real-time</SelectItem>
                  <SelectItem value="5min">Every 5 Minutes</SelectItem>
                  <SelectItem value="15min">Every 15 Minutes</SelectItem>
                  <SelectItem value="hourly">Hourly</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button className="w-full" onClick={() => createMutation.mutate({})}>
              Save Configuration
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}