import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Zap, Slack, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function IntegrationTriggerManager() {
  const [showDialog, setShowDialog] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const queryClient = useQueryClient();

  const { data: rules } = useQuery({
    queryKey: ['integration-trigger-rules'],
    queryFn: () => base44.entities.IntegrationTriggerRule.list('-created_date', 50)
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.IntegrationTriggerRule.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integration-trigger-rules'] });
      toast.success('Trigger rule created');
      setShowDialog(false);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.IntegrationTriggerRule.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integration-trigger-rules'] });
      toast.success('Rule updated');
      setEditingRule(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.IntegrationTriggerRule.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integration-trigger-rules'] });
      toast.success('Rule deleted');
    }
  });

  const getIntegrationIcon = (type) => {
    const icons = {
      slack: <Slack className="w-4 h-4" />,
      pagerduty: <AlertCircle className="w-4 h-4" />,
      jira: <Zap className="w-4 h-4" />
    };
    return icons[type] || <Zap className="w-4 h-4" />;
  };

  const activeRules = rules?.filter(r => r.is_active) || [];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold flex items-center gap-2">
          <Zap className="w-5 h-5" />
          Integration Triggers
        </h3>
        <Button size="sm" onClick={() => { setEditingRule(null); setShowDialog(true); }}>
          Create Trigger
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-2">
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-slate-600">Total Rules</p>
            <p className="text-2xl font-bold">{rules?.length || 0}</p>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-4">
            <p className="text-xs text-green-600">Active</p>
            <p className="text-2xl font-bold text-green-700">{activeRules.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-slate-600">Total Executions</p>
            <p className="text-2xl font-bold">{rules?.reduce((sum, r) => sum + (r.executions_count || 0), 0)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Rules List */}
      <div className="space-y-2">
        {activeRules.map(rule => (
          <Card key={rule.id} className="border-l-4 border-l-blue-500">
            <CardContent className="pt-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-semibold">{rule.rule_name}</h4>
                  <p className="text-sm text-slate-600 mt-1">Triggered by: {rule.trigger_source}</p>
                </div>
                <Badge className="bg-blue-600">{rule.executions_count} runs</Badge>
              </div>

              {/* Target Integrations */}
              <div className="flex gap-2 mb-3">
                {rule.slack_config?.enabled && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    {getIntegrationIcon('slack')} Slack
                  </Badge>
                )}
                {rule.pagerduty_config?.enabled && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    {getIntegrationIcon('pagerduty')} PagerDuty
                  </Badge>
                )}
                {rule.jira_config?.enabled && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    {getIntegrationIcon('jira')} Jira
                  </Badge>
                )}
              </div>

              {/* Conditions */}
              <div className="text-sm text-slate-600 mb-3 p-2 bg-slate-50 rounded">
                {rule.trigger_conditions?.severity_threshold && (
                  <p>Minimum Severity: {rule.trigger_conditions.severity_threshold}</p>
                )}
                {rule.trigger_conditions?.anomaly_types?.length > 0 && (
                  <p>Anomaly Types: {rule.trigger_conditions.anomaly_types.join(', ')}</p>
                )}
              </div>

              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => { setEditingRule(rule); setShowDialog(true); }}>
                  Edit
                </Button>
                <Button size="sm" variant="outline" onClick={() => deleteMutation.mutate(rule.id)}>
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingRule ? 'Edit Trigger Rule' : 'Create Trigger Rule'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold">Rule Name</label>
              <Input placeholder="e.g., Critical Alert to Slack" defaultValue={editingRule?.rule_name} />
            </div>

            <div>
              <label className="text-sm font-semibold">Trigger Source</label>
              <Select defaultValue={editingRule?.trigger_source || 'anomaly_alert'}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="anomaly_alert">Anomaly Alert</SelectItem>
                  <SelectItem value="sla_breach">SLA Breach</SelectItem>
                  <SelectItem value="prediction">Prediction</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Integration Toggles */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm">Target Integrations</h4>
              
              <div className="flex items-center gap-2 p-3 border rounded">
                <Checkbox defaultChecked={editingRule?.slack_config?.enabled} />
                <Slack className="w-4 h-4" />
                <label className="text-sm">Send to Slack</label>
              </div>

              <div className="flex items-center gap-2 p-3 border rounded">
                <Checkbox defaultChecked={editingRule?.pagerduty_config?.enabled} />
                <AlertCircle className="w-4 h-4" />
                <label className="text-sm">Create PagerDuty Incident</label>
              </div>

              <div className="flex items-center gap-2 p-3 border rounded">
                <Checkbox defaultChecked={editingRule?.jira_config?.enabled} />
                <Zap className="w-4 h-4" />
                <label className="text-sm">Create Jira Ticket</label>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
              <Button onClick={() => {
                if (editingRule) {
                  updateMutation.mutate({ id: editingRule.id, data: {} });
                } else {
                  createMutation.mutate({});
                }
              }}>
                Save Rule
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}