import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, X, Zap, Mail, Target, Workflow } from 'lucide-react';

export default function TriggerBuilder({ triggers = [], onChange }) {
  const [conditions, setConditions] = useState(triggers);

  const addCondition = () => {
    const newCondition = {
      condition_type: 'severity',
      operator: 'equals',
      severity_match: ['high'],
      insight_type_match: []
    };
    const updated = [...conditions, newCondition];
    setConditions(updated);
    onChange(updated);
  };

  const updateCondition = (index, updates) => {
    const updated = conditions.map((c, i) => i === index ? { ...c, ...updates } : c);
    setConditions(updated);
    onChange(updated);
  };

  const removeCondition = (index) => {
    const updated = conditions.filter((_, i) => i !== index);
    setConditions(updated);
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Trigger Conditions</h3>
        <Button size="sm" variant="outline" onClick={addCondition}>
          <Plus className="w-3 h-3 mr-1" />
          Add Condition
        </Button>
      </div>

      {conditions.map((condition, index) => (
        <Card key={index} className="border-l-4 border-l-indigo-500">
          <CardContent className="p-3">
            <div className="flex items-start gap-2">
              <div className="flex-1 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-medium mb-1 block">When</label>
                    <Select
                      value={condition.condition_type}
                      onValueChange={(v) => updateCondition(index, { condition_type: v })}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="severity">Severity Level</SelectItem>
                        <SelectItem value="insight_type">Insight Type</SelectItem>
                        <SelectItem value="threshold">Threshold Value</SelectItem>
                        <SelectItem value="pattern">Pattern Detected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {condition.condition_type === 'severity' && (
                    <div>
                      <label className="text-xs font-medium mb-1 block">Matches</label>
                      <Select
                        value={condition.severity_match?.[0]}
                        onValueChange={(v) => updateCondition(index, { severity_match: [v] })}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="critical">Critical</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="low">Low</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {condition.condition_type === 'insight_type' && (
                    <div>
                      <label className="text-xs font-medium mb-1 block">Type</label>
                      <Select
                        value={condition.insight_type_match?.[0]}
                        onValueChange={(v) => updateCondition(index, { insight_type_match: [v] })}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="anomaly">Anomaly</SelectItem>
                          <SelectItem value="opportunity">Opportunity</SelectItem>
                          <SelectItem value="trend">Trend</SelectItem>
                          <SelectItem value="pattern">Pattern</SelectItem>
                          <SelectItem value="alert">Alert</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {condition.condition_type === 'threshold' && (
                    <>
                      <div>
                        <label className="text-xs font-medium mb-1 block">Operator</label>
                        <Select
                          value={condition.operator}
                          onValueChange={(v) => updateCondition(index, { operator: v })}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="greater_than">Greater Than</SelectItem>
                            <SelectItem value="less_than">Less Than</SelectItem>
                            <SelectItem value="equals">Equals</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-xs font-medium mb-1 block">Value</label>
                        <Input
                          type="number"
                          className="h-8"
                          value={condition.value || ''}
                          onChange={(e) => updateCondition(index, { value: e.target.value })}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => removeCondition(index)}
                className="h-8 w-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      {conditions.length === 0 && (
        <div className="text-center py-4 text-sm text-gray-500">
          No conditions defined. Add conditions to control when triggers fire.
        </div>
      )}
    </div>
  );
}

export function ActionBuilder({ actions = [], onChange, workflows = [] }) {
  const [actionList, setActionList] = useState(actions);

  const addAction = () => {
    const newAction = {
      type: 'create_task',
      create_task: true,
      task_priority: 'high',
      task_category: 'analysis'
    };
    const updated = [...actionList, newAction];
    setActionList(updated);
    onChange(updated);
  };

  const updateAction = (index, updates) => {
    const updated = actionList.map((a, i) => i === index ? { ...a, ...updates } : a);
    setActionList(updated);
    onChange(updated);
  };

  const removeAction = (index) => {
    const updated = actionList.filter((_, i) => i !== index);
    setActionList(updated);
    onChange(updated);
  };

  const getActionIcon = (type) => {
    switch (type) {
      case 'create_task': return Target;
      case 'trigger_workflow': return Workflow;
      case 'send_alert': return Mail;
      default: return Zap;
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Then Take Actions</h3>
        <Button size="sm" variant="outline" onClick={addAction}>
          <Plus className="w-3 h-3 mr-1" />
          Add Action
        </Button>
      </div>

      {actionList.map((action, index) => {
        const ActionIcon = getActionIcon(action.type);
        return (
          <Card key={index} className="border-l-4 border-l-green-500">
            <CardContent className="p-3">
              <div className="flex items-start gap-2">
                <div className="w-8 h-8 rounded bg-green-100 flex items-center justify-center flex-shrink-0">
                  <ActionIcon className="w-4 h-4 text-green-600" />
                </div>
                <div className="flex-1 space-y-2">
                  <Select
                    value={action.type}
                    onValueChange={(v) => updateAction(index, { type: v, [v]: true })}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="create_task">Create Task</SelectItem>
                      <SelectItem value="trigger_workflow">Trigger Workflow</SelectItem>
                      <SelectItem value="send_alert">Send Alert</SelectItem>
                    </SelectContent>
                  </Select>

                  {action.type === 'create_task' && (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs font-medium mb-1 block">Priority</label>
                        <Select
                          value={action.task_priority}
                          onValueChange={(v) => updateAction(index, { task_priority: v })}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="urgent">Urgent</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="low">Low</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-xs font-medium mb-1 block">Category</label>
                        <Select
                          value={action.task_category}
                          onValueChange={(v) => updateAction(index, { task_category: v })}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="bug">Bug Fix</SelectItem>
                            <SelectItem value="feature">Feature</SelectItem>
                            <SelectItem value="analysis">Analysis</SelectItem>
                            <SelectItem value="response">Response</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}

                  {action.type === 'trigger_workflow' && (
                    <div>
                      <label className="text-xs font-medium mb-1 block">Workflow</label>
                      <Select
                        value={action.workflow_id}
                        onValueChange={(v) => {
                          const workflow = workflows.find(w => w.id === v);
                          updateAction(index, { 
                            workflow_id: v,
                            workflow_name: workflow?.name 
                          });
                        }}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue placeholder="Select workflow" />
                        </SelectTrigger>
                        <SelectContent>
                          {workflows.map(wf => (
                            <SelectItem key={wf.id} value={wf.id}>{wf.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {action.type === 'send_alert' && (
                    <div>
                      <label className="text-xs font-medium mb-1 block">Email</label>
                      <Input
                        type="email"
                        className="h-8"
                        placeholder="alert@example.com"
                        value={action.notification_email || ''}
                        onChange={(e) => updateAction(index, { notification_email: e.target.value })}
                      />
                    </div>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeAction(index)}
                  className="h-8 w-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}

      {actionList.length === 0 && (
        <div className="text-center py-4 text-sm text-gray-500">
          No actions defined. Add actions to execute when conditions match.
        </div>
      )}
    </div>
  );
}