import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Copy, Activity, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export default function IntegrationDetailsPanel({ integration, onClose }) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');

  const { data: logs = [] } = useQuery({
    queryKey: ['integrationLogs', integration.id],
    queryFn: async () => {
      const response = await base44.functions.invoke('getIntegrationLogs', { 
        integration_id: integration.id,
        limit: 50 
      });
      return response.data.logs || [];
    }
  });

  const updateMutation = useMutation({
    mutationFn: (updates) => base44.entities.ExternalBotIntegration.update(integration.id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries(['externalBotIntegrations']);
      toast.success('Integration updated');
    }
  });

  const syncNowMutation = useMutation({
    mutationFn: () => base44.functions.invoke('triggerIntegrationSync', { integration_id: integration.id }),
    onSuccess: () => {
      toast.success('Sync triggered');
      queryClient.invalidateQueries(['integrationLogs', integration.id]);
    }
  });

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {integration.name}
            <Badge variant={integration.is_active ? 'default' : 'secondary'}>
              {integration.is_active ? 'Active' : 'Paused'}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="configuration">Configuration</TabsTrigger>
            <TabsTrigger value="logs">Activity Logs</TabsTrigger>
            <TabsTrigger value="testing">Testing</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-500">Platform</Label>
                <div className="font-medium capitalize">{integration.platform.replace('_', ' ')}</div>
              </div>
              <div>
                <Label className="text-gray-500">Type</Label>
                <div className="font-medium capitalize">{integration.integration_type.replace('_', ' ')}</div>
              </div>
              <div>
                <Label className="text-gray-500">Success Count</Label>
                <div className="font-medium text-green-600">{integration.success_count || 0}</div>
              </div>
              <div>
                <Label className="text-gray-500">Error Count</Label>
                <div className="font-medium text-red-600">{integration.error_count || 0}</div>
              </div>
            </div>

            {integration.webhook_url && (
              <div>
                <Label>Webhook URL</Label>
                <div className="flex gap-2 mt-1">
                  <Input value={integration.webhook_url} readOnly className="font-mono text-sm" />
                  <Button variant="outline" onClick={() => copyToClipboard(integration.webhook_url)}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Use this URL in your {integration.platform} workflow to send data here
                </p>
              </div>
            )}

            {integration.api_endpoint && (
              <div>
                <Label>API Endpoint</Label>
                <div className="flex gap-2 mt-1">
                  <Input value={integration.api_endpoint} readOnly className="font-mono text-sm" />
                  <Badge variant="outline">{integration.api_method}</Badge>
                </div>
              </div>
            )}

            {integration.last_sync_at && (
              <div>
                <Label className="text-gray-500">Last Sync</Label>
                <div className="flex items-center gap-2">
                  <span>{new Date(integration.last_sync_at).toLocaleString()}</span>
                  {integration.last_sync_status === 'success' && (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  )}
                  {integration.last_sync_status === 'error' && (
                    <XCircle className="w-4 h-4 text-red-500" />
                  )}
                </div>
              </div>
            )}

            <Button 
              onClick={() => syncNowMutation.mutate()}
              disabled={syncNowMutation.isPending}
              className="w-full"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${syncNowMutation.isPending ? 'animate-spin' : ''}`} />
              Sync Now
            </Button>
          </TabsContent>

          <TabsContent value="configuration" className="space-y-4">
            <div>
              <Label>Target Entity</Label>
              <Input 
                value={integration.target_entity || ''} 
                onChange={(e) => updateMutation.mutate({ target_entity: e.target.value })}
                placeholder="Entity name to store data"
              />
            </div>

            <div>
              <Label>Authentication Type</Label>
              <Input value={integration.authentication?.type || 'None'} readOnly />
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h4 className="font-semibold mb-2">⚠️ Advanced Configuration</h4>
              <p className="text-sm text-gray-700">
                Field mapping and advanced settings can be configured via API or backend functions.
                Contact your developer for custom transformations.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="logs" className="space-y-2">
            <div className="flex justify-between items-center mb-2">
              <Label>Recent Activity</Label>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => queryClient.invalidateQueries(['integrationLogs', integration.id])}
              >
                <RefreshCw className="w-3 h-3" />
              </Button>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {logs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No activity yet</p>
                </div>
              ) : (
                logs.map((log, idx) => (
                  <div key={idx} className="border rounded-lg p-3 bg-white">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {log.status === 'success' ? (
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-500" />
                          )}
                          <span className="font-medium">{log.action}</span>
                        </div>
                        {log.message && (
                          <p className="text-sm text-gray-600">{log.message}</p>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="testing" className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold mb-2">Test Your Integration</h4>
              <p className="text-sm text-gray-700 mb-4">
                Send test data to verify your integration is working correctly.
              </p>

              {integration.integration_type === 'incoming_webhook' && (
                <div className="space-y-2">
                  <Label>Sample cURL command:</Label>
                  <pre className="bg-gray-900 text-gray-100 p-3 rounded text-xs overflow-x-auto">
{`curl -X POST ${integration.webhook_url} \\
  -H "Content-Type: application/json" \\
  -d '{"test": "data", "timestamp": "${new Date().toISOString()}"}'`}
                  </pre>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => copyToClipboard(`curl -X POST ${integration.webhook_url} -H "Content-Type: application/json" -d '{"test": "data"}'`)}
                  >
                    <Copy className="w-3 h-3 mr-2" />
                    Copy cURL Command
                  </Button>
                </div>
              )}

              {integration.integration_type === 'outgoing_webhook' && (
                <p className="text-sm">
                  Trigger events in your app to test outgoing webhooks. Check your external endpoint logs.
                </p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}