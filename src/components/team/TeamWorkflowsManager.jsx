import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Workflow, Webhook, Clock, Play, Pause, Trash2, 
  Plus, Check, AlertCircle, Loader, Link as LinkIcon 
} from 'lucide-react';
import { useTeamWorkflows } from '@/features/teamWorkflows/useTeamWorkflows';

export default function TeamWorkflowsManager() {
  const {
    workflows,
    createWorkflow,
    deleteWorkflow,
    toggleWorkflow,
    webhooks,
    registerWebhook,
    deleteWebhook,
    automations,
    createStandupAutomation,
    deleteAutomation,
    toggleAutomation,
    integratedServices,
    connectService,
    disconnectService
  } = useTeamWorkflows();

  const [activeTab, setActiveTab] = useState('workflows');
  const [showNewWorkflow, setShowNewWorkflow] = useState(false);
  const [showNewWebhook, setShowNewWebhook] = useState(false);
  const [showNewAutomation, setShowNewAutomation] = useState(false);

  // New workflow state
  const [newWorkflow, setNewWorkflow] = useState({
    name: '',
    description: '',
    trigger: 'manual',
    actions: []
  });

  // New webhook state
  const [newWebhook, setNewWebhook] = useState({
    url: '',
    event: 'push',
    secret: ''
  });

  // New automation state
  const [newAutomation, setNewAutomation] = useState({
    type: 'standup',
    config: {}
  });

  const handleCreateWorkflow = () => {
    createWorkflow(newWorkflow);
    setNewWorkflow({ name: '', description: '', trigger: 'manual', actions: [] });
    setShowNewWorkflow(false);
  };

  const handleRegisterWebhook = () => {
    registerWebhook(newWebhook);
    setNewWebhook({ url: '', event: 'push', secret: '' });
    setShowNewWebhook(false);
  };

  const handleCreateAutomation = () => {
    if (newAutomation.type === 'standup') {
      createStandupAutomation(newAutomation.config);
    }
    setNewAutomation({ type: 'standup', config: {} });
    setShowNewAutomation(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Team Workflows</h2>
          <p className="text-muted-foreground">
            Automate your team's processes with workflows, webhooks, and scheduled tasks
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="workflows" className="flex items-center gap-2">
            <Workflow className="w-4 h-4" />
            Workflows ({workflows.length})
          </TabsTrigger>
          <TabsTrigger value="webhooks" className="flex items-center gap-2">
            <Webhook className="w-4 h-4" />
            Webhooks ({webhooks.length})
          </TabsTrigger>
          <TabsTrigger value="automations" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Automations ({automations.length})
          </TabsTrigger>
          <TabsTrigger value="integrations" className="flex items-center gap-2">
            <LinkIcon className="w-4 h-4" />
            Integrations
          </TabsTrigger>
        </TabsList>

        {/* Workflows Tab */}
        <TabsContent value="workflows" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Create automated workflows triggered by events
            </p>
            <Button onClick={() => setShowNewWorkflow(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Workflow
            </Button>
          </div>

          {showNewWorkflow && (
            <Card>
              <CardHeader>
                <CardTitle>Create New Workflow</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="workflow-name">Workflow Name</Label>
                  <Input
                    id="workflow-name"
                    value={newWorkflow.name}
                    onChange={(e) => setNewWorkflow({ ...newWorkflow, name: e.target.value })}
                    placeholder="Deploy to production"
                  />
                </div>
                <div>
                  <Label htmlFor="workflow-description">Description</Label>
                  <Input
                    id="workflow-description"
                    value={newWorkflow.description}
                    onChange={(e) => setNewWorkflow({ ...newWorkflow, description: e.target.value })}
                    placeholder="Automatically deploy when PR is merged"
                  />
                </div>
                <div>
                  <Label htmlFor="workflow-trigger">Trigger</Label>
                  <select
                    id="workflow-trigger"
                    value={newWorkflow.trigger}
                    onChange={(e) => setNewWorkflow({ ...newWorkflow, trigger: e.target.value })}
                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                  >
                    <option value="manual">Manual</option>
                    <option value="pr_merged">PR Merged</option>
                    <option value="commit_pushed">Commit Pushed</option>
                    <option value="issue_created">Issue Created</option>
                    <option value="schedule">Scheduled</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleCreateWorkflow}>Create Workflow</Button>
                  <Button variant="outline" onClick={() => setShowNewWorkflow(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4">
            {workflows.map((workflow) => (
              <Card key={workflow.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {workflow.name}
                        {workflow.enabled ? (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                            Active
                          </span>
                        ) : (
                          <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                            Paused
                          </span>
                        )}
                      </CardTitle>
                      <CardDescription>{workflow.description}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleWorkflow(workflow.id)}
                      >
                        {workflow.enabled ? (
                          <Pause className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteWorkflow(workflow.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-sm space-y-1">
                    <p><strong>Trigger:</strong> {workflow.trigger}</p>
                    <p><strong>Actions:</strong> {workflow.actions.join(', ') || 'None'}</p>
                    <p className="text-muted-foreground">
                      Last run: {workflow.lastRun ? new Date(workflow.lastRun).toLocaleString() : 'Never'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Webhooks Tab */}
        <TabsContent value="webhooks" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Configure webhooks to receive events from external services
            </p>
            <Button onClick={() => setShowNewWebhook(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Webhook
            </Button>
          </div>

          {showNewWebhook && (
            <Card>
              <CardHeader>
                <CardTitle>Register New Webhook</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="webhook-url">Callback URL</Label>
                  <Input
                    id="webhook-url"
                    value={newWebhook.url}
                    onChange={(e) => setNewWebhook({ ...newWebhook, url: e.target.value })}
                    placeholder="https://api.example.com/webhook"
                  />
                </div>
                <div>
                  <Label htmlFor="webhook-event">Event Type</Label>
                  <select
                    id="webhook-event"
                    value={newWebhook.event}
                    onChange={(e) => setNewWebhook({ ...newWebhook, event: e.target.value })}
                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                  >
                    <option value="push">Push</option>
                    <option value="pull_request">Pull Request</option>
                    <option value="issue">Issue</option>
                    <option value="deployment">Deployment</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="webhook-secret">Secret (optional)</Label>
                  <Input
                    id="webhook-secret"
                    type="password"
                    value={newWebhook.secret}
                    onChange={(e) => setNewWebhook({ ...newWebhook, secret: e.target.value })}
                    placeholder="Webhook secret for verification"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleRegisterWebhook}>Register Webhook</Button>
                  <Button variant="outline" onClick={() => setShowNewWebhook(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4">
            {webhooks.map((webhook) => (
              <Card key={webhook.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {webhook.event} Webhook
                        {webhook.active && (
                          <Check className="w-4 h-4 text-green-500" />
                        )}
                      </CardTitle>
                      <CardDescription className="font-mono text-xs">
                        {webhook.url}
                      </CardDescription>
                    </div>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteWebhook(webhook.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">
                    Last triggered: {webhook.lastTriggered ? new Date(webhook.lastTriggered).toLocaleString() : 'Never'}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Automations Tab */}
        <TabsContent value="automations" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Schedule recurring tasks and automations
            </p>
            <Button onClick={() => setShowNewAutomation(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Automation
            </Button>
          </div>

          <div className="grid gap-4">
            {automations.map((automation) => (
              <Card key={automation.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {automation.name}
                        {automation.enabled ? (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                            Active
                          </span>
                        ) : (
                          <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                            Paused
                          </span>
                        )}
                      </CardTitle>
                      <CardDescription>{automation.description}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleAutomation(automation.id)}
                      >
                        {automation.enabled ? (
                          <Pause className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteAutomation(automation.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-sm space-y-1">
                    <p><strong>Schedule:</strong> {automation.schedule}</p>
                    <p className="text-muted-foreground">
                      Last run: {automation.lastRun ? new Date(automation.lastRun).toLocaleString() : 'Never'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Integrations Tab */}
        <TabsContent value="integrations" className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Connect external services to your workflows
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {['slack', 'teams', 'discord', 'github', 'jira'].map((service) => {
              const isConnected = integratedServices[service]?.connected;
              
              return (
                <Card key={service}>
                  <CardHeader>
                    <CardTitle className="capitalize">{service}</CardTitle>
                    <CardDescription>
                      {isConnected ? 'Connected' : 'Not connected'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isConnected ? (
                      <Button
                        variant="outline"
                        onClick={() => disconnectService(service)}
                      >
                        Disconnect
                      </Button>
                    ) : (
                      <Button onClick={() => connectService(service, {})}>
                        Connect
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
