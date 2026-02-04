import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import CustomAgentBuilder from '@/components/ai/CustomAgentBuilder';
import CustomAgentTrainer from '@/components/ai/CustomAgentTrainer';
import AgentVersionHistory from '@/components/versioning/AgentVersionHistory';
import { Sparkles, Plus, Save } from 'lucide-react';

export default function CustomAgentStudio() {
  const [user, setUser] = useState(null);
  const [agents, setAgents] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [showBuilder, setShowBuilder] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (user) {
      loadAgents();
      const interval = setInterval(loadAgents, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const loadUser = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
    } catch (error) {
      console.error('Failed to load user:', error);
    }
  };

  const loadAgents = async () => {
    try {
      const data = await base44.entities.CustomAgent.filter(
        { user_id: user?.email },
        '-updated_date',
        20
      );
      setAgents(data || []);
    } catch (error) {
      console.error('Failed to load agents:', error);
    }
  };

  const toggleAgentStatus = async (agentId, isActive) => {
    try {
      await base44.entities.CustomAgent.update(agentId, { is_active: !isActive });
      loadAgents();
    } catch (error) {
      console.error('Failed to update agent:', error);
    }
  };

  const saveAgentVersion = async (agentId) => {
    if (!saveMessage.trim()) {
      alert('Enter a change description');
      return;
    }

    setIsSaving(true);
    try {
      await base44.functions.invoke('saveAgentVersion', {
        agentId,
        changeMessage: saveMessage
      });
      setSaveMessage('');
      loadAgents();
      alert('Version saved successfully!');
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save version');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-slate-950 dark:to-slate-900 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-8 h-8" />
            Custom Agent Studio
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Create, train, and fine-tune AI agents tailored to your needs
          </p>
        </div>

        <Tabs defaultValue="manage" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manage">My Agents</TabsTrigger>
            <TabsTrigger value="create">Create New</TabsTrigger>
          </TabsList>

          {/* Manage Agents */}
          <TabsContent value="manage" className="space-y-4">
            {agents.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="p-8 text-center">
                  <p className="text-gray-600 mb-4">No custom agents yet</p>
                  <Button
                    onClick={() => setShowBuilder(true)}
                    className="bg-gradient-to-r from-purple-600 to-pink-600"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Agent
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {agents.map((agent) => (
                  <Card key={agent.id} className="border-purple-200">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-900">{agent.agent_name}</h3>
                          <p className="text-sm text-gray-600 mt-1">{agent.description}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {agent.is_active ? (
                            <Badge className="bg-green-600">Active</Badge>
                          ) : (
                            <Badge variant="outline">Inactive</Badge>
                          )}
                          <Badge variant="outline">v{agent.version}</Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3 mb-3">
                        <div className="p-2 rounded bg-gray-50">
                          <p className="text-xs text-gray-600">Accuracy</p>
                          <p className="font-semibold text-sm">
                            {((agent.performance_metrics?.accuracy || 0) * 100).toFixed(0)}%
                          </p>
                        </div>
                        <div className="p-2 rounded bg-gray-50">
                          <p className="text-xs text-gray-600">Satisfaction</p>
                          <p className="font-semibold text-sm">
                            {((agent.performance_metrics?.user_satisfaction || 0) * 100).toFixed(0)}%
                          </p>
                        </div>
                        <div className="p-2 rounded bg-gray-50">
                          <p className="text-xs text-gray-600">Iterations</p>
                          <p className="font-semibold text-sm">
                            {agent.performance_metrics?.training_iterations || 0}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedAgent(agent.id)}
                          className="flex-1"
                        >
                          Train
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleAgentStatus(agent.id, agent.is_active)}
                          className="flex-1"
                        >
                          {agent.is_active ? 'Disable' : 'Enable'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Create New */}
          <TabsContent value="create">
            <CustomAgentBuilder
              userEmail={user?.email}
              onAgentCreated={() => {
                loadAgents();
                setShowBuilder(false);
              }}
            />
          </TabsContent>
        </Tabs>

        {/* Training & Versioning Interface */}
        {selectedAgent && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <Card className="w-full max-w-2xl my-4">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Agent Management</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedAgent(null)}
                >
                  ✕
                </Button>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="train" className="space-y-4">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="train">Train</TabsTrigger>
                    <TabsTrigger value="versions">Versions</TabsTrigger>
                    <TabsTrigger value="save">Save Version</TabsTrigger>
                  </TabsList>

                  <TabsContent value="train">
                    <CustomAgentTrainer
                      agentId={selectedAgent}
                      onTrainingComplete={() => {
                        loadAgents();
                      }}
                    />
                  </TabsContent>

                  <TabsContent value="versions">
                    <AgentVersionHistory
                      agentId={selectedAgent}
                      onRevert={() => loadAgents()}
                      onDeploy={() => loadAgents()}
                    />
                  </TabsContent>

                  <TabsContent value="save" className="space-y-3">
                    <div>
                      <label className="text-xs font-semibold block mb-1">What changed?</label>
                      <textarea
                        placeholder="Describe the changes made to this agent..."
                        value={saveMessage}
                        onChange={(e) => setSaveMessage(e.target.value)}
                        className="w-full px-2 py-1.5 text-xs border rounded-lg h-20"
                      />
                    </div>
                    <Button
                      onClick={() => saveAgentVersion(selectedAgent)}
                      disabled={isSaving}
                      className="w-full bg-gradient-to-r from-green-600 to-emerald-600"
                    >
                      <Save className="w-3 h-3 mr-1" />
                      {isSaving ? 'Saving...' : 'Save as Version'}
                    </Button>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}