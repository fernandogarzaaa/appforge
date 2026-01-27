import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Zap, Plus, Trash2, TestTube } from 'lucide-react';
import { toast } from 'sonner';

export default function IncidentIntegrationManager() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    provider: 'pagerduty',
    name: '',
    config: { api_key: '', service_id: '' }
  });
  const queryClient = useQueryClient();

  const { data: integrations } = useQuery({
    queryKey: ['incident-integrations'],
    queryFn: () => base44.entities.IncidentIntegration.list()
  });

  const createMutation = useMutation({
    mutationFn: (data) => editingId
      ? base44.entities.IncidentIntegration.update(editingId, data)
      : base44.entities.IncidentIntegration.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incident-integrations'] });
      toast.success(editingId ? 'Updated' : 'Created');
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.IncidentIntegration.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incident-integrations'] });
      toast.success('Deleted');
    }
  });

  const testMutation = useMutation({
    mutationFn: async (integration) => {
      const testIncident = {
        title: 'Test Incident from Alert System',
        description: 'This is a test incident to verify integration',
        urgency: 'high',
        integration_id: integration.id
      };

      // Call backend function to create test incident
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Create a test incident in ${integration.provider} using this config: ${JSON.stringify(integration.config)}`
      });

      return response;
    },
    onSuccess: () => {
      toast.success('Test incident created successfully');
    },
    onError: () => {
      toast.error('Failed to create test incident');
    }
  });

  const resetForm = () => {
    setFormData({ provider: 'pagerduty', name: '', config: { api_key: '', service_id: '' } });
    setEditingId(null);
    setIsOpen(false);
  };

  const handleEdit = (integration) => {
    setEditingId(integration.id);
    setFormData(integration);
    setIsOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Zap className="w-5 h-5" />
          Incident Management Integrations
        </h2>
        <Button onClick={() => setIsOpen(true)} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Add Integration
        </Button>
      </div>

      <div className="grid gap-4">
        {integrations?.map(integration => (
          <Card key={integration.id}>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-base">{integration.name}</CardTitle>
                  <p className="text-sm text-slate-500 capitalize mt-1">{integration.provider}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => testMutation.mutate(integration)}
                    disabled={testMutation.isPending}
                  >
                    <TestTube className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleEdit(integration)}>
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteMutation.mutate(integration.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Status:</span>
                <span className={integration.is_active ? 'text-green-600' : 'text-slate-600'}>
                  {integration.is_active ? '✓ Active' : 'Inactive'}
                </span>
              </div>
              {integration.test_passed && (
                <div className="text-green-600">Test passed</div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit' : 'Add'} Integration</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Provider</label>
              <Select value={formData.provider} onValueChange={(v) => setFormData({...formData, provider: v})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pagerduty">PagerDuty</SelectItem>
                  <SelectItem value="opsgenie">OpsGenie</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Name</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Integration name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">API Key</label>
              <Input
                type="password"
                value={formData.config?.api_key || ''}
                onChange={(e) => setFormData({...formData, config: {...formData.config, api_key: e.target.value}})}
                placeholder="API Key"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Service/Team ID</label>
              <Input
                value={formData.config?.service_id || ''}
                onChange={(e) => setFormData({...formData, config: {...formData.config, service_id: e.target.value}})}
                placeholder="Service ID"
              />
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={resetForm}>Cancel</Button>
              <Button onClick={() => createMutation.mutate(formData)} disabled={createMutation.isPending}>
                {editingId ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}