import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, Key, Webhook, Code2, AlertCircle, CheckCircle2, Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';

export default function APIManagement() {
  const [showNewKeyDialog, setShowNewKeyDialog] = useState(false);
  const [showDocumentation, setShowDocumentation] = useState(false);
  const [keyName, setKeyName] = useState('');
  const [newKeyData, setNewKeyData] = useState(null);
  const [copied, setCopied] = useState(false);
  const queryClient = useQueryClient();

  const { data: apiKeys = [], isLoading } = useQuery({
    queryKey: ['apiKeys'],
    queryFn: async () => {
      const result = await base44.entities.APIKey.list('-created_at');
      return Array.isArray(result) ? result : result?.data || [];
    }
  });

  const { data: webhooks = [] } = useQuery({
    queryKey: ['webhooks'],
    queryFn: async () => {
      const result = await base44.entities.Webhook.list('-created_at');
      return Array.isArray(result) ? result : result?.data || [];
    }
  });

  const createKeyMutation = useMutation({
    mutationFn: async (data) => {
      const response = await base44.functions.invoke('createAPIKey', data);
      return response.data;
    },
    onSuccess: (data) => {
      setNewKeyData(data.api_key);
      toast.success('API key created successfully');
      queryClient.invalidateQueries({ queryKey: ['apiKeys'] });
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create API key');
    }
  });

  const deleteKeyMutation = useMutation({
    mutationFn: (keyId) => base44.entities.APIKey.delete(keyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apiKeys'] });
      toast.success('API key deleted');
    }
  });

  const handleCreateKey = async () => {
    if (!keyName.trim()) {
      toast.error('Please enter a key name');
      return;
    }

    createKeyMutation.mutate({
      name: keyName,
      scopes: ['read:projects', 'read:entities', 'write:webhooks']
    });
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const maskSecret = (secret) => {
    return secret.slice(0, 8) + '•'.repeat(24) + secret.slice(-8);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">API & Webhooks</h1>
        <p className="text-gray-600">Manage API keys and configure webhooks for your integrations</p>
      </div>

      <Tabs defaultValue="keys" className="space-y-6">
        <TabsList>
          <TabsTrigger value="keys" className="gap-2">
            <Key className="w-4 h-4" />
            API Keys
          </TabsTrigger>
          <TabsTrigger value="webhooks" className="gap-2">
            <Webhook className="w-4 h-4" />
            Webhooks
          </TabsTrigger>
          <TabsTrigger value="docs" className="gap-2">
            <Code2 className="w-4 h-4" />
            Documentation
          </TabsTrigger>
        </TabsList>

        {/* API Keys Tab */}
        <TabsContent value="keys" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">API Keys</h2>
            <Button
              onClick={() => {
                setNewKeyData(null);
                setKeyName('');
                setShowNewKeyDialog(true);
              }}
              className="bg-gradient-to-r from-blue-600 to-cyan-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              New API Key
            </Button>
          </div>

          {isLoading ? (
            <Card><CardContent className="p-8 text-center">Loading API keys...</CardContent></Card>
          ) : apiKeys.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center">
                <Key className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">No API keys yet</p>
                <Button onClick={() => setShowNewKeyDialog(true)}>
                  Create Your First API Key
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {apiKeys.map(key => (
                <Card key={key.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <p className="font-semibold">{key.name}</p>
                          <Badge variant={key.is_active ? 'default' : 'secondary'}>
                            {key.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 font-mono">{key.key_id}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          Created: {new Date(key.created_at).toLocaleDateString()}
                          {key.expires_at && ` • Expires: ${new Date(key.expires_at).toLocaleDateString()}`}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (window.confirm('Delete this API key?')) {
                            deleteKeyMutation.mutate(key.id);
                          }
                        }}
                        className="text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Webhooks Tab */}
        <TabsContent value="webhooks" className="space-y-4">
          <h2 className="text-xl font-semibold">Webhooks</h2>
          {webhooks.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center">
                <Webhook className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">No webhooks configured</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {webhooks.map(webhook => (
                <Card key={webhook.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <p className="font-semibold">{webhook.url}</p>
                          <Badge variant={webhook.is_active ? 'default' : 'secondary'}>
                            {webhook.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {webhook.events?.map(event => (
                            <Badge key={event} variant="outline" className="text-xs">{event}</Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Documentation Tab */}
        <TabsContent value="docs" className="space-y-4">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>API Endpoints</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm font-mono text-gray-700 mb-2">GET /api/v1/projects</p>
                  <p className="text-xs text-gray-600">List all projects</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm font-mono text-gray-700 mb-2">POST /api/v1/projects</p>
                  <p className="text-xs text-gray-600">Create a new project</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm font-mono text-gray-700 mb-2">GET /api/v1/entities</p>
                  <p className="text-xs text-gray-600">List all entities</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm font-mono text-gray-700 mb-2">POST /api/v1/webhooks</p>
                  <p className="text-xs text-gray-600">Register a webhook</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Authentication</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                  <p className="text-sm font-mono">Authorization: Bearer key_xxx:secret_yyy</p>
                </div>
                <p className="text-sm text-gray-600 mt-4">All API requests must include your API key credentials in the Authorization header.</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* New API Key Dialog */}
      <Dialog open={showNewKeyDialog} onOpenChange={setShowNewKeyDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create API Key</DialogTitle>
          </DialogHeader>

          {!newKeyData ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Key Name</label>
                <Input
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                  placeholder="e.g., Production API Key"
                  className="border-gray-300"
                />
              </div>
              <Button
                onClick={handleCreateKey}
                disabled={createKeyMutation.isPending}
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600"
              >
                {createKeyMutation.isPending ? 'Creating...' : 'Create Key'}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                <div className="text-sm text-green-700">API key created successfully</div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold">Key ID</p>
                <div className="flex gap-2">
                  <Input value={newKeyData.key_id} readOnly className="font-mono text-xs" />
                  <Button size="icon" variant="outline" onClick={() => copyToClipboard(newKeyData.key_id)}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold">Secret Key (Save this - it won't be shown again!)</p>
                <div className="flex gap-2">
                  <Input value={newKeyData.key_secret} readOnly className="font-mono text-xs" />
                  <Button size="icon" variant="outline" onClick={() => copyToClipboard(newKeyData.key_secret)}>
                    {copied ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                <div className="text-xs text-amber-700">Keep your secret key safe. Never share it publicly.</div>
              </div>

              <Button onClick={() => setShowNewKeyDialog(false)} className="w-full">
                Done
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}