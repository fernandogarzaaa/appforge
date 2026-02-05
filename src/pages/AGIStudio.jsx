import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  Brain, Zap, Globe, MessageSquare, Settings, Sparkles,
  Plus, Check, Loader2, Database, Workflow
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const commonIntegrations = [
  { id: 'google_calendar', name: 'Google Calendar', icon: '📅' },
  { id: 'gmail', name: 'Gmail', icon: '📧' },
  { id: 'slack', name: 'Slack', icon: '💬' },
  { id: 'notion', name: 'Notion', icon: '📝' },
  { id: 'github', name: 'GitHub', icon: '🐙' },
  { id: 'stripe', name: 'Stripe', icon: '💳' },
  { id: 'openai', name: 'OpenAI', icon: '🤖' },
  { id: 'weather', name: 'Weather API', icon: '🌤️' },
];

export default function AGIStudio() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [botName, setBotName] = useState('');
  const [botPurpose, setBotPurpose] = useState('');
  const [selectedIntegrations, setSelectedIntegrations] = useState([]);
  const [autonomyLevel, setAutonomyLevel] = useState('high');
  const [offlineMode, setOfflineMode] = useState(true);
  const queryClient = useQueryClient();

  const { data: chatbots = [], isLoading } = useQuery({
    queryKey: ['chatbots_agi'],
    queryFn: () => base44.entities.Chatbot.filter({ 'metadata.agi_mode': true }),
  });

  const createBotMutation = useMutation({
    mutationFn: async (data) => {
      const result = await base44.functions.invoke('createAGIBot', {
        name: data.name,
        purpose: data.purpose,
        integrations: data.integrations,
        autonomyLevel: data.autonomyLevel,
        offlineMode: data.offlineMode
      });
      return result.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['chatbots_agi'] });
      toast.success(`AGI Bot "${data.chatbot.name}" created successfully!`);
      setShowCreateDialog(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(`Failed to create bot: ${error.message}`);
    }
  });

  const resetForm = () => {
    setBotName('');
    setBotPurpose('');
    setSelectedIntegrations([]);
    setAutonomyLevel('high');
    setOfflineMode(true);
  };

  const toggleIntegration = (integrationId) => {
    setSelectedIntegrations(prev =>
      prev.includes(integrationId)
        ? prev.filter(id => id !== integrationId)
        : [...prev, integrationId]
    );
  };

  const handleCreate = () => {
    if (!botName.trim() || !botPurpose.trim()) {
      toast.error('Please provide bot name and purpose');
      return;
    }

    createBotMutation.mutate({
      name: botName,
      purpose: botPurpose,
      integrations: selectedIntegrations,
      autonomyLevel,
      offlineMode
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">AGI Studio</h1>
              <p className="text-gray-600">Create advanced AI assistants with multi-service integration</p>
            </div>
          </div>

          <Button
            onClick={() => setShowCreateDialog(true)}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create AGI Bot
          </Button>
        </div>

        {/* Feature Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="border-purple-200 bg-white/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Zap className="w-5 h-5 text-purple-600" />
                Autonomous Execution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Bots can break down complex tasks and execute them independently with minimal supervision
              </p>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-white/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Globe className="w-5 h-5 text-blue-600" />
                Multi-Service Integration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Connect with APIs, databases, and external services seamlessly to accomplish goals
              </p>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-white/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Database className="w-5 h-5 text-green-600" />
                Offline Capable
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Cache data locally and continue functioning with limited connectivity
              </p>
            </CardContent>
          </Card>
        </div>

        {/* AGI Bots List */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Your AGI Assistants</h2>
          
          {isLoading ? (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto" />
            </div>
          ) : chatbots.length === 0 ? (
            <Card className="border-2 border-dashed">
              <CardContent className="p-12 text-center">
                <Brain className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No AGI bots yet</h3>
                <p className="text-gray-600 mb-4">
                  Create your first AGI assistant to automate tasks across multiple services
                </p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Bot
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {chatbots.map((bot, index) => (
                <motion.div
                  key={bot.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="hover:shadow-lg transition-all">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <Brain className="w-5 h-5 text-purple-600" />
                            {bot.name}
                          </CardTitle>
                          <CardDescription className="mt-1">
                            {bot.description}
                          </CardDescription>
                        </div>
                        <Badge className="bg-green-100 text-green-700 border-0">
                          Active
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Workflow className="w-4 h-4" />
                          <span>{bot.metadata?.workflows?.length || 0} workflows</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Globe className="w-4 h-4" />
                          <span>{bot.metadata?.integration_plan?.length || 0} integrations</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Zap className="w-4 h-4" />
                          <span>Autonomy: {bot.metadata?.autonomy_level || 'medium'}</span>
                        </div>
                        
                        <div className="flex gap-2 pt-3">
                          <Button size="sm" variant="outline" className="flex-1">
                            <Settings className="w-3 h-3 mr-1" />
                            Configure
                          </Button>
                          <a
                            href={base44.agents.getWhatsAppConnectURL('agi_assistant')}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1"
                          >
                            <Button size="sm" className="w-full bg-green-600 hover:bg-green-700">
                              <MessageSquare className="w-3 h-3 mr-1" />
                              WhatsApp
                            </Button>
                          </a>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Bot Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-600" />
              Create AGI Bot
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Basic Info */}
            <div className="space-y-4">
              <div>
                <Label>Bot Name</Label>
                <Input
                  value={botName}
                  onChange={(e) => setBotName(e.target.value)}
                  placeholder="e.g., Personal Assistant, Business Automator"
                />
              </div>

              <div>
                <Label>Purpose & Capabilities</Label>
                <Textarea
                  value={botPurpose}
                  onChange={(e) => setBotPurpose(e.target.value)}
                  placeholder="Describe what this bot should do... e.g., 'Manage my calendar, send emails, track tasks, and provide daily summaries'"
                  rows={4}
                />
              </div>
            </div>

            {/* Integrations */}
            <div>
              <Label className="mb-3 block">Select Integrations</Label>
              <div className="grid grid-cols-2 gap-2">
                {commonIntegrations.map((integration) => (
                  <button
                    key={integration.id}
                    onClick={() => toggleIntegration(integration.id)}
                    className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                      selectedIntegrations.includes(integration.id)
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-purple-300'
                    }`}
                  >
                    <span className="text-xl">{integration.icon}</span>
                    <span className="text-sm font-medium">{integration.name}</span>
                    {selectedIntegrations.includes(integration.id) && (
                      <Check className="w-4 h-4 ml-auto text-purple-600" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Settings */}
            <div className="space-y-4">
              <div>
                <Label className="mb-2 block">Autonomy Level</Label>
                <div className="flex gap-2">
                  {['low', 'medium', 'high'].map((level) => (
                    <button
                      key={level}
                      onClick={() => setAutonomyLevel(level)}
                      className={`flex-1 py-2 px-4 rounded-lg border-2 transition-all ${
                        autonomyLevel === level
                          ? 'border-purple-500 bg-purple-50 text-purple-700'
                          : 'border-gray-200 hover:border-purple-300'
                      }`}
                    >
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <Label>Offline Mode</Label>
                  <p className="text-xs text-gray-600">Enable local caching and offline operation</p>
                </div>
                <button
                  onClick={() => setOfflineMode(!offlineMode)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    offlineMode ? 'bg-purple-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                      offlineMode ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowCreateDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={createBotMutation.isPending}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                {createBotMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Create Bot
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}