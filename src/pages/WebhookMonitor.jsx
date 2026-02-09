import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Webhook, CheckCircle2, AlertCircle, Clock, TrendingUp, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import WebhookCreate from '@/components/webhook/WebhookCreate';

export default function WebhookMonitor() {
  const [selectedWebhook, setSelectedWebhook] = useState(null);
  const [openCreate, setOpenCreate] = useState(false);

  const { data: webhooks = [], isLoading: isLoadingWebhooks } = useQuery({
    queryKey: ['webhooks'],
    queryFn: () => base44.asServiceRole.entities.Webhook.list('-created_at')
  });

  const { data: deliveries = [], isLoading: isLoadingDeliveries } = useQuery({
    queryKey: ['webhook-deliveries'],
    queryFn: () => base44.asServiceRole.entities.WebhookDelivery.list('-created_at'),
    refetchInterval: 5000
  });

  const getStatusColor = (status) => {
    const colors = {
      success: 'bg-green-50 border-green-200 text-green-800',
      failed: 'bg-red-50 border-red-200 text-red-800',
      pending: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      retrying: 'bg-blue-50 border-blue-200 text-blue-800'
    };
    return colors[status] || 'bg-gray-50 border-gray-200 text-gray-800';
  };

  const getStatusIcon = (status) => {
    const icons = {
      success: CheckCircle2,
      failed: AlertCircle,
      pending: Clock,
      retrying: Clock
    };
    return icons[status] || Clock;
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Webhook Monitor</h1>
          <p className="text-gray-600">Track webhook deliveries, retries, and logs in real-time</p>
        </div>
        <Button onClick={() => setOpenCreate(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" /> Create Webhook
        </Button>
      </div>

      <WebhookCreate open={openCreate} onOpenChange={setOpenCreate} />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">Total Webhooks</p>
            <p className="text-3xl font-bold">{webhooks.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">Deliveries</p>
            <p className="text-3xl font-bold">{deliveries.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">Success Rate</p>
            <p className="text-3xl font-bold">
              {deliveries.length > 0
                ? ((deliveries.filter(d => d.status === 'success').length / deliveries.length) * 100).toFixed(1)
                : 0}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">Active Webhooks</p>
            <p className="text-3xl font-bold">{webhooks.filter(w => w.is_active).length}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="webhooks" className="space-y-4">
        <TabsList>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="deliveries">Deliveries</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>

        {/* Webhooks Tab */}
        <TabsContent value="webhooks" className="space-y-4">
          {webhooks.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center">
                <Webhook className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">No webhooks configured</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {webhooks.map((webhook, idx) => (
                <motion.div
                  key={webhook.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card className="hover:shadow-lg transition-all cursor-pointer" onClick={() => setSelectedWebhook(webhook)}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <p className="font-semibold">{webhook.url}</p>
                            <Badge variant={webhook.is_active ? 'default' : 'secondary'}>
                              {webhook.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap gap-1 mb-2">
                            {webhook.events.map(event => (
                              <Badge key={event} variant="outline" className="text-xs">{event}</Badge>
                            ))}
                          </div>
                          <div className="text-xs text-gray-600 space-x-4">
                            <span>✓ {webhook.success_count} successful</span>
                            <span>✗ {webhook.failure_count} failed</span>
                            <span>Last: {webhook.last_triggered ? format(new Date(webhook.last_triggered), 'PPpp') : 'Never'}</span>
                          </div>
                        </div>
                        <TrendingUp className="w-5 h-5 text-gray-400" />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Deliveries Tab */}
        <TabsContent value="deliveries" className="space-y-4">
          {deliveries.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center">
                <CheckCircle2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">No deliveries yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {deliveries.map((delivery, idx) => {
                const StatusIcon = getStatusIcon(delivery.status);
                return (
                  <motion.div
                    key={delivery.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.02 }}
                  >
                    <Card className={`border ${getStatusColor(delivery.status)}`}>
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            <StatusIcon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="font-semibold text-sm">{delivery.event_type}</p>
                              <p className="text-xs text-gray-600 mt-1">
                                Attempt {delivery.attempt_count} • {format(new Date(delivery.created_at), 'PPpp')}
                              </p>
                              {delivery.response_code && (
                                <p className="text-xs text-gray-600">HTTP {delivery.response_code}</p>
                              )}
                            </div>
                          </div>
                          <Badge variant="outline">{delivery.status}</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Logs Tab */}
        <TabsContent value="logs">
          <Card>
            <CardContent className="p-4">
              <div className="bg-gray-900 text-gray-100 font-mono text-xs p-4 rounded max-h-96 overflow-y-auto">
                {deliveries.slice(0, 20).map((delivery, idx) => (
                  <div key={delivery.id} className="mb-2 pb-2 border-b border-gray-700">
                    <span className="text-gray-500">[{format(new Date(delivery.created_at), 'HH:mm:ss')}]</span>
                    {' '}
                    <span className={delivery.status === 'success' ? 'text-green-400' : 'text-red-400'}>
                      {delivery.status.toUpperCase()}
                    </span>
                    {' - '} {delivery.event_type} {delivery.response_code && `(${delivery.response_code})`}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}