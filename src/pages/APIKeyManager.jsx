import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAPIKeys } from '@/hooks/useAPIKeys';
import { 
  Plus, Key, Eye, EyeOff, Copy, Trash2, Shield, 
  AlertTriangle, CheckCircle2, Clock
} from 'lucide-react';
import { toast } from 'sonner';

export default function APIKeyManager() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKey, setNewKey] = useState(null);
  const { keys, createKey, revokeKey } = useAPIKeys();
  const queryClient = useQueryClient();

  const handleCreateKey = async (name, scopes) => {
    try {
      const newKey = await createKey(name, scopes);
      toast.success('API key created successfully');
      return newKey;
    } catch (error) {
      toast.error('Failed to create API key');
      throw error;
    }
  };

  const handleRevokeKey = async (keyId) => {
    try {
      await revokeKey(keyId);
      toast.success('API key revoked successfully');
    } catch (error) {
      toast.error('Failed to revoke API key');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const activeKeys = apiKeys.filter(k => k.is_active && !k.is_revoked);
  const revokedKeys = apiKeys.filter(k => k.is_revoked);

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">API Keys</h1>
          <p className="text-gray-500">Securely manage API keys for your integrations</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create API Key
        </Button>
      </div>

      {/* Security Notice */}
      <Card className="mb-6 border-amber-200 bg-amber-50">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Shield className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-amber-900 mb-1">Security Best Practices</h3>
              <ul className="text-sm text-amber-800 space-y-1">
                <li>• API keys are encrypted at rest and never stored in plain text</li>
                <li>• Copy new keys immediately - they won't be shown again</li>
                <li>• Revoke keys immediately if compromised</li>
                <li>• Use environment-specific keys (dev/staging/production)</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{activeKeys.length}</div>
            <div className="text-sm text-gray-500">Active Keys</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{revokedKeys.length}</div>
            <div className="text-sm text-gray-500">Revoked Keys</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {apiKeys.reduce((sum, k) => sum + (k.usage_count || 0), 0)}
            </div>
            <div className="text-sm text-gray-500">Total Uses</div>
          </CardContent>
        </Card>
      </div>

      {/* Active Keys */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3">Active Keys</h2>
        <div className="space-y-3">
          {activeKeys.map(key => (
            <Card key={key.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Key className="w-4 h-4 text-gray-400" />
                      <CardTitle className="text-base">{key.name}</CardTitle>
                      <Badge variant="outline" className="capitalize">{key.key_type.replace('_', ' ')}</Badge>
                      <Badge variant="secondary">{key.environment}</Badge>
                    </div>
                    {key.service_name && (
                      <CardDescription>Service: {key.service_name}</CardDescription>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowValue({ ...showValue, [key.id]: !showValue[key.id] })}
                    >
                      {showValue[key.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        if (confirm('Revoke this API key? This cannot be undone.')) {
                          revokeKeyMutation.mutate(key.id);
                        }
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <code className="bg-gray-100 px-2 py-1 rounded flex-1 font-mono text-xs">
                      {showValue[key.id] ? '••••••••••••••••' : `${key.key_prefix}••••••••••••••••`}
                    </code>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Used {key.usage_count || 0} times
                    </span>
                    {key.last_used_at && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Last used {new Date(key.last_used_at).toLocaleDateString()}
                      </span>
                    )}
                    {key.expires_at && (
                      <span className="flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-amber-500" />
                        Expires {new Date(key.expires_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {activeKeys.length === 0 && (
            <Card className="text-center py-12">
              <Key className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold mb-2">No Active Keys</h3>
              <p className="text-gray-500 mb-4">Create your first API key to get started</p>
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create API Key
              </Button>
            </Card>
          )}
        </div>
      </div>

      {/* Create Key Modal */}
      <CreateKeyModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={(data) => createKeyMutation.mutate(data)}
        isPending={createKeyMutation.isPending}
      />

      {/* New Key Display Modal */}
      {newKey && (
        <Dialog open={true} onOpenChange={() => setNewKey(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                API Key Created
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm text-amber-900 font-semibold mb-2">⚠️ Copy this key now!</p>
                <p className="text-xs text-amber-800">
                  For security reasons, you won't be able to see this key again.
                </p>
              </div>
              
              <div>
                <Label>API Key</Label>
                <div className="flex gap-2 mt-1">
                  <Input value={newKey.plain_value} readOnly className="font-mono text-sm" />
                  <Button onClick={() => copyToClipboard(newKey.plain_value)}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-gray-500">Key ID</Label>
                  <div className="font-medium">{newKey.key.id}</div>
                </div>
                <div>
                  <Label className="text-gray-500">Type</Label>
                  <div className="font-medium capitalize">{newKey.key.key_type.replace('_', ' ')}</div>
                </div>
              </div>

              <Button onClick={() => setNewKey(null)} className="w-full">
                I've Saved the Key
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function CreateKeyModal({ open, onClose, onSubmit, isPending }) {
  const [formData, setFormData] = useState({
    name: '',
    key_type: 'api_key',
    service_name: '',
    environment: 'production',
    plain_value: ''
  });

  const handleSubmit = () => {
    if (!formData.name || !formData.plain_value) {
      toast.error('Name and key value are required');
      return;
    }
    onSubmit(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create API Key</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Key Name *</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Xendit Production Key"
            />
          </div>

          <div>
            <Label>Service Name</Label>
            <Input
              value={formData.service_name}
              onChange={(e) => setFormData({ ...formData, service_name: e.target.value })}
              placeholder="e.g., Xendit, OpenAI, Zapier"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Key Type</Label>
              <Select value={formData.key_type} onValueChange={(v) => setFormData({ ...formData, key_type: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="api_key">API Key</SelectItem>
                  <SelectItem value="bearer_token">Bearer Token</SelectItem>
                  <SelectItem value="oauth_token">OAuth Token</SelectItem>
                  <SelectItem value="basic_auth">Basic Auth</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Environment</Label>
              <Select value={formData.environment} onValueChange={(v) => setFormData({ ...formData, environment: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="development">Development</SelectItem>
                  <SelectItem value="staging">Staging</SelectItem>
                  <SelectItem value="production">Production</SelectItem>
                  <SelectItem value="all">All</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>API Key Value *</Label>
            <Input
              type="password"
              value={formData.plain_value}
              onChange={(e) => setFormData({ ...formData, plain_value: e.target.value })}
              placeholder="Paste your API key here"
            />
            <p className="text-xs text-gray-500 mt-1">
              This will be encrypted and stored securely
            </p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isPending} className="flex-1">
              {isPending ? 'Creating...' : 'Create Key'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}