import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, Webhook, Link2, Activity, CheckCircle2, 
  XCircle, Settings, Trash2, Play, Pause, Copy
} from 'lucide-react';
import { toast } from 'sonner';
import IntegrationSetupModal from '@/components/bots/IntegrationSetupModal';
import IntegrationDetailsPanel from '@/components/bots/IntegrationDetailsPanel';

const platformIcons = {
  zapier: '⚡',
  make: '🔷',
  n8n: '🔗',
  integromat: '🔶',
  custom_api: '🔧',
  webhooks: '🪝',
  other: '🔌'
};

export default function ExternalBotIntegrations() {
  const [showSetup, setShowSetup] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState(null);
  const queryClient = useQueryClient();

  const { data: integrations = [], isLoading } = useQuery({
    queryKey: ['externalBotIntegrations'],
    queryFn: () => base44.entities.ExternalBotIntegration.list('-created_date')
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }) => 
      base44.entities.ExternalBotIntegration.update(id, { is_active: !isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries(['externalBotIntegrations']);
      toast.success('Integration status updated');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ExternalBotIntegration.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['externalBotIntegrations']);
      toast.success('Integration deleted');
      setSelectedIntegration(null);
    }
  });

  const testIntegrationMutation = useMutation({
    mutationFn: (id) => base44.functions.invoke('testExternalIntegration', { integration_id: id }),
    onSuccess: (response) => {
      if (response.data.success) {
        toast.success('Test successful! Integration is working.');
      } else {
        toast.error(`Test failed: ${response.data.error}`);
      }
    }
  });

  const copyWebhookUrl = (url) => {
    navigator.clipboard.writeText(url);
    toast.success('Webhook URL copied to clipboard');
  };

  const activeIntegrations = integrations.filter(i => i.is_active);
  const inactiveIntegrations = integrations.filter(i => !i.is_active);

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">External Bot Integrations</h1>
          <p className="text-gray-500">Connect workflows from Zapier, Make.com, and custom APIs</p>
        </div>
        <Button onClick={() => setShowSetup(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Integration
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{integrations.length}</div>
            <div className="text-sm text-gray-500">Total Integrations</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{activeIntegrations.length}</div>
            <div className="text-sm text-gray-500">Active</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {integrations.reduce((sum, i) => sum + (i.success_count || 0), 0)}
            </div>
            <div className="text-sm text-gray-500">Successful Syncs</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">
              {integrations.reduce((sum, i) => sum + (i.error_count || 0), 0)}
            </div>
            <div className="text-sm text-gray-500">Errors</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">Active ({activeIntegrations.length})</TabsTrigger>
          <TabsTrigger value="inactive">Inactive ({inactiveIntegrations.length})</TabsTrigger>
          <TabsTrigger value="all">All ({integrations.length})</TabsTrigger>
        </TabsList>

        {['active', 'inactive', 'all'].map(tab => (
          <TabsContent key={tab} value={tab}>
            {isLoading ? (
              <div className="text-center py-12">
                <Activity className="w-8 h-8 animate-spin mx-auto mb-2 text-gray-400" />
                <p className="text-gray-500">Loading integrations...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {(tab === 'active' ? activeIntegrations : 
                  tab === 'inactive' ? inactiveIntegrations : integrations).map(integration => (
                  <Card 
                    key={integration.id}
                    className={`cursor-pointer transition-all ${
                      selectedIntegration?.id === integration.id ? 'ring-2 ring-blue-500' : ''
                    }`}
                    onClick={() => setSelectedIntegration(integration)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="text-3xl">{platformIcons[integration.platform]}</div>
                          <div>
                            <CardTitle className="text-lg">{integration.name}</CardTitle>
                            <CardDescription className="capitalize">
                              {integration.platform.replace('_', ' ')}
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant={integration.is_active ? 'default' : 'secondary'}>
                            {integration.is_active ? 'Active' : 'Paused'}
                          </Badge>
                          {integration.last_sync_status === 'success' && (
                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                          )}
                          {integration.last_sync_status === 'error' && (
                            <XCircle className="w-5 h-5 text-red-500" />
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm">
                          <Link2 className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600 capitalize">
                            {integration.integration_type.replace('_', ' ')}
                          </span>
                        </div>

                        {integration.webhook_url && (
                          <div className="flex items-center gap-2">
                            <code className="text-xs bg-gray-100 px-2 py-1 rounded flex-1 truncate">
                              {integration.webhook_url}
                            </code>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                copyWebhookUrl(integration.webhook_url);
                              }}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        )}

                        <div className="flex gap-2 pt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleActiveMutation.mutate({ 
                                id: integration.id, 
                                isActive: integration.is_active 
                              });
                            }}
                          >
                            {integration.is_active ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              testIntegrationMutation.mutate(integration.id);
                            }}
                            disabled={testIntegrationMutation.isPending}
                          >
                            Test
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedIntegration(integration);
                            }}
                          >
                            <Settings className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm('Delete this integration?')) {
                                deleteMutation.mutate(integration.id);
                              }
                            }}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {!isLoading && (tab === 'active' ? activeIntegrations : 
              tab === 'inactive' ? inactiveIntegrations : integrations).length === 0 && (
              <Card className="text-center py-12">
                <Webhook className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-semibold mb-2">No integrations found</h3>
                <p className="text-gray-500 mb-4">Connect your first external bot or workflow</p>
                <Button onClick={() => setShowSetup(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Integration
                </Button>
              </Card>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Details Panel */}
      {selectedIntegration && (
        <IntegrationDetailsPanel
          integration={selectedIntegration}
          onClose={() => setSelectedIntegration(null)}
        />
      )}

      {/* Setup Modal */}
      <IntegrationSetupModal
        open={showSetup}
        onClose={() => setShowSetup(false)}
      />
    </div>
  );
}