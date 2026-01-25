import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bot, Plus, Play, Pause, Trash2, Settings, Zap, Clock, Mail, Webhook, Sparkles, RefreshCw, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import CryptoTradingBotBuilder from '@/components/bots/CryptoTradingBotBuilder';
import { toast } from 'sonner';

const triggerTypes = [
  { id: 'schedule', name: 'Schedule', icon: Clock, description: 'Run on a schedule' },
  { id: 'webhook', name: 'Webhook', icon: Webhook, description: 'Trigger via HTTP request' },
  { id: 'email', name: 'Email', icon: Mail, description: 'Trigger on email received' },
  { id: 'entity_change', name: 'Entity Change', icon: Zap, description: 'When entity data changes' }
];

const botTemplates = [
  { 
    name: 'Email Assistant Bot',
    description: 'Auto-read emails, suggest replies, auto-respond to queries, and schedule appointments',
    trigger: { type: 'email', config: {} },
    icon: Mail,
    category: 'email',
    workflow: [
      'Monitor incoming emails',
      'Analyze email content with AI',
      'Generate appropriate responses',
      'Auto-reply or suggest manual reply',
      'Extract meeting requests and schedule'
    ]
  },
  {
    name: 'Customer Support Bot',
    description: 'Automatically respond to customer queries and escalate when needed',
    trigger: { type: 'email', config: {} },
    icon: Zap,
    category: 'email',
    workflow: [
      'Receive customer inquiry',
      'Analyze sentiment and urgency',
      'Search knowledge base',
      'Generate helpful response',
      'Escalate to human if needed'
    ]
  },
  {
    name: 'Meeting Scheduler Bot',
    description: 'Parse meeting requests from emails and automatically schedule appointments',
    trigger: { type: 'email', config: {} },
    icon: Clock,
    category: 'email',
    workflow: [
      'Detect meeting request in email',
      'Extract preferred times',
      'Check calendar availability',
      'Propose meeting times',
      'Send calendar invite'
    ]
  },
  {
    name: 'Crypto Trading Bot',
    description: 'Grid trading, DCA, arbitrage, momentum trading with risk management',
    trigger: { type: 'schedule', config: {} },
    icon: TrendingUp,
    category: 'trading',
    workflow: [
      'Monitor cryptocurrency prices',
      'Calculate trading signals',
      'Execute buy/sell orders',
      'Manage positions',
      'Log performance metrics'
    ]
  },
  {
    name: 'Data Aggregator Bot',
    description: 'Collect data from multiple sources and consolidate into your system',
    trigger: { type: 'schedule', config: {} },
    icon: Zap,
    category: 'data_processing',
    workflow: [
      'Fetch data from APIs',
      'Transform and validate',
      'Aggregate results',
      'Store in database',
      'Send notifications'
    ]
  },
  {
    name: 'Alert Monitor Bot',
    description: 'Monitor metrics and send alerts when thresholds are exceeded',
    trigger: { type: 'entity_change', config: {} },
    icon: Zap,
    category: 'monitoring',
    workflow: [
      'Track metric values',
      'Compare against thresholds',
      'Generate alerts',
      'Notify stakeholders',
      'Log incident'
    ]
  }
];

export default function BotBuilder() {
  const [showDialog, setShowDialog] = useState(false);
  const [selectedBot, setSelectedBot] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [newBot, setNewBot] = useState({
    name: '',
    description: '',
    trigger: { type: 'schedule', config: {} },
    nodes: [],
    status: 'draft'
  });

  const urlParams = new URLSearchParams(window.location.search);
  const projectId = urlParams.get('projectId');

  const queryClient = useQueryClient();

  const { data: bots = [], isLoading } = useQuery({
    queryKey: ['automations', projectId],
    queryFn: () => base44.entities.Automation.filter({ project_id: projectId }),
    enabled: !!projectId
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Automation.create({ ...data, project_id: projectId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automations', projectId] });
      setShowDialog(false);
      setNewBot({ name: '', description: '', trigger: { type: 'schedule', config: {} }, nodes: [], status: 'draft' });
      toast.success('Bot created successfully');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Automation.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automations', projectId] });
      toast.success('Bot updated');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Automation.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automations', projectId] });
      toast.success('Bot deleted');
    }
  });

  const toggleStatus = (bot) => {
    const newStatus = bot.status === 'active' ? 'paused' : 'active';
    updateMutation.mutate({ id: bot.id, data: { status: newStatus } });
  };

  const generateBotWorkflow = async (description) => {
    setIsGenerating(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Create an automation bot workflow for: ${description}
        
        Provide:
        - name: short descriptive name
        - description: what the bot does
        - trigger_type: best trigger (schedule, webhook, email, entity_change)
        - workflow_steps: array of 3-5 steps the bot should perform
        
        Make it practical and actionable.`,
        response_json_schema: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            description: { type: 'string' },
            trigger_type: { type: 'string' },
            workflow_steps: { type: 'array', items: { type: 'string' } }
          }
        }
      });
      
      setNewBot({
        ...newBot,
        name: result.name,
        description: result.description,
        trigger: { type: result.trigger_type, config: {} }
      });
      toast.success('AI workflow generated!');
    } catch (error) {
      toast.error('Failed to generate workflow');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!projectId) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Bot className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Select a Project</h2>
          <p className="text-gray-500">Choose a project to create and manage bots</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Bot Builder</h1>
          <p className="text-gray-500">Create automated workflows and intelligent bots</p>
        </div>
        <Button onClick={() => setShowDialog(true)} className="bg-gray-900 hover:bg-gray-800">
          <Plus className="w-4 h-4 mr-2" />
          Create Bot
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-4" />
              <div className="h-4 bg-gray-100 rounded w-full mb-2" />
              <div className="h-4 bg-gray-100 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : bots.length === 0 ? (
        <div className="text-center py-12">
          <Bot className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No bots yet</h3>
          <p className="text-gray-500 mb-4">Create your first automation bot</p>
          <Button onClick={() => setShowDialog(true)}>Create Bot</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bots.map((bot) => (
            <Card key={bot.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                      <Bot className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{bot.name}</CardTitle>
                      <Badge variant={bot.status === 'active' ? 'default' : 'secondary'} className="mt-1">
                        {bot.status}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteMutation.mutate(bot.id)}
                  >
                    <Trash2 className="w-4 h-4 text-gray-400" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">{bot.description}</p>
                <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                  <span>Trigger: {bot.trigger?.type || 'None'}</span>
                  <span>Runs: {bot.execution_count || 0}</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => toggleStatus(bot)}
                    variant={bot.status === 'active' ? 'outline' : 'default'}
                    className="flex-1"
                    size="sm"
                  >
                    {bot.status === 'active' ? (
                      <>
                        <Pause className="w-3 h-3 mr-1" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play className="w-3 h-3 mr-1" />
                        Activate
                      </>
                    )}
                  </Button>
                  <Button variant="outline" size="sm">
                    <Settings className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Bot</DialogTitle>
          </DialogHeader>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Basic Bots</TabsTrigger>
              <TabsTrigger value="trading">Trading</TabsTrigger>
              <TabsTrigger value="custom">Custom</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-4">
              <Label className="mb-2 block">Quick Start Templates</Label>
              <div className="grid grid-cols-1 gap-2 mb-4">
                {botTemplates.filter(t => t.category === 'email').map((template, idx) => {
                  const TemplateIcon = template.icon;
                  return (
                    <Card 
                      key={idx} 
                      className="cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => {
                        setNewBot({
                          name: template.name,
                          description: template.description,
                          trigger: template.trigger,
                          nodes: template.workflow.map((step, i) => ({
                            id: `node-${i}`,
                            name: step,
                            type: 'action'
                          })),
                          status: 'draft'
                        });
                        setActiveTab('custom');
                      }}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                            <TemplateIcon className="w-5 h-5 text-indigo-600" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-sm mb-1">{template.name}</h4>
                            <p className="text-xs text-gray-600 mb-2">{template.description}</p>
                            <div className="flex flex-wrap gap-1">
                              {template.workflow.slice(0, 3).map((step, i) => (
                                <Badge key={i} variant="outline" className="text-xs">
                                  {step}
                                </Badge>
                              ))}
                              {template.workflow.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{template.workflow.length - 3} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="trading" className="space-y-4 mt-4">
              <Label className="mb-2 block">Crypto & Trading Bots</Label>
              <CryptoTradingBotBuilder onSave={(botConfig) => {
                setNewBot(botConfig);
                setActiveTab('custom');
              }} />
            </TabsContent>

            <TabsContent value="custom" className="space-y-4 mt-4">
              <div className="border-t pt-4">
                <Label className="mb-2 block">AI Bot Generator</Label>
                <div className="flex gap-2 mb-3">
                  <Input
                    placeholder="Describe what you want to automate..."
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                        generateBotWorkflow(e.currentTarget.value);
                      }
                    }}
                  />
                  <Button
                    variant="outline"
                    onClick={(e) => {
                      const input = e.currentTarget.previousElementSibling;
                      if (input.value.trim()) generateBotWorkflow(input.value);
                    }}
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
              <div>
                <Label>Bot Name</Label>
                <Input
                  value={newBot.name}
                  onChange={(e) => setNewBot({ ...newBot, name: e.target.value })}
                  placeholder="My Automation Bot"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={newBot.description}
                  onChange={(e) => setNewBot({ ...newBot, description: e.target.value })}
                  placeholder="What does this bot do?"
                  rows={3}
                />
              </div>
              <div>
                <Label>Trigger Type</Label>
                <Select
                  value={newBot.trigger.type}
                  onValueChange={(value) => setNewBot({ ...newBot, trigger: { type: value, config: {} } })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {triggerTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        <div className="flex items-center gap-2">
                          <type.icon className="w-4 h-4" />
                          <div>
                            <div className="font-medium">{type.name}</div>
                            <div className="text-xs text-gray-500">{type.description}</div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              </TabsContent>
              </Tabs>

              <DialogFooter>
              <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
              <Button onClick={() => createMutation.mutate(newBot)} disabled={!newBot.name}>
                Create Bot
              </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}