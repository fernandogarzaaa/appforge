import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';


import { 
  Zap, Plus, Play, Pause, Trash2, Globe,
  Clock, Mail, Webhook, Database, Code, GitBranch,
  ArrowRight, MessageSquare, FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const TRIGGER_TYPES = [
  { id: 'webhook', name: 'Webhook', icon: Webhook, color: 'from-blue-500 to-cyan-500', description: 'Trigger on HTTP webhook' },
  { id: 'schedule', name: 'Schedule', icon: Clock, color: 'from-purple-500 to-indigo-500', description: 'Run on schedule (cron)' },
  { id: 'email', name: 'Email', icon: Mail, color: 'from-green-500 to-emerald-500', description: 'Trigger on email received' },
  { id: 'form_submit', name: 'Form Submit', icon: FileText, color: 'from-orange-500 to-amber-500', description: 'When form is submitted' },
  { id: 'api_call', name: 'API Call', icon: Globe, color: 'from-pink-500 to-rose-500', description: 'External API trigger' },
  { id: 'entity_change', name: 'Entity Change', icon: Database, color: 'from-teal-500 to-cyan-500', description: 'Database record change' },
];

const ACTION_NODES = [
  { id: 'http_request', name: 'HTTP Request', icon: Globe, color: 'from-blue-500 to-cyan-500', description: 'Make API call' },
  { id: 'send_email', name: 'Send Email', icon: Mail, color: 'from-green-500 to-emerald-500', description: 'Send email notification' },
  { id: 'database', name: 'Database', icon: Database, color: 'from-purple-500 to-indigo-500', description: 'Read/write database' },
  { id: 'ai_process', name: 'AI Processing', icon: Zap, color: 'from-yellow-500 to-orange-500', description: 'Process with AI' },
  { id: 'code', name: 'Run Code', icon: Code, color: 'from-gray-500 to-gray-700', description: 'Execute custom code' },
  { id: 'condition', name: 'Condition', icon: GitBranch, color: 'from-pink-500 to-rose-500', description: 'If/else logic' },
  { id: 'slack', name: 'Slack', icon: MessageSquare, color: 'from-violet-500 to-purple-500', description: 'Send Slack message' },
  { id: 'delay', name: 'Delay', icon: Clock, color: 'from-orange-500 to-amber-500', description: 'Wait before continue' },
];

export default function AutomationBuilder({ projectId }) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showNodeDialog, setShowNodeDialog] = useState(false);
  const [selectedAutomation, setSelectedAutomation] = useState(null);
  const [newAutomation, setNewAutomation] = useState({ name: '', description: '', trigger: null });
  const [nodes, setNodes] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const queryClient = useQueryClient();

  const { data: automations = [], isLoading } = useQuery({
    queryKey: ['automations', projectId],
    queryFn: () => base44.entities.Automation.filter({ project_id: projectId }),
    enabled: !!projectId,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Automation.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automations'] });
      setShowCreateDialog(false);
      setNewAutomation({ name: '', description: '', trigger: null });
      toast.success('Automation created!');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Automation.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automations'] });
      toast.success('Automation updated!');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Automation.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automations'] });
      setSelectedAutomation(null);
      toast.success('Automation deleted!');
    },
  });

  const handleCreateAutomation = () => {
    if (!newAutomation.name || !newAutomation.trigger) {
      toast.error('Enter name and select trigger');
      return;
    }
    
    createMutation.mutate({
      project_id: projectId,
      name: newAutomation.name,
      description: newAutomation.description,
      trigger: { type: newAutomation.trigger, config: {} },
      nodes: [],
      connections: [],
      status: 'draft',
    });
  };

  const handleAddNode = (nodeType) => {
    const newNode = {
      id: `node_${Date.now()}`,
      type: nodeType.id,
      name: nodeType.name,
      config: {},
      position: { x: 100 + nodes.length * 200, y: 100 },
    };
    
    const updatedNodes = [...nodes, newNode];
    setNodes(updatedNodes);
    
    if (selectedAutomation) {
      updateMutation.mutate({
        id: selectedAutomation.id,
        data: { ...selectedAutomation, nodes: updatedNodes }
      });
    }
    
    setShowNodeDialog(false);
  };

  const toggleStatus = (automation) => {
    const newStatus = automation.status === 'active' ? 'paused' : 'active';
    updateMutation.mutate({
      id: automation.id,
      data: { ...automation, status: newStatus }
    });
  };

  const executeAutomation = async (automation) => {
    toast.loading('Executing automation...');
    
    // Simulate execution
    await new Promise(r => setTimeout(r, 2000));
    
    updateMutation.mutate({
      id: automation.id,
      data: { 
        ...automation, 
        execution_count: (automation.execution_count || 0) + 1,
        last_executed: new Date().toISOString()
      }
    });
    
    toast.success('Automation executed successfully!');
  };

  if (!selectedAutomation) {
    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">Automations</h3>
            <p className="text-sm text-gray-500">Create workflows with triggers and actions</p>
          </div>
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Automation
          </Button>
        </div>

        {/* Automation List */}
        <div className="grid grid-cols-2 gap-4">
          <AnimatePresence>
            {automations.map((auto) => {
              const trigger = TRIGGER_TYPES.find(t => t.id === auto.trigger?.type);
              const TriggerIcon = trigger?.icon || Zap;
              
              return (
                <motion.div
                  key={auto.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <Card 
                    className="rounded-xl cursor-pointer hover:shadow-lg transition-all"
                    onClick={() => {
                      setSelectedAutomation(auto);
                      setNodes(auto.nodes || []);
                    }}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center",
                            trigger?.color
                          )}>
                            <TriggerIcon className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <CardTitle className="text-base">{auto.name}</CardTitle>
                            <p className="text-xs text-gray-500 mt-0.5">{auto.description}</p>
                          </div>
                        </div>
                        <Badge className={
                          auto.status === 'active' 
                            ? "bg-green-100 text-green-700" 
                            : auto.status === 'paused'
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-gray-100 text-gray-700"
                        }>
                          {auto.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{auto.nodes?.length || 0} nodes</span>
                        <span>{auto.execution_count || 0} executions</span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Create Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="rounded-2xl max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Automation</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label className="text-sm mb-1.5 block">Name</Label>
                <Input
                  value={newAutomation.name}
                  onChange={(e) => setNewAutomation({ ...newAutomation, name: e.target.value })}
                  placeholder="My Automation"
                  className="rounded-xl"
                />
              </div>
              <div>
                <Label className="text-sm mb-1.5 block">Description</Label>
                <Textarea
                  value={newAutomation.description}
                  onChange={(e) => setNewAutomation({ ...newAutomation, description: e.target.value })}
                  placeholder="What does this automation do?"
                  className="rounded-xl resize-none h-20"
                />
              </div>
              <div>
                <Label className="text-sm mb-1.5 block">Trigger</Label>
                <div className="grid grid-cols-3 gap-2">
                  {TRIGGER_TYPES.map((trigger) => {
                    const Icon = trigger.icon;
                    return (
                      <button
                        key={trigger.id}
                        onClick={() => setNewAutomation({ ...newAutomation, trigger: trigger.id })}
                        className={cn(
                          "p-3 rounded-xl border text-left transition-all",
                          newAutomation.trigger === trigger.id
                            ? "border-indigo-500 bg-indigo-50"
                            : "border-gray-200 hover:bg-gray-50"
                        )}
                      >
                        <div className={cn(
                          "w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center mb-2",
                          trigger.color
                        )}>
                          <Icon className="w-4 h-4 text-white" />
                        </div>
                        <p className="font-medium text-xs">{trigger.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{trigger.description}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)} className="rounded-xl">
                Cancel
              </Button>
              <Button onClick={handleCreateAutomation} className="bg-indigo-600 text-white rounded-xl">
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Workflow Canvas View
  const trigger = TRIGGER_TYPES.find(t => t.id === selectedAutomation.trigger?.type);
  const TriggerIcon = trigger?.icon || Zap;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedAutomation(null)}
            className="rounded-lg"
          >
            ← Back
          </Button>
          <div>
            <h3 className="font-semibold text-gray-900">{selectedAutomation.name}</h3>
            <p className="text-sm text-gray-500">{selectedAutomation.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => toggleStatus(selectedAutomation)}
            className="rounded-lg"
          >
            {selectedAutomation.status === 'active' ? (
              <><Pause className="w-3 h-3 mr-1" /> Pause</>
            ) : (
              <><Play className="w-3 h-3 mr-1" /> Activate</>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => executeAutomation(selectedAutomation)}
            className="rounded-lg"
          >
            <Play className="w-3 h-3 mr-1" />
            Test Run
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => deleteMutation.mutate(selectedAutomation.id)}
            className="rounded-lg text-red-600 hover:bg-red-50"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Workflow Canvas */}
      <Card className="rounded-xl bg-gray-50">
        <CardContent className="p-6 min-h-[500px]">
          <div className="flex items-start gap-4">
            {/* Trigger Node */}
            <div className="flex flex-col items-center">
              <Card className="w-48 rounded-xl bg-white shadow-sm">
                <CardContent className="p-4">
                  <div className={cn(
                    "w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center mb-2",
                    trigger?.color
                  )}>
                    <TriggerIcon className="w-5 h-5 text-white" />
                  </div>
                  <p className="font-medium text-sm">Trigger</p>
                  <p className="text-xs text-gray-500">{trigger?.name}</p>
                </CardContent>
              </Card>
              {nodes.length > 0 && (
                <div className="w-0.5 h-12 bg-gray-300 my-2" />
              )}
            </div>

            {/* Action Nodes */}
            <div className="flex-1 space-y-4">
              {nodes.map((node, index) => {
                const nodeType = ACTION_NODES.find(n => n.id === node.type);
                const NodeIcon = nodeType?.icon || Code;
                
                return (
                  <div key={node.id} className="flex items-center gap-3">
                    <ArrowRight className="w-5 h-5 text-gray-400" />
                    <Card className="flex-1 rounded-xl bg-white shadow-sm">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center",
                            nodeType?.color
                          )}>
                            <NodeIcon className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-sm">{node.name}</p>
                            <p className="text-xs text-gray-500">{nodeType?.description}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              const updated = nodes.filter(n => n.id !== node.id);
                              setNodes(updated);
                              updateMutation.mutate({
                                id: selectedAutomation.id,
                                data: { ...selectedAutomation, nodes: updated }
                              });
                            }}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                );
              })}

              {/* Add Node Button */}
              <Button
                variant="outline"
                onClick={() => setShowNodeDialog(true)}
                className="w-full rounded-xl border-dashed h-20"
              >
                <Plus className="w-5 h-5 mr-2" />
                Add Action
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Node Dialog */}
      <Dialog open={showNodeDialog} onOpenChange={setShowNodeDialog}>
        <DialogContent className="rounded-2xl max-w-3xl">
          <DialogHeader>
            <DialogTitle>Add Action Node</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-4 gap-3 py-4">
            {ACTION_NODES.map((node) => {
              const Icon = node.icon;
              return (
                <button
                  key={node.id}
                  onClick={() => handleAddNode(node)}
                  className="p-3 rounded-xl border border-gray-200 hover:bg-gray-50 text-left transition-all"
                >
                  <div className={cn(
                    "w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center mb-2",
                    node.color
                  )}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <p className="font-medium text-xs">{node.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{node.description}</p>
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}