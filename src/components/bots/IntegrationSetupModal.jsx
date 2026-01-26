import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function IntegrationSetupModal({ open, onClose }) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    platform: 'zapier',
    integration_type: 'incoming_webhook',
    api_endpoint: '',
    api_method: 'POST',
    target_entity: '',
    authentication: {
      type: 'none'
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const response = await base44.functions.invoke('createExternalIntegration', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['externalBotIntegrations']);
      toast.success('Integration created successfully!');
      onClose();
      resetForm();
    },
    onError: (error) => {
      toast.error('Failed to create integration');
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      platform: 'zapier',
      integration_type: 'incoming_webhook',
      api_endpoint: '',
      api_method: 'POST',
      target_entity: '',
      authentication: { type: 'none' }
    });
    setStep(1);
  };

  const handleSubmit = () => {
    createMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add External Integration</DialogTitle>
        </DialogHeader>

        <Tabs value={`step${step}`} onValueChange={(v) => setStep(Number(v.replace('step', '')))}>
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="step1">Basic Info</TabsTrigger>
            <TabsTrigger value="step2">Connection</TabsTrigger>
            <TabsTrigger value="step3">Configuration</TabsTrigger>
          </TabsList>

          <TabsContent value="step1" className="space-y-4">
            <div>
              <Label>Integration Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Zapier CRM Sync"
              />
            </div>

            <div>
              <Label>Platform</Label>
              <Select value={formData.platform} onValueChange={(v) => setFormData({ ...formData, platform: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="zapier">Zapier</SelectItem>
                  <SelectItem value="make">Make.com</SelectItem>
                  <SelectItem value="n8n">n8n</SelectItem>
                  <SelectItem value="integromat">Integromat</SelectItem>
                  <SelectItem value="custom_api">Custom API</SelectItem>
                  <SelectItem value="webhooks">Webhooks</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Integration Type</Label>
              <Select value={formData.integration_type} onValueChange={(v) => setFormData({ ...formData, integration_type: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="incoming_webhook">Incoming Webhook (Receive data)</SelectItem>
                  <SelectItem value="outgoing_webhook">Outgoing Webhook (Send data)</SelectItem>
                  <SelectItem value="api_polling">API Polling</SelectItem>
                  <SelectItem value="bidirectional">Bidirectional</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={() => setStep(2)} className="w-full">Next</Button>
          </TabsContent>

          <TabsContent value="step2" className="space-y-4">
            {(formData.integration_type === 'outgoing_webhook' || formData.integration_type === 'api_polling') && (
              <>
                <div>
                  <Label>API Endpoint</Label>
                  <Input
                    value={formData.api_endpoint}
                    onChange={(e) => setFormData({ ...formData, api_endpoint: e.target.value })}
                    placeholder="https://api.example.com/webhook"
                  />
                </div>

                <div>
                  <Label>HTTP Method</Label>
                  <Select value={formData.api_method} onValueChange={(v) => setFormData({ ...formData, api_method: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GET">GET</SelectItem>
                      <SelectItem value="POST">POST</SelectItem>
                      <SelectItem value="PUT">PUT</SelectItem>
                      <SelectItem value="PATCH">PATCH</SelectItem>
                      <SelectItem value="DELETE">DELETE</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            <div>
              <Label>Authentication Type</Label>
              <Select 
                value={formData.authentication.type} 
                onValueChange={(v) => setFormData({ 
                  ...formData, 
                  authentication: { ...formData.authentication, type: v } 
                })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="api_key">API Key</SelectItem>
                  <SelectItem value="bearer">Bearer Token</SelectItem>
                  <SelectItem value="basic">Basic Auth</SelectItem>
                  <SelectItem value="oauth2">OAuth 2.0</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.authentication.type === 'api_key' && (
              <div>
                <Label>API Key Header Name</Label>
                <Input
                  value={formData.authentication.api_key_header || ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    authentication: { ...formData.authentication, api_key_header: e.target.value } 
                  })}
                  placeholder="X-API-Key"
                />
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">Back</Button>
              <Button onClick={() => setStep(3)} className="flex-1">Next</Button>
            </div>
          </TabsContent>

          <TabsContent value="step3" className="space-y-4">
            {formData.integration_type === 'incoming_webhook' && (
              <div>
                <Label>Target Entity (where to store data)</Label>
                <Input
                  value={formData.target_entity}
                  onChange={(e) => setFormData({ ...formData, target_entity: e.target.value })}
                  placeholder="e.g., Lead, Order, Contact"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Leave empty to log data only. Entity must exist.
                </p>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold mb-2">What happens next?</h4>
              <ul className="text-sm space-y-1 text-gray-700">
                {formData.integration_type === 'incoming_webhook' && (
                  <li>• You'll receive a unique webhook URL to use in {formData.platform}</li>
                )}
                {formData.integration_type === 'outgoing_webhook' && (
                  <li>• We'll send data to your endpoint when triggered</li>
                )}
                {formData.integration_type === 'api_polling' && (
                  <li>• We'll poll your API at regular intervals</li>
                )}
                <li>• You can configure field mapping after creation</li>
                <li>• Test the integration before going live</li>
              </ul>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(2)} className="flex-1">Back</Button>
              <Button 
                onClick={handleSubmit} 
                disabled={createMutation.isPending}
                className="flex-1"
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Integration'
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}