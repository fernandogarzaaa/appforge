import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { AlertCircle, Plus, Trash2, Edit, TestTube } from 'lucide-react';
import { toast } from 'sonner';
import HelpTooltip from '@/components/help/HelpTooltip';

export default function AlertConfigManager({ monitoringRuleId }) {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    alert_channels: ['email'],
    recipient_emails: [],
    webhook_url: '',
    webhook_auth_header: '',
    severity_threshold: 'high',
    anomaly_risk_threshold: 70,
    confidence_threshold: 80,
    cooldown_minutes: 60,
    prediction_type: 'all'
  });

  const { data: configs = [] } = useQuery({
    queryKey: ['alert-configs', monitoringRuleId],
    queryFn: () => {
      if (monitoringRuleId) {
        return base44.entities.AlertConfiguration.filter({ monitoring_rule_id: monitoringRuleId });
      }
      return base44.entities.AlertConfiguration.list();
    }
  });

  const createMutation = useMutation({
    mutationFn: (data) => {
      const payload = {
        ...data,
        monitoring_rule_id: monitoringRuleId
      };
      if (editingId) {
        return base44.entities.AlertConfiguration.update(editingId, payload);
      }
      return base44.entities.AlertConfiguration.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alert-configs'] });
      toast.success(editingId ? 'Alert updated' : 'Alert created');
      resetForm();
      setIsOpen(false);
    },
    onError: () => toast.error('Failed to save alert')
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.AlertConfiguration.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alert-configs'] });
      toast.success('Alert deleted');
    }
  });

  const testMutation = useMutation({
    mutationFn: async (config) => {
      const testPayload = {
        test: true,
        alert_config: config,
        timestamp: new Date().toISOString(),
        anomaly_details: {
          title: 'Test Alert',
          description: 'This is a test alert notification',
          variance_percent: 15.5
        }
      };

      if (config.webhook_url) {
        const response = await fetch(config.webhook_url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(config.webhook_auth_header && { 'Authorization': config.webhook_auth_header })
          },
          body: JSON.stringify(testPayload)
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
      }

      if (config.recipient_emails.includes('test')) {
        await base44.integrations.Core.SendEmail({
          to: config.recipient_emails[0] || 'admin@example.com',
          subject: '[TEST] Anomaly Detection Alert',
          body: `Test alert configuration is working!\n\n${JSON.stringify(testPayload, null, 2)}`
        });
      }

      return 'Test sent';
    },
    onSuccess: () => toast.success('Test alert sent!'),
    onError: (error) => toast.error('Test failed: ' + error.message)
  });

  const resetForm = () => {
    setFormData({
      name: '',
      alert_channels: ['email'],
      recipient_emails: [],
      webhook_url: '',
      webhook_auth_header: '',
      severity_threshold: 'high',
      anomaly_risk_threshold: 70,
      confidence_threshold: 80,
      cooldown_minutes: 60,
      prediction_type: 'all'
    });
    setEditingId(null);
  };

  const startEdit = (config) => {
    setFormData({ ...config });
    setEditingId(config.id);
    setIsOpen(true);
  };

  const handleChannelChange = (channel) => {
    setFormData(prev => ({
      ...prev,
      alert_channels: prev.alert_channels.includes(channel)
        ? prev.alert_channels.filter(c => c !== channel)
        : [...prev.alert_channels, channel]
    }));
  };

  const handleEmailChange = (e) => {
    const emails = e.target.value.split(',').map(email => email.trim()).filter(Boolean);
    setFormData(prev => ({ ...prev, recipient_emails: emails }));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          Alert Configurations
        </h3>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={resetForm}>
              <Plus className="w-3.5 h-3.5 mr-1" />
              New Alert
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-96 overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Alert' : 'Create Alert Configuration'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Alert Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., High Risk Anomaly Alert"
                />
              </div>

              <div>
                <Label>Alert Channels</Label>
                <div className="space-y-2 mt-2">
                  {['email', 'webhook', 'in_app'].map(channel => (
                    <div key={channel} className="flex items-center gap-2">
                      <Checkbox
                        checked={formData.alert_channels.includes(channel)}
                        onCheckedChange={() => handleChannelChange(channel)}
                      />
                      <Label className="capitalize cursor-pointer">{channel}</Label>
                    </div>
                  ))}
                </div>
              </div>

              {formData.alert_channels.includes('email') && (
                <div>
                  <Label>Recipient Emails (comma-separated)</Label>
                  <Input
                    value={formData.recipient_emails.join(', ')}
                    onChange={handleEmailChange}
                    placeholder="admin@example.com, ops@example.com"
                  />
                </div>
              )}

              {formData.alert_channels.includes('webhook') && (
                <>
                  <div>
                    <Label>Webhook URL</Label>
                    <Input
                      value={formData.webhook_url}
                      onChange={(e) => setFormData(prev => ({ ...prev, webhook_url: e.target.value }))}
                      placeholder="https://api.example.com/webhooks/alerts"
                    />
                  </div>
                  <div>
                    <Label>Auth Header (optional)</Label>
                    <Input
                      value={formData.webhook_auth_header}
                      onChange={(e) => setFormData(prev => ({ ...prev, webhook_auth_header: e.target.value }))}
                      placeholder="Bearer token or API key"
                    />
                  </div>
                </>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Severity Threshold</Label>
                  <Select value={formData.severity_threshold} onValueChange={(v) => setFormData(prev => ({ ...prev, severity_threshold: v }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Prediction Type</Label>
                  <Select value={formData.prediction_type} onValueChange={(v) => setFormData(prev => ({ ...prev, prediction_type: v }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="anomaly">Anomalies</SelectItem>
                      <SelectItem value="threshold_breach">Threshold Breaches</SelectItem>
                      <SelectItem value="trend_change">Trend Changes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Anomaly Risk Threshold: {formData.anomaly_risk_threshold}%</Label>
                <Slider
                  min={0}
                  max={100}
                  step={5}
                  value={[formData.anomaly_risk_threshold]}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, anomaly_risk_threshold: v[0] }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Confidence Threshold: {formData.confidence_threshold}%</Label>
                <Slider
                  min={0}
                  max={100}
                  step={5}
                  value={[formData.confidence_threshold]}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, confidence_threshold: v[0] }))}
                />
              </div>

              <div>
                <Label>Cooldown (minutes between alerts)</Label>
                <Input
                  type="number"
                  value={formData.cooldown_minutes}
                  onChange={(e) => setFormData(prev => ({ ...prev, cooldown_minutes: parseInt(e.target.value) || 0 }))}
                  min={0}
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={() => createMutation.mutate(formData)} className="flex-1" disabled={createMutation.isPending || !formData.name}>
                  {editingId ? 'Update Alert' : 'Create Alert'}
                </Button>
                {formData.alert_channels.length > 0 && (
                  <Button variant="outline" onClick={() => testMutation.mutate(formData)} disabled={testMutation.isPending}>
                    Test
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2">
        {configs.length === 0 ? (
          <p className="text-sm text-gray-500 py-4">No alert configurations</p>
        ) : (
          configs.map(config => (
            <Card key={config.id}>
              <CardContent className="py-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{config.name}</p>
                    <div className="flex gap-2 mt-2 flex-wrap">
                      <Badge variant="outline" className="text-xs">{config.severity_threshold}</Badge>
                      {config.alert_channels.map(c => (
                        <Badge key={c} className="text-xs bg-blue-100 text-blue-800">{c}</Badge>
                      ))}
                      <Badge variant="outline" className="text-xs">{config.anomaly_risk_threshold}% risk</Badge>
                    </div>
                    {config.recipient_emails?.length > 0 && (
                      <p className="text-xs text-gray-500 mt-2">{config.recipient_emails.join(', ')}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => testMutation.mutate(config)} disabled={testMutation.isPending}>
                      <TestTube className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => startEdit(config)}>
                      <Edit className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => deleteMutation.mutate(config.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}