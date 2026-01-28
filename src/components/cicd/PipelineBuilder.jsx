import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Trash2, Save, Copy } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export default function PipelineBuilder({ botId }) {
  const queryClient = useQueryClient();
  const [pipelineName, setPipelineName] = useState('');
  const [repoUrl, setRepoUrl] = useState('');
  const [gitProvider, setGitProvider] = useState('github');
  const [triggerEvents, setTriggerEvents] = useState(['push']);
  const [triggerBranches, setTriggerBranches] = useState(['main', 'develop']);
  const [stages, setStages] = useState([
    { id: 'test', name: 'Test', type: 'test', required: true },
    { id: 'build', name: 'Build', type: 'build', required: true }
  ]);
  const [showDialog, setShowDialog] = useState(false);

  const { data: pipelines = [] } = useQuery({
    queryKey: ['botPipelines', botId],
    queryFn: () => base44.entities.BotPipeline.filter({ bot_id: botId })
  });

  const createPipelineMutation = useMutation({
    mutationFn: (data) => base44.entities.BotPipeline.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['botPipelines', botId] });
      resetForm();
      setShowDialog(false);
      toast.success('Pipeline created');
    }
  });

  const deletePipelineMutation = useMutation({
    mutationFn: (id) => base44.entities.BotPipeline.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['botPipelines', botId] });
      toast.success('Pipeline deleted');
    }
  });

  const handleAddStage = () => {
    setStages([
      ...stages,
      { id: `stage-${Date.now()}`, name: 'New Stage', type: 'custom', required: true }
    ]);
  };

  const handleRemoveStage = (id) => {
    setStages(stages.filter(s => s.id !== id));
  };

  const handleSavePipeline = () => {
    if (!pipelineName || !repoUrl) {
      toast.error('Pipeline name and repo URL are required');
      return;
    }

    createPipelineMutation.mutate({
      bot_id: botId,
      name: pipelineName,
      repository_url: repoUrl,
      git_provider: gitProvider,
      webhook_secret: `secret-${Date.now()}`,
      trigger_events: triggerEvents,
      trigger_branches: triggerBranches,
      stages,
      is_active: true
    });
  };

  const resetForm = () => {
    setPipelineName('');
    setRepoUrl('');
    setGitProvider('github');
    setTriggerEvents(['push']);
    setTriggerBranches(['main', 'develop']);
    setStages([
      { id: 'test', name: 'Test', type: 'test', required: true },
      { id: 'build', name: 'Build', type: 'build', required: true }
    ]);
  };

  const getWebhookUrl = () => {
    return `${window.location.origin}/api/handleGitWebhook`;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">CI/CD Pipelines ({pipelines.length})</h3>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="w-3 h-3 mr-1" /> New Pipeline
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create CI/CD Pipeline</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-xs">Pipeline Name</Label>
                <Input
                  value={pipelineName}
                  onChange={(e) => setPipelineName(e.target.value)}
                  placeholder="e.g., Main Production Pipeline"
                  className="text-sm"
                />
              </div>

              <div>
                <Label className="text-xs">Repository URL</Label>
                <Input
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  placeholder="https://github.com/user/repo"
                  className="text-sm"
                />
              </div>

              <div>
                <Label className="text-xs">Git Provider</Label>
                <Select value={gitProvider} onValueChange={setGitProvider}>
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="github">GitHub</SelectItem>
                    <SelectItem value="gitlab">GitLab</SelectItem>
                    <SelectItem value="bitbucket">Bitbucket</SelectItem>
                    <SelectItem value="gitea">Gitea</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs">Trigger Events</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {['push', 'pull_request', 'tag', 'manual'].map(event => (
                    <button
                      key={event}
                      onClick={() => {
                        if (triggerEvents.includes(event)) {
                          setTriggerEvents(triggerEvents.filter(e => e !== event));
                        } else {
                          setTriggerEvents([...triggerEvents, event]);
                        }
                      }}
                      className={`px-3 py-1 rounded text-xs font-semibold ${
                        triggerEvents.includes(event)
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      {event}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-xs">Trigger Branches (comma-separated patterns)</Label>
                <Input
                  value={triggerBranches.join(', ')}
                  onChange={(e) => setTriggerBranches(e.target.value.split(',').map(b => b.trim()))}
                  placeholder="main, develop, release/*"
                  className="text-sm"
                />
              </div>

              <div>
                <Label className="text-xs mb-2 block">Pipeline Stages</Label>
                <div className="space-y-2">
                  {stages.map((stage, idx) => (
                    <div key={stage.id} className="flex gap-2 items-end">
                      <Input
                        value={stage.name}
                        onChange={(e) => {
                          const updated = [...stages];
                          updated[idx].name = e.target.value;
                          setStages(updated);
                        }}
                        placeholder="Stage name"
                        className="text-sm flex-1"
                      />
                      <Select
                        value={stage.type}
                        onValueChange={(t) => {
                          const updated = [...stages];
                          updated[idx].type = t;
                          setStages(updated);
                        }}
                      >
                        <SelectTrigger className="w-32 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="test">Test</SelectItem>
                          <SelectItem value="build">Build</SelectItem>
                          <SelectItem value="deploy">Deploy</SelectItem>
                          <SelectItem value="custom">Custom</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemoveStage(stage.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Button size="sm" variant="outline" className="w-full mt-2" onClick={handleAddStage}>
                  <Plus className="w-3 h-3 mr-1" /> Add Stage
                </Button>
              </div>

              <div className="pt-4 border-t">
                <Label className="text-xs font-semibold">Webhook URL</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    readOnly
                    value={getWebhookUrl()}
                    className="text-xs bg-gray-50"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(getWebhookUrl());
                      toast.success('Webhook URL copied');
                    }}
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-2">Add this URL as a webhook in your Git provider</p>
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={handleSavePipeline} className="flex-1">
                  <Save className="w-3 h-3 mr-1" /> Create Pipeline
                </Button>
                <Button variant="outline" onClick={() => setShowDialog(false)} className="flex-1">
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2">
        {pipelines.map((pipeline) => (
          <Card key={pipeline.id} className="hover:shadow-sm transition-shadow">
            <CardContent className="pt-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-semibold text-sm">{pipeline.name}</p>
                  <p className="text-xs text-gray-600 mt-1">{pipeline.repository_url}</p>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">{pipeline.git_provider}</span>
                    {pipeline.trigger_events?.map(event => (
                      <span key={event} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                        {event}
                      </span>
                    ))}
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                      {pipeline.stages?.length || 0} stages
                    </span>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => deletePipelineMutation.mutate(pipeline.id)}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}