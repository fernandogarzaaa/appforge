import React, { useState, useEffect } from 'react';
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
  Save, Play, Plus, FolderOpen, Download, Upload, Loader2,
  Database, Brain, Mail, FileText, BarChart3, Stethoscope, Building2
} from 'lucide-react';

const nodeTemplates = [
  { type: 'trigger', name: 'Start Workflow', icon: Play, defaultConfig: {} },
  { type: 'data_input', name: 'Data Input', icon: Database, defaultConfig: { source: '', format: 'csv' } },
  { type: 'llm', name: 'AI Processing', icon: Brain, defaultConfig: { prompt: '', model: 'gpt-4' } },
  { type: 'data_analysis', name: 'Data Analysis', icon: BarChart3, defaultConfig: { analysis_type: 'statistical' } },
  { type: 'medical_ai', name: 'Medical AI Tool', icon: Stethoscope, defaultConfig: { tool: 'symptoms' } },
  { type: 'government_ai', name: 'Government AI Tool', icon: Building2, defaultConfig: { tool: 'policy' } },
  { type: 'email', name: 'Send Email', icon: Mail, defaultConfig: { to: '', subject: '', body: '' } },
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

  const { data: savedWorkflows = [] } = useQuery({
    queryKey: ['workflows'],
    queryFn: () => base44.entities.Workflow.list('-created_date')
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
      category: 'custom'
    });
  };

  const loadWorkflow = (workflow) => {
    setNodes(workflow.nodes || []);
    setConnections(workflow.connections || []);
    setWorkflowName(workflow.name);
    setWorkflowDescription(workflow.description || '');
    setCurrentWorkflowId(workflow.id);
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
    toast.loading('Executing workflow...');

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
        if (node.type === 'trigger') {
          results[node.id] = { status: 'started', timestamp: new Date().toISOString() };
          continue;
        }

        if (node.type === 'llm') {
          const response = await base44.integrations.Core.InvokeLLM({
            prompt: node.config.prompt || 'Process this data: ' + JSON.stringify(previousOutput)
          });
          previousOutput = response;
          results[node.id] = { status: 'success', output: response };
        }
        else if (node.type === 'data_analysis') {
          const prompt = `Perform ${node.config.analysis_type || 'statistical'} analysis on: ${JSON.stringify(previousOutput)}`;
          const response = await base44.integrations.Core.InvokeLLM({ prompt });
          previousOutput = response;
          results[node.id] = { status: 'success', output: response };
        }
        else if (node.type === 'email') {
          await base44.integrations.Core.SendEmail({
            to: node.config.to,
            subject: node.config.subject || 'Workflow Result',
            body: node.config.body || JSON.stringify(previousOutput)
          });
          results[node.id] = { status: 'success', output: 'Email sent' };
        }
        else if (node.type === 'output') {
          results[node.id] = { status: 'success', output: previousOutput };
        }
        else {
          results[node.id] = { status: 'skipped', reason: 'Node type not yet implemented' };
        }
      }

      setExecutionResults(results);
      toast.dismiss();
      toast.success('Workflow executed successfully!');

      // Update execution count
      if (currentWorkflowId) {
        await base44.entities.Workflow.update(currentWorkflowId, {
          execution_count: (savedWorkflows.find(w => w.id === currentWorkflowId)?.execution_count || 0) + 1,
          last_executed: new Date().toISOString()
        });
        queryClient.invalidateQueries({ queryKey: ['workflows'] });
      }

    } catch (error) {
      toast.dismiss();
      toast.error('Workflow execution failed: ' + error.message);
    } finally {
      setIsExecuting(false);
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
              </CardContent>
            </Card>
          )}

          {/* Execution Results */}
          {executionResults && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Execution Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(executionResults).map(([nodeId, result]) => {
                    const node = nodes.find(n => n.id === nodeId);
                    return (
                      <div key={nodeId} className="p-2 bg-gray-50 rounded text-xs">
                        <div className="font-semibold mb-1">{node?.name}</div>
                        <Badge className={result.status === 'success' ? 'bg-green-600' : 'bg-gray-600'}>
                          {result.status}
                        </Badge>
                        {result.output && (
                          <pre className="mt-2 text-xs overflow-auto max-h-32">
                            {typeof result.output === 'string' ? result.output : JSON.stringify(result.output, null, 2)}
                          </pre>
                        )}
                      </div>
                    );
                  })}
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