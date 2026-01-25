import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  Eye, Plus, TrendingUp, AlertTriangle, Lightbulb, 
  Activity, Database, Mail, Code, CheckCircle, XCircle,
  Clock, Zap, Target, Brain, Play, Pause, BarChart2
} from 'lucide-react';
import { InsightsTrendChart, SeverityDistribution, InsightTypeChart } from '@/components/monitoring/InsightsChart';
import { TaskPriorityChart, UrgencyFactorsRadar, PriorityScatterPlot } from '@/components/monitoring/TaskAnalyticsChart';
import { RuleTriggersChart, DataSourceDistribution } from '@/components/monitoring/RuleActivityChart';
import TriggerBuilder, { ActionBuilder } from '@/components/monitoring/TriggerBuilder';
import DataSourceConnectorManager from '@/components/monitoring/DataSourceConnectorManager';

export default function AIMonitoring() {
  const queryClient = useQueryClient();
  const [showRuleDialog, setShowRuleDialog] = useState(false);
  const [selectedInsight, setSelectedInsight] = useState(null);
  const [newRule, setNewRule] = useState({
    name: '',
    description: '',
    data_source: 'database',
    monitoring_frequency: 'hourly',
    conditions: { anomaly_detection: true },
    trigger_conditions: [],
    actions: [],
    connector_id: ''
  });
  const [connectors, setConnectors] = useState([]);

  const { data: workflows = [] } = useQuery({
    queryKey: ['workflows'],
    queryFn: () => base44.entities.Workflow.list('-created_date', 50)
  });

  const { data: dataConnectors = [] } = useQuery({
    queryKey: ['data-connectors'],
    queryFn: () => base44.entities.DataSourceConnector.list('-created_date', 50)
  });

  const { data: rules = [] } = useQuery({
    queryKey: ['monitoring-rules'],
    queryFn: () => base44.entities.MonitoringRule.list('-created_date')
  });

  const { data: insights = [] } = useQuery({
    queryKey: ['ai-insights'],
    queryFn: () => base44.entities.AIInsight.list('-created_date', 50)
  });

  const { data: aiTasks = [] } = useQuery({
    queryKey: ['ai-tasks'],
    queryFn: () => base44.entities.AITask.list('-ai_priority_score', 20)
  });

  const createRuleMutation = useMutation({
    mutationFn: (data) => base44.entities.MonitoringRule.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monitoring-rules'] });
      setShowRuleDialog(false);
      toast.success('Monitoring rule created!');
    }
  });

  const updateRuleMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.MonitoringRule.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monitoring-rules'] });
      toast.success('Rule updated!');
    }
  });

  const updateInsightMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.AIInsight.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-insights'] });
      toast.success('Insight updated!');
    }
  });

  const evaluateTriggers = (insight, rule) => {
    if (!rule.trigger_conditions || rule.trigger_conditions.length === 0) return true;
    
    return rule.trigger_conditions.every(condition => {
      if (condition.condition_type === 'severity') {
        return condition.severity_match?.includes(insight.severity);
      }
      if (condition.condition_type === 'insight_type') {
        return condition.insight_type_match?.includes(insight.insight_type);
      }
      return true;
    });
  };

  const executeActions = async (insight, actions) => {
    for (const action of actions) {
      if (action.create_task && action.type === 'create_task') {
        const priority = await base44.integrations.Core.InvokeLLM({
          prompt: `Calculate priority for: ${insight.title}. Severity: ${insight.severity}`,
          response_json_schema: {
            type: "object",
            properties: {
              ai_priority_score: { type: "number" },
              urgency_factors: { type: "object" }
            }
          }
        });

        await base44.entities.AITask.create({
          title: insight.title,
          description: insight.description,
          ai_priority_score: priority.ai_priority_score,
          priority: action.task_priority || 'medium',
          category: action.task_category || 'analysis',
          urgency_factors: priority.urgency_factors,
          insight_id: insight.id
        });
      }

      if (action.trigger_workflow && action.workflow_id) {
        await base44.entities.WorkflowExecution.create({
          workflow_id: action.workflow_id,
          workflow_name: action.workflow_name,
          trigger_type: 'webhook',
          status: 'running'
        });
      }

      if (action.send_alert && action.notification_email) {
        await base44.integrations.Core.SendEmail({
          to: action.notification_email,
          subject: `AI Alert: ${insight.title}`,
          body: `${insight.description}\n\nSeverity: ${insight.severity}\nType: ${insight.insight_type}`
        });
      }
    }
  };

  const triggerMonitoring = async (rule) => {
    toast.loading('Running monitoring check...');
    
    try {
      const analysis = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze data source: ${rule.data_source} (${rule.entity_name || rule.api_endpoint})
        
Looking for:
${rule.conditions.anomaly_detection ? '- Anomalies or unusual patterns' : ''}
${rule.conditions.trend_analysis ? '- Trends and changes' : ''}
${rule.conditions.pattern_matching ? '- Pattern: ' + rule.conditions.pattern_matching : ''}

Provide:
- insight_type (anomaly/opportunity/trend/pattern/alert)
- severity (low/medium/high/critical)
- description of what was found
- recommended actions (array of 2-3 actions)`,
        response_json_schema: {
          type: "object",
          properties: {
            insight_type: { type: "string" },
            severity: { type: "string" },
            description: { type: "string" },
            recommended_actions: { type: "array", items: { type: "string" } }
          }
        }
      });

      const insight = await base44.entities.AIInsight.create({
        monitoring_rule_id: rule.id,
        title: `${rule.name} - New ${analysis.insight_type}`,
        description: analysis.description,
        insight_type: analysis.insight_type,
        severity: analysis.severity,
        ai_analysis: analysis.description,
        recommended_actions: analysis.recommended_actions
      });

      // Evaluate triggers and execute actions
      if (evaluateTriggers(insight, rule) && rule.actions?.length > 0) {
        await executeActions(insight, rule.actions);
        toast.success('Triggers matched - actions executed!');
      }

      await base44.entities.MonitoringRule.update(rule.id, {
        last_checked: new Date().toISOString(),
        triggers_count: (rule.triggers_count || 0) + 1
      });

      queryClient.invalidateQueries({ queryKey: ['ai-insights'] });
      queryClient.invalidateQueries({ queryKey: ['monitoring-rules'] });
      queryClient.invalidateQueries({ queryKey: ['ai-tasks'] });
      
      toast.dismiss();
      toast.success('Monitoring completed - new insight found!');
    } catch (error) {
      toast.dismiss();
      toast.error('Monitoring failed: ' + error.message);
    }
  };

  const takeAction = async (insight, action) => {
    if (action === 'create_task') {
      // AI task prioritization
      const priority = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this task and calculate priority:
Title: ${insight.title}
Description: ${insight.description}
Severity: ${insight.severity}
Type: ${insight.insight_type}

Calculate:
- ai_priority_score (0-100)
- urgency_factors (deadline_proximity, business_impact, dependencies, user_importance - each 0-1)
- priority level (low/medium/high/urgent)
- suggested due date`,
        response_json_schema: {
          type: "object",
          properties: {
            ai_priority_score: { type: "number" },
            urgency_factors: { type: "object" },
            priority: { type: "string" },
            due_date: { type: "string" }
          }
        }
      });

      await base44.entities.AITask.create({
        title: insight.title,
        description: insight.description,
        ai_priority_score: priority.ai_priority_score,
        priority: priority.priority,
        urgency_factors: priority.urgency_factors,
        insight_id: insight.id,
        category: 'analysis',
        ai_suggestions: insight.recommended_actions
      });

      await updateInsightMutation.mutateAsync({
        id: insight.id,
        data: { status: 'action_taken', task_created: 'true' }
      });

      queryClient.invalidateQueries({ queryKey: ['ai-tasks'] });
      toast.success('AI task created with priority scoring!');
    }
  };

  const getInsightIcon = (type) => {
    switch (type) {
      case 'anomaly': return AlertTriangle;
      case 'opportunity': return Lightbulb;
      case 'trend': return TrendingUp;
      case 'pattern': return Activity;
      default: return Eye;
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'bg-red-600';
      case 'high': return 'bg-orange-600';
      case 'medium': return 'bg-yellow-600';
      case 'low': return 'bg-blue-600';
      default: return 'bg-gray-600';
    }
  };

  const getDataSourceIcon = (source) => {
    switch (source) {
      case 'email': return Mail;
      case 'database': return Database;
      case 'api': return Code;
      default: return Activity;
    }
  };

  return (
    <div className="h-screen flex flex-col p-6 bg-gray-50">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">AI Monitoring & Insights</h1>
          <p className="text-gray-500">Proactive monitoring with autonomous task creation</p>
        </div>
        <Button onClick={() => setShowRuleDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Monitoring Rule
        </Button>
      </div>

      <Tabs defaultValue="dashboard" className="flex-1 flex flex-col">
        <TabsList className="mb-4">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="insights">Insights ({insights.length})</TabsTrigger>
          <TabsTrigger value="tasks">AI Tasks ({aiTasks.length})</TabsTrigger>
          <TabsTrigger value="rules">Monitoring Rules ({rules.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="flex-1 overflow-y-auto">
          <div className="space-y-6">
            {/* Overview Stats */}
            <div className="grid grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Eye className="w-8 h-8 mx-auto text-indigo-600 mb-2" />
                    <div className="text-2xl font-bold">{insights.length}</div>
                    <div className="text-sm text-gray-500">Total Insights</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Target className="w-8 h-8 mx-auto text-purple-600 mb-2" />
                    <div className="text-2xl font-bold">{aiTasks.length}</div>
                    <div className="text-sm text-gray-500">AI Tasks</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Activity className="w-8 h-8 mx-auto text-green-600 mb-2" />
                    <div className="text-2xl font-bold">{rules.filter(r => r.is_active).length}</div>
                    <div className="text-sm text-gray-500">Active Rules</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <AlertTriangle className="w-8 h-8 mx-auto text-red-600 mb-2" />
                    <div className="text-2xl font-bold">{insights.filter(i => i.severity === 'critical' || i.severity === 'high').length}</div>
                    <div className="text-sm text-gray-500">High Priority</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Insights Analytics */}
            <div className="grid grid-cols-3 gap-4">
              <InsightsTrendChart insights={insights} />
              <SeverityDistribution insights={insights} />
              <InsightTypeChart insights={insights} />
            </div>

            {/* Task Analytics */}
            <div className="grid grid-cols-2 gap-4">
              <TaskPriorityChart tasks={aiTasks} />
              <PriorityScatterPlot tasks={aiTasks} />
            </div>

            {/* Rule Analytics */}
            <div className="grid grid-cols-2 gap-4">
              <RuleTriggersChart rules={rules} />
              <DataSourceDistribution rules={rules} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {insights.map((insight) => {
              const InsightIcon = getInsightIcon(insight.insight_type);
              return (
                <Card key={insight.id} className="hover:shadow-lg transition-all">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                          <InsightIcon className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{insight.title}</CardTitle>
                          <Badge className={getSeverityColor(insight.severity)}>
                            {insight.severity}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <CardDescription>{insight.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {insight.ai_analysis && (
                        <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                          <Brain className="w-3 h-3 inline mr-1" />
                          {insight.ai_analysis.substring(0, 100)}...
                        </div>
                      )}
                      
                      {insight.recommended_actions && insight.recommended_actions.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold mb-1">Recommended:</p>
                          <div className="space-y-1">
                            {insight.recommended_actions.slice(0, 2).map((action, idx) => (
                              <div key={idx} className="text-xs text-gray-600 flex items-start gap-1">
                                <Target className="w-3 h-3 mt-0.5" />
                                {action}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={() => takeAction(insight, 'create_task')}
                          disabled={insight.status === 'action_taken'}
                        >
                          <Zap className="w-3 h-3 mr-1" />
                          {insight.status === 'action_taken' ? 'Task Created' : 'Create Task'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateInsightMutation.mutate({
                            id: insight.id,
                            data: { status: 'dismissed' }
                          })}
                        >
                          Dismiss
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          {insights.length === 0 && (
            <div className="text-center py-12">
              <Eye className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">No insights yet. Create monitoring rules to start.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="tasks" className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="col-span-2 space-y-3">
              {aiTasks.map((task) => (
                <Card key={task.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold">{task.title}</h4>
                          <Badge className={
                            task.priority === 'urgent' ? 'bg-red-600' :
                            task.priority === 'high' ? 'bg-orange-600' :
                            task.priority === 'medium' ? 'bg-yellow-600' : 'bg-green-600'
                          }>
                            {task.priority}
                          </Badge>
                          <Badge variant="outline">Score: {task.ai_priority_score || 0}</Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                        
                        {task.urgency_factors && (
                          <div className="flex gap-3 text-xs text-gray-500">
                            <span>Impact: {((task.urgency_factors.business_impact || 0) * 100).toFixed(0)}%</span>
                            <span>Urgency: {((task.urgency_factors.deadline_proximity || 0) * 100).toFixed(0)}%</span>
                          </div>
                        )}

                        {task.ai_suggestions && task.ai_suggestions.length > 0 && (
                          <div className="mt-2 text-xs">
                            <p className="font-semibold mb-1">AI Suggestions:</p>
                            <ul className="list-disc list-inside space-y-0.5 text-gray-600">
                              {task.ai_suggestions.slice(0, 2).map((suggestion, idx) => (
                                <li key={idx}>{suggestion}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div>
              {aiTasks[0] && <UrgencyFactorsRadar task={aiTasks[0]} />}
            </div>
          </div>
          {aiTasks.length === 0 && (
            <div className="text-center py-12">
              <Target className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">No AI tasks yet. Insights will generate tasks automatically.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="rules" className="flex-1 overflow-y-auto">
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <DataSourceConnectorManager 
              connectors={dataConnectors}
              onConnectorsChange={() => queryClient.invalidateQueries({ queryKey: ['data-connectors'] })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rules.map((rule) => {
              const SourceIcon = getDataSourceIcon(rule.data_source);
              return (
                <Card key={rule.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                          <SourceIcon className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{rule.name}</CardTitle>
                          <Badge variant={rule.is_active ? 'default' : 'secondary'}>
                            {rule.is_active ? 'Active' : 'Paused'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <CardDescription>{rule.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-xs text-gray-600 mb-3">
                      <div className="flex justify-between">
                        <span>Source:</span>
                        <span className="font-semibold">{rule.data_source}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Frequency:</span>
                        <span className="font-semibold">{rule.monitoring_frequency}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Triggers:</span>
                        <span className="font-semibold">{rule.triggers_count || 0}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => triggerMonitoring(rule)}
                      >
                        <Play className="w-3 h-3 mr-1" />
                        Run Now
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateRuleMutation.mutate({
                          id: rule.id,
                          data: { is_active: !rule.is_active }
                        })}
                      >
                        {rule.is_active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          {rules.length === 0 && (
            <div className="text-center py-12">
              <Activity className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">No monitoring rules yet. Create one to start.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Rule Dialog */}
      <Dialog open={showRuleDialog} onOpenChange={setShowRuleDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Monitoring Rule</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Rule Name</label>
                <Input
                  value={newRule.name}
                  onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                  placeholder="Daily Sales Monitor"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Data Source</label>
                <Select
                  value={newRule.data_source}
                  onValueChange={(v) => setNewRule({ ...newRule, data_source: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="database">Database Entity</SelectItem>
                    <SelectItem value="email">Email Account</SelectItem>
                    <SelectItem value="api">API Endpoint</SelectItem>
                    <SelectItem value="workflow">Workflow Results</SelectItem>
                    <SelectItem value="snowflake">Snowflake</SelectItem>
                    <SelectItem value="bigquery">BigQuery</SelectItem>
                    <SelectItem value="salesforce">Salesforce</SelectItem>
                    <SelectItem value="hubspot">HubSpot</SelectItem>
                    <SelectItem value="asana">Asana</SelectItem>
                    <SelectItem value="jira">Jira</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Description</label>
              <Textarea
                value={newRule.description}
                onChange={(e) => setNewRule({ ...newRule, description: e.target.value })}
                placeholder="What should this rule monitor?"
                rows={2}
              />
            </div>

            {newRule.data_source === 'database' && (
              <div>
                <label className="text-sm font-medium mb-1 block">Entity Name</label>
                <Input
                  value={newRule.entity_name}
                  onChange={(e) => setNewRule({ ...newRule, entity_name: e.target.value })}
                  placeholder="e.g., Order, User, Transaction"
                />
              </div>
            )}

            {['snowflake', 'bigquery', 'salesforce', 'hubspot', 'asana', 'jira'].includes(newRule.data_source) && (
              <div>
                <label className="text-sm font-medium mb-1 block">Select Connector</label>
                <Select
                  value={newRule.connector_id}
                  onValueChange={(v) => setNewRule({ ...newRule, connector_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a connector..." />
                  </SelectTrigger>
                  <SelectContent>
                    {dataConnectors
                      .filter(c => c.connector_type === newRule.data_source && c.status === 'active')
                      .map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
                {dataConnectors.filter(c => c.connector_type === newRule.data_source).length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">Create a connector first to use this data source</p>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Check Frequency</label>
                <Select
                  value={newRule.monitoring_frequency}
                  onValueChange={(v) => setNewRule({ ...newRule, monitoring_frequency: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="realtime">Real-time</SelectItem>
                    <SelectItem value="hourly">Hourly</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Detection Options</label>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newRule.conditions.anomaly_detection}
                    onChange={(e) => setNewRule({
                      ...newRule,
                      conditions: { ...newRule.conditions, anomaly_detection: e.target.checked }
                    })}
                    className="rounded"
                  />
                  <span className="text-sm">Detect anomalies</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newRule.conditions.trend_analysis}
                    onChange={(e) => setNewRule({
                      ...newRule,
                      conditions: { ...newRule.conditions, trend_analysis: e.target.checked }
                    })}
                    className="rounded"
                  />
                  <span className="text-sm">Analyze trends</span>
                </div>
              </div>
            </div>

            <div className="border-t pt-4 mt-4">
              <TriggerBuilder
                triggers={newRule.trigger_conditions}
                onChange={(triggers) => setNewRule({ ...newRule, trigger_conditions: triggers })}
              />
            </div>

            <div className="border-t pt-4 mt-4">
              <ActionBuilder
                actions={newRule.actions}
                workflows={workflows}
                onChange={(actions) => setNewRule({ ...newRule, actions })}
              />
            </div>

            <Button
              onClick={() => createRuleMutation.mutate(newRule)}
              className="w-full"
              disabled={!newRule.name || !newRule.data_source}
            >
              Create Rule
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}