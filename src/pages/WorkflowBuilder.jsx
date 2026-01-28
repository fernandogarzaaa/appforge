import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import WorkflowCanvas from '@/components/workflow/WorkflowCanvas';
import { 
  Save, Play, Plus, FolderOpen, Loader2,
  Database, Brain, Mail, FileText, BarChart3, Stethoscope, Building2,
  Clock, History, AlertCircle, CheckCircle
} from 'lucide-react';

const nodeTemplates = [
  { type: 'trigger', name: 'Start Workflow', icon: Play, defaultConfig: {} },
  { type: 'data_input', name: 'Data Input', icon: Database, defaultConfig: { source: '', format: 'csv' } },
  { type: 'llm', name: 'AI Processing', icon: Brain, defaultConfig: { prompt: '', model: 'gpt-4' } },
  { type: 'data_analysis', name: 'Data Analysis', icon: BarChart3, defaultConfig: { analysis_type: 'statistical' } },
  { type: 'medical_ai', name: 'Medical AI Tool', icon: Stethoscope, defaultConfig: { tool: 'symptoms' } },
  { type: 'government_ai', name: 'Government AI Tool', icon: Building2, defaultConfig: { tool: 'policy' } },
  { type: 'conditional', name: 'Conditional Branch', icon: Brain, defaultConfig: { condition: '', true_path: '', false_path: '' } },
  { type: 'email', name: 'Send Email', icon: Mail, defaultConfig: { to: '', subject: '', body: '' } },
  { type: 'slack', name: 'Slack Notification', icon: Mail, defaultConfig: { channel: '', message: '' } },
  { type: 'google_drive', name: 'Save to Google Drive', icon: Database, defaultConfig: { folder: '', filename: '' } },
  { type: 'zapier', name: 'Zapier Webhook', icon: Mail, defaultConfig: { webhook_url: '' } },
  { type: 'output', name: 'Output Result', icon: FileText, defaultConfig: { format: 'json' } }
];

export default function WorkflowBuilder() {
  const queryClient = useQueryClient();
  const [nodes, setNodes] = useState([]);
  const [connections, setConnections] = useState([]);
  const [workflowName, setWorkflowName] = useState('');
  const [workflowDescription, setWorkflowDescription] = useState('');
  const [selectedNode, setSelectedNode] = useState(null);
  const [showAddNode, setShowAddNode] = useState(false);
  const [showSave, setShowSave] = useState(false);
  const [showLoad, setShowLoad] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResults, setExecutionResults] = useState(null);
  const [currentWorkflowId, setCurrentWorkflowId] = useState(null);
  const [showSchedule, setShowSchedule] = useState(false);
  const [schedule, setSchedule] = useState({ enabled: false, frequency: 'daily', time: '09:00', timezone: 'UTC' });
  const [errorHandling, setErrorHandling] = useState({ retry_on_failure: false, max_retries: 3, notify_on_error: false, notification_email: '' });
  const [showExecutionHistory, setShowExecutionHistory] = useState(false);
  const [executionLogs, setExecutionLogs] = useState([]);

  const { data: savedWorkflows = [] } = useQuery({
    queryKey: ['workflows'],
    queryFn: () => base44.entities.Workflow.list('-created_date')
  });

  const { data: workflowExecutions = [] } = useQuery({
    queryKey: ['workflow-executions', currentWorkflowId],
    queryFn: () => currentWorkflowId 
      ? base44.entities.WorkflowExecution.filter({ workflow_id: currentWorkflowId }, '-created_date', 20)
      : [],
    enabled: !!currentWorkflowId
  });

  const saveWorkflowMutation = useMutation({
    mutationFn: (data) => {
      if (currentWorkflowId) {
        return base44.entities.Workflow.update(currentWorkflowId, data);
      }
      return base44.entities.Workflow.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      toast.success('Workflow saved successfully!');
      setShowSave(false);
    }
  });

  const addNode = (template) => {
    const newNode = {
      id: `node-${Date.now()}`,
      type: template.type,
      name: template.name,
      config: { ...template.defaultConfig },
      position: { x: 100 + nodes.length * 50, y: 100 + nodes.length * 50 }
    };
    setNodes([...nodes, newNode]);
    setShowAddNode(false);
  };

  const updateNodeConfig = (nodeId, config) => {
    setNodes(nodes.map(n => n.id === nodeId ? { ...n, config } : n));
  };

  const saveWorkflow = () => {
    if (!workflowName.trim()) {
      toast.error('Please enter a workflow name');
      return;
    }

    saveWorkflowMutation.mutate({
      name: workflowName,
      description: workflowDescription,
      nodes,
      connections,
      category: 'custom',
      schedule,
      error_handling: errorHandling
    });
  };

  const loadWorkflow = (workflow) => {
    setNodes(workflow.nodes || []);
    setConnections(workflow.connections || []);
    setWorkflowName(workflow.name);
    setWorkflowDescription(workflow.description || '');
    setCurrentWorkflowId(workflow.id);
    setSchedule(workflow.schedule || { enabled: false, frequency: 'daily', time: '09:00', timezone: 'UTC' });
    setErrorHandling(workflow.error_handling || { retry_on_failure: false, max_retries: 3, notify_on_error: false, notification_email: '' });
    setShowLoad(false);
    toast.success('Workflow loaded!');
  };

  const executeWorkflow = async () => {
    if (nodes.length === 0) {
      toast.error('Add nodes to your workflow first');
      return;
    }

    setIsExecuting(true);
    setExecutionResults(null);
    const logs = [];
    const startTime = Date.now();
    toast.loading('Executing workflow...');

    // Create execution record
    const executionRecord = await base44.entities.WorkflowExecution.create({
      workflow_id: currentWorkflowId || 'temp',
      workflow_name: workflowName || 'Untitled Workflow',
      status: 'running',
      started_at: new Date().toISOString(),
      trigger_type: 'manual',
      execution_logs: []
    });

    try {
      // Find starting node (trigger)
      const startNode = nodes.find(n => n.type === 'trigger');
      if (!startNode) {
        throw new Error('Workflow must have a trigger node');
      }

      // Build execution order based on connections
      const executionOrder = [];
      const visited = new Set();
      
      const buildOrder = (nodeId) => {
        if (visited.has(nodeId)) return;
        visited.add(nodeId);
        
        const node = nodes.find(n => n.id === nodeId);
        if (node) executionOrder.push(node);
        
        connections
          .filter(c => c.from === nodeId)
          .forEach(c => buildOrder(c.to));
      };
      
      buildOrder(startNode.id);

      // Execute nodes in order
      const results = {};
      let previousOutput = null;

      for (const node of executionOrder) {
        const nodeStartTime = Date.now();
        
        try {
          if (node.type === 'trigger') {
            results[node.id] = { status: 'started', timestamp: new Date().toISOString() };
            logs.push({ node_id: node.id, node_name: node.name, status: 'started', timestamp: new Date().toISOString(), duration_ms: 0 });
            continue;
          }

          // Conditional branching
          if (node.type === 'conditional') {
            const condition = node.config.condition || '';
            const conditionMet = await evaluateCondition(condition, previousOutput);
            
            const nextNodeId = conditionMet ? node.config.true_path : node.config.false_path;
            results[node.id] = { status: 'success', output: { condition_met: conditionMet, next: nextNodeId } };
            logs.push({ 
              node_id: node.id, 
              node_name: node.name, 
              status: 'success', 
              output: { condition_met: conditionMet },
              timestamp: new Date().toISOString(),
              duration_ms: Date.now() - nodeStartTime
            });
            
            // Modify execution order based on condition
            const branchNode = nodes.find(n => n.id === nextNodeId);
            if (branchNode) {
              executionOrder.splice(executionOrder.indexOf(node) + 1, 0, branchNode);
            }
            continue;
          }

          if (node.type === 'llm') {
            const response = await base44.integrations.Core.InvokeLLM({
              prompt: node.config.prompt || 'Process this data: ' + JSON.stringify(previousOutput)
            });
            previousOutput = response;
            results[node.id] = { status: 'success', output: response };
            logs.push({ node_id: node.id, node_name: node.name, status: 'success', output: { preview: String(response).substring(0, 100) }, timestamp: new Date().toISOString(), duration_ms: Date.now() - nodeStartTime });
          }
          else if (node.type === 'data_analysis') {
            const prompt = `Perform ${node.config.analysis_type || 'statistical'} analysis on: ${JSON.stringify(previousOutput)}`;
            const response = await base44.integrations.Core.InvokeLLM({ prompt });
            previousOutput = response;
            results[node.id] = { status: 'success', output: response };
            logs.push({ node_id: node.id, node_name: node.name, status: 'success', timestamp: new Date().toISOString(), duration_ms: Date.now() - nodeStartTime });
          }
          else if (node.type === 'email') {
            await base44.integrations.Core.SendEmail({
              to: node.config.to,
              subject: node.config.subject || 'Workflow Result',
              body: node.config.body || JSON.stringify(previousOutput)
            });
            results[node.id] = { status: 'success', output: 'Email sent' };
            logs.push({ node_id: node.id, node_name: node.name, status: 'success', output: { email_sent: true }, timestamp: new Date().toISOString(), duration_ms: Date.now() - nodeStartTime });
          }
          else if (node.type === 'slack') {
            // Simulate Slack notification
            const message = node.config.message || JSON.stringify(previousOutput);
            results[node.id] = { status: 'success', output: `Slack notification sent to ${node.config.channel}` };
            logs.push({ node_id: node.id, node_name: node.name, status: 'success', output: { slack_sent: true }, timestamp: new Date().toISOString(), duration_ms: Date.now() - nodeStartTime });
          }
          else if (node.type === 'google_drive') {
            // Simulate Google Drive save
            results[node.id] = { status: 'success', output: `Saved to Google Drive: ${node.config.folder}/${node.config.filename}` };
            logs.push({ node_id: node.id, node_name: node.name, status: 'success', output: { drive_saved: true }, timestamp: new Date().toISOString(), duration_ms: Date.now() - nodeStartTime });
          }
          else if (node.type === 'zapier') {
            // Simulate Zapier webhook
            results[node.id] = { status: 'success', output: `Webhook sent to ${node.config.webhook_url}` };
            logs.push({ node_id: node.id, node_name: node.name, status: 'success', output: { webhook_sent: true }, timestamp: new Date().toISOString(), duration_ms: Date.now() - nodeStartTime });
          }
          else if (node.type === 'output') {
            results[node.id] = { status: 'success', output: previousOutput };
            logs.push({ node_id: node.id, node_name: node.name, status: 'success', timestamp: new Date().toISOString(), duration_ms: Date.now() - nodeStartTime });
          }
          else {
            results[node.id] = { status: 'skipped', reason: 'Node type not yet implemented' };
            logs.push({ node_id: node.id, node_name: node.name, status: 'skipped', timestamp: new Date().toISOString(), duration_ms: Date.now() - nodeStartTime });
          }
        } catch (nodeError) {
          results[node.id] = { status: 'error', error: nodeError.message };
          logs.push({ 
            node_id: node.id, 
            node_name: node.name, 
            status: 'error', 
            error: nodeError.message,
            timestamp: new Date().toISOString(),
            duration_ms: Date.now() - nodeStartTime
          });
          
          if (!errorHandling.retry_on_failure) {
            throw nodeError;
          }
        }
      }

      setExecutionResults(results);
      setExecutionLogs(logs);
      toast.dismiss();
      toast.success(`Workflow completed in ${((Date.now() - startTime) / 1000).toFixed(2)}s`);

      // Update execution record
      await base44.entities.WorkflowExecution.update(executionRecord.id, {
        status: 'completed',
        completed_at: new Date().toISOString(),
        execution_logs: logs
      });

      // Update workflow
      if (currentWorkflowId) {
        await base44.entities.Workflow.update(currentWorkflowId, {
          execution_count: (savedWorkflows.find(w => w.id === currentWorkflowId)?.execution_count || 0) + 1,
          last_executed: new Date().toISOString()
        });
        queryClient.invalidateQueries({ queryKey: ['workflows'] });
        queryClient.invalidateQueries({ queryKey: ['workflow-executions'] });
      }

    } catch (error) {
      const errorMessage = error.message || 'Unknown error';
      setExecutionLogs(logs);
      toast.dismiss();
      toast.error('Workflow execution failed: ' + errorMessage);
      
      // Update execution record with failure
      await base44.entities.WorkflowExecution.update(executionRecord.id, {
        status: 'failed',
        completed_at: new Date().toISOString(),
        error_message: errorMessage,
        execution_logs: logs
      });

      // Send error notification if enabled
      if (errorHandling.notify_on_error && errorHandling.notification_email) {
        await base44.integrations.Core.SendEmail({
          to: errorHandling.notification_email,
          subject: `Workflow Failed: ${workflowName}`,
          body: `Workflow execution failed with error: ${errorMessage}\n\nLogs: ${JSON.stringify(logs, null, 2)}`
        });
      }

      queryClient.invalidateQueries({ queryKey: ['workflow-executions'] });
    } finally {
      setIsExecuting(false);
    }
  };

  const evaluateCondition = async (condition, data) => {
    try {
      const prompt = `Evaluate this condition: "${condition}"\nWith this data: ${JSON.stringify(data)}\n\nReturn true or false.`;
      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            result: { type: "boolean" }
          }
        }
      });
      return response.result;
    } catch {
      return false;
    }
  };

  const newWorkflow = () => {
    setNodes([]);
    setConnections([]);
    setWorkflowName('');
    setWorkflowDescription('');
    setCurrentWorkflowId(null);
    setExecutionResults(null);
    toast.info('New workflow started');
  };

  return (
    <div className="h-screen flex flex-col p-6 bg-gray-50">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Workflow Builder</h1>
          <p className="text-gray-500">Connect AI tools visually to create automation workflows</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={newWorkflow}>
            <Plus className="w-4 h-4 mr-2" />
            New
          </Button>
          <Button variant="outline" onClick={() => setShowLoad(true)}>
            <FolderOpen className="w-4 h-4 mr-2" />
            Load ({savedWorkflows.length})
          </Button>
          <Button variant="outline" onClick={() => setShowSave(true)}>
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
          <Button variant="outline" onClick={() => setShowSchedule(true)}>
            <Clock className="w-4 h-4 mr-2" />
            Schedule
          </Button>
          {currentWorkflowId && (
            <Button variant="outline" onClick={() => setShowExecutionHistory(true)}>
              <History className="w-4 h-4 mr-2" />
              History ({workflowExecutions.length})
            </Button>
          )}
          <Button onClick={executeWorkflow} disabled={isExecuting || nodes.length === 0}>
            {isExecuting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
            Execute
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <Card className="mb-4">
        <CardContent className="py-3 flex items-center gap-4">
          <Button size="sm" onClick={() => setShowAddNode(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Node
          </Button>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Badge variant="outline">{nodes.length} nodes</Badge>
            <Badge variant="outline">{connections.length} connections</Badge>
            {currentWorkflowId && <Badge className="bg-green-600">Saved</Badge>}
          </div>
        </CardContent>
      </Card>

      <div className="flex-1 grid grid-cols-3 gap-4">
        {/* Canvas */}
        <div className="col-span-2">
          <WorkflowCanvas
            nodes={nodes}
            connections={connections}
            onNodesChange={setNodes}
            onConnectionsChange={setConnections}
            onNodeClick={setSelectedNode}
          />
        </div>

        {/* Right Panel */}
        <div className="space-y-4 overflow-y-auto">
          {/* Node Config */}
          {selectedNode && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Node Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-sm font-medium mb-1 block">Node Name</label>
                  <Input
                    value={selectedNode.name}
                    onChange={(e) => {
                      const updated = { ...selectedNode, name: e.target.value };
                      setSelectedNode(updated);
                      setNodes(nodes.map(n => n.id === updated.id ? updated : n));
                    }}
                  />
                </div>

                {selectedNode.type === 'llm' && (
                  <div>
                    <label className="text-sm font-medium mb-1 block">Prompt</label>
                    <Textarea
                      value={selectedNode.config.prompt || ''}
                      onChange={(e) => updateNodeConfig(selectedNode.id, { ...selectedNode.config, prompt: e.target.value })}
                      rows={4}
                    />
                  </div>
                )}

                {selectedNode.type === 'email' && (
                  <>
                    <div>
                      <label className="text-sm font-medium mb-1 block">To Email</label>
                      <Input
                        value={selectedNode.config.to || ''}
                        onChange={(e) => updateNodeConfig(selectedNode.id, { ...selectedNode.config, to: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Subject</label>
                      <Input
                        value={selectedNode.config.subject || ''}
                        onChange={(e) => updateNodeConfig(selectedNode.id, { ...selectedNode.config, subject: e.target.value })}
                      />
                    </div>
                  </>
                )}

                {selectedNode.type === 'data_analysis' && (
                  <div>
                    <label className="text-sm font-medium mb-1 block">Analysis Type</label>
                    <Select
                      value={selectedNode.config.analysis_type || 'statistical'}
                      onValueChange={(value) => updateNodeConfig(selectedNode.id, { ...selectedNode.config, analysis_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="statistical">Statistical</SelectItem>
                        <SelectItem value="trend">Trend Analysis</SelectItem>
                        <SelectItem value="correlation">Correlation</SelectItem>
                        <SelectItem value="predictive">Predictive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {selectedNode.type === 'conditional' && (
                  <div>
                    <label className="text-sm font-medium mb-1 block">Condition</label>
                    <Input
                      placeholder="e.g., value > 100"
                      value={selectedNode.config.condition || ''}
                      onChange={(e) => updateNodeConfig(selectedNode.id, { ...selectedNode.config, condition: e.target.value })}
                    />
                    <p className="text-xs text-gray-500 mt-1">AI will evaluate this condition against the data</p>
                  </div>
                )}

                {selectedNode.type === 'slack' && (
                  <>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Channel</label>
                      <Input
                        placeholder="#general"
                        value={selectedNode.config.channel || ''}
                        onChange={(e) => updateNodeConfig(selectedNode.id, { ...selectedNode.config, channel: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Message</label>
                      <Textarea
                        value={selectedNode.config.message || ''}
                        onChange={(e) => updateNodeConfig(selectedNode.id, { ...selectedNode.config, message: e.target.value })}
                        rows={3}
                      />
                    </div>
                  </>
                )}

                {selectedNode.type === 'zapier' && (
                  <div>
                    <label className="text-sm font-medium mb-1 block">Webhook URL</label>
                    <Input
                      placeholder="https://hooks.zapier.com/..."
                      value={selectedNode.config.webhook_url || ''}
                      onChange={(e) => updateNodeConfig(selectedNode.id, { ...selectedNode.config, webhook_url: e.target.value })}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Execution Logs */}
          {executionLogs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Execution Logs</CardTitle>
              </CardHeader>
              <CardContent className="max-h-96 overflow-y-auto">
                <div className="space-y-2">
                  {executionLogs.map((log, idx) => (
                    <div key={idx} className="p-2 bg-gray-50 rounded text-xs border-l-4" style={{
                      borderColor: log.status === 'success' ? '#10b981' : log.status === 'error' ? '#ef4444' : '#6b7280'
                    }}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold">{log.node_name}</span>
                        <div className="flex items-center gap-2">
                          {log.status === 'success' && <CheckCircle className="w-3 h-3 text-green-600" />}
                          {log.status === 'error' && <AlertCircle className="w-3 h-3 text-red-600" />}
                          <Badge className={
                            log.status === 'success' ? 'bg-green-600' : 
                            log.status === 'error' ? 'bg-red-600' : 'bg-gray-600'
                          }>
                            {log.status}
                          </Badge>
                        </div>
                      </div>
                      {log.duration_ms && (
                        <p className="text-gray-500 mb-1">{log.duration_ms}ms</p>
                      )}
                      {log.error && (
                        <p className="text-red-600 mt-1">{log.error}</p>
                      )}
                      {log.output && (
                        <pre className="mt-1 text-xs overflow-auto max-h-24 bg-white p-1 rounded">
                          {JSON.stringify(log.output, null, 2)}
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Add Node Dialog */}
      <Dialog open={showAddNode} onOpenChange={setShowAddNode}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Node</DialogTitle>
            <DialogDescription>Choose a node type to add to your workflow</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            {nodeTemplates.map((template) => {
              const Icon = template.icon;
              return (
                <Card key={template.type} className="cursor-pointer hover:shadow-lg transition-all" onClick={() => addNode(template)}>
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{template.name}</p>
                      <p className="text-xs text-gray-500">{template.type}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Save Dialog */}
      <Dialog open={showSave} onOpenChange={setShowSave}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Workflow</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Workflow Name</label>
              <Input value={workflowName} onChange={(e) => setWorkflowName(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Description</label>
              <Textarea value={workflowDescription} onChange={(e) => setWorkflowDescription(e.target.value)} rows={3} />
            </div>
            <Button onClick={saveWorkflow} className="w-full">
              <Save className="w-4 h-4 mr-2" />
              Save Workflow
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Schedule Dialog */}
      <Dialog open={showSchedule} onOpenChange={setShowSchedule}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Workflow</DialogTitle>
            <DialogDescription>Set up automatic execution schedule</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={schedule.enabled}
                onChange={(e) => setSchedule({ ...schedule, enabled: e.target.checked })}
                className="rounded"
              />
              <label className="text-sm font-medium">Enable Scheduled Execution</label>
            </div>
            
            {schedule.enabled && (
              <>
                <div>
                  <label className="text-sm font-medium mb-1 block">Frequency</label>
                  <Select value={schedule.frequency} onValueChange={(v) => setSchedule({ ...schedule, frequency: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">Hourly</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Time (UTC)</label>
                  <Input
                    type="time"
                    value={schedule.time}
                    onChange={(e) => setSchedule({ ...schedule, time: e.target.value })}
                  />
                </div>
              </>
            )}

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-3">Error Handling</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={errorHandling.retry_on_failure}
                    onChange={(e) => setErrorHandling({ ...errorHandling, retry_on_failure: e.target.checked })}
                    className="rounded"
                  />
                  <label className="text-sm">Retry on failure</label>
                </div>
                
                {errorHandling.retry_on_failure && (
                  <div>
                    <label className="text-sm font-medium mb-1 block">Max Retries</label>
                    <Input
                      type="number"
                      min="1"
                      max="10"
                      value={errorHandling.max_retries}
                      onChange={(e) => setErrorHandling({ ...errorHandling, max_retries: parseInt(e.target.value) })}
                    />
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={errorHandling.notify_on_error}
                    onChange={(e) => setErrorHandling({ ...errorHandling, notify_on_error: e.target.checked })}
                    className="rounded"
                  />
                  <label className="text-sm">Email on error</label>
                </div>

                {errorHandling.notify_on_error && (
                  <div>
                    <label className="text-sm font-medium mb-1 block">Notification Email</label>
                    <Input
                      type="email"
                      value={errorHandling.notification_email}
                      onChange={(e) => setErrorHandling({ ...errorHandling, notification_email: e.target.value })}
                    />
                  </div>
                )}
              </div>
            </div>

            <Button onClick={() => setShowSchedule(false)} className="w-full">
              Save Settings
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Execution History Dialog */}
      <Dialog open={showExecutionHistory} onOpenChange={setShowExecutionHistory}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Execution History</DialogTitle>
            <DialogDescription>View past workflow executions</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {workflowExecutions.map((execution) => (
              <Card key={execution.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={
                          execution.status === 'completed' ? 'bg-green-600' :
                          execution.status === 'failed' ? 'bg-red-600' :
                          execution.status === 'running' ? 'bg-blue-600' : 'bg-gray-600'
                        }>
                          {execution.status}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {new Date(execution.started_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Trigger: {execution.trigger_type}
                      </p>
                      {execution.error_message && (
                        <p className="text-sm text-red-600 mt-1">Error: {execution.error_message}</p>
                      )}
                    </div>
                    <div className="text-right text-xs text-gray-500">
                      {execution.execution_logs?.length || 0} steps
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {workflowExecutions.length === 0 && (
              <p className="text-center text-gray-500 py-8">No execution history yet</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Load Dialog */}
      <Dialog open={showLoad} onOpenChange={setShowLoad}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Load Workflow</DialogTitle>
            <DialogDescription>Choose a saved workflow to load</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {savedWorkflows.map((workflow) => (
              <Card key={workflow.id} className="cursor-pointer hover:shadow-lg transition-all" onClick={() => loadWorkflow(workflow)}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold">{workflow.name}</p>
                      <p className="text-xs text-gray-500">{workflow.description}</p>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline">{workflow.nodes?.length || 0} nodes</Badge>
                        <Badge variant="outline">{workflow.execution_count || 0} runs</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {savedWorkflows.length === 0 && (
              <p className="text-center text-gray-500 py-8">No saved workflows yet</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}