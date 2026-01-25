import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bot, Plus, Play, Pause, Trash2, Settings, Zap, Clock, Mail, Webhook } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const triggerTypes = [
  { id: 'schedule', name: 'Schedule', icon: Clock, description: 'Run on a schedule' },
  { id: 'webhook', name: 'Webhook', icon: Webhook, description: 'Trigger via HTTP request' },
  { id: 'email', name: 'Email', icon: Mail, description: 'Trigger on email received' },
  { id: 'entity_change', name: 'Entity Change', icon: Zap, description: 'When entity data changes' }
];

export default function BotBuilder() {
  const [showDialog, setShowDialog] = useState(false);
  const [selectedBot, setSelectedBot] = useState(null);
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
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Bot</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
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
          </div>
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