import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit2, Trash2, MessageSquare, Settings, Zap } from 'lucide-react';
import { toast } from 'sonner';
import ChatbotPersonalityConfig from './ChatbotPersonalityConfig';
import ChatbotKnowledgeConfig from './ChatbotKnowledgeConfig';
import ChatbotChannelConfig from './ChatbotChannelConfig';

export default function ChatbotBuilder() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBot, setEditingBot] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'customer_support',
    personality: {
      tone: 'professional',
      style: '',
      language: 'English',
      system_prompt: ''
    },
    knowledge_sources: [],
    channels: {
      whatsapp_enabled: false,
      email_enabled: false,
      website_enabled: true,
      api_enabled: false
    }
  });

  const queryClient = useQueryClient();

  const { data: chatbots = [] } = useQuery({
    queryKey: ['chatbots'],
    queryFn: () => base44.entities.Chatbot.list('-updated_date')
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Chatbot.create(data),
    onSuccess: async (newBot) => {
      queryClient.invalidateQueries({ queryKey: ['chatbots'] });
      setDialogOpen(false);
      resetForm();
      toast.success('Chatbot created successfully');
      
      // Create associated agent via function
      try {
        const agentConfig = {
          description: `Chatbot agent for ${newBot.name}`,
          instructions: formData.personality.system_prompt || `You are ${newBot.name}, a helpful assistant. ${formData.personality.style}`,
          tool_configs: formData.knowledge_sources.length > 0 
            ? formData.knowledge_sources.map(source => ({
                entity_name: source.entity_name || source.source_id || source.name,
                allowed_operations: ['read']
              }))
            : [],
          whatsapp_greeting: `Hi! I'm ${newBot.name}. How can I help you today?`
        };
        
        await base44.functions.invoke('createChatbotAgent', {
          chatbotId: newBot.id,
          agentConfig
        }).catch(err => console.warn('Agent creation skipped:', err));
      } catch (error) {
        console.warn('Agent setup optional:', error);
      }
    },
    onError: () => toast.error('Failed to create chatbot')
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Chatbot.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatbots'] });
      setDialogOpen(false);
      resetForm();
      toast.success('Chatbot updated successfully');
    },
    onError: () => toast.error('Failed to update chatbot')
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Chatbot.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatbots'] });
      toast.success('Chatbot deleted');
    },
    onError: () => toast.error('Failed to delete chatbot')
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Chatbot name is required');
      return;
    }

    if (editingBot) {
      updateMutation.mutate({ id: editingBot.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      type: 'customer_support',
      personality: {
        tone: 'professional',
        style: '',
        language: 'English',
        system_prompt: ''
      },
      knowledge_sources: [],
      channels: {
        whatsapp_enabled: false,
        email_enabled: false,
        website_enabled: true,
        api_enabled: false
      }
    });
    setEditingBot(null);
  };

  const openEditDialog = (bot) => {
    setEditingBot(bot);
    setFormData({
      ...bot,
      personality: bot.personality || {
        tone: 'professional',
        style: '',
        language: 'English',
        system_prompt: ''
      }
    });
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Chatbots</h1>
          <p className="text-gray-500 mt-2">Create and manage AI chatbots for various purposes</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="bg-indigo-600 hover:bg-indigo-700">
              <Plus className="w-4 h-4 mr-2" />
              Create Chatbot
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingBot ? 'Edit Chatbot' : 'Create New Chatbot'}</DialogTitle>
              <DialogDescription>
                Configure your chatbot's personality, knowledge sources, and channels
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Name</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Customer Support Bot"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="What does this chatbot do?"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Type</label>
                <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="customer_support">Customer Support</SelectItem>
                    <SelectItem value="lead_generation">Lead Generation</SelectItem>
                    <SelectItem value="knowledge_qa">Knowledge Q&A</SelectItem>
                    <SelectItem value="sales">Sales Assistant</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Tabs defaultValue="personality" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="personality">Personality</TabsTrigger>
                  <TabsTrigger value="knowledge">Knowledge</TabsTrigger>
                  <TabsTrigger value="channels">Channels</TabsTrigger>
                </TabsList>
                <TabsContent value="personality">
                  <ChatbotPersonalityConfig
                    personality={formData.personality}
                    onUpdate={(personality) => setFormData({ ...formData, personality })}
                  />
                </TabsContent>
                <TabsContent value="knowledge">
                  <ChatbotKnowledgeConfig
                    sources={formData.knowledge_sources}
                    onUpdate={(sources) => setFormData({ ...formData, knowledge_sources: sources })}
                  />
                </TabsContent>
                <TabsContent value="channels">
                  <ChatbotChannelConfig
                    channels={formData.channels}
                    onUpdate={(channels) => setFormData({ ...formData, channels })}
                  />
                </TabsContent>
              </Tabs>

              <div className="flex gap-2 justify-end pt-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
                  {editingBot ? 'Update' : 'Create'} Chatbot
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Chatbots Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {chatbots.map((bot) => (
          <Card key={bot.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{bot.name}</CardTitle>
                  <CardDescription className="mt-1 text-xs">
                    {bot.type.replace('_', ' ')}
                  </CardDescription>
                </div>
                {bot.is_active && (
                  <div className="h-2 w-2 rounded-full bg-green-500 mt-1" />
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">{bot.description}</p>
              
              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-500 uppercase">Channels</p>
                <div className="flex flex-wrap gap-2">
                  {bot.channels?.whatsapp_enabled && (
                    <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded">WhatsApp</span>
                  )}
                  {bot.channels?.email_enabled && (
                    <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">Email</span>
                  )}
                  {bot.channels?.website_enabled && (
                    <span className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded">Website</span>
                  )}
                  {bot.channels?.api_enabled && (
                    <span className="text-xs bg-gray-50 text-gray-700 px-2 py-1 rounded">API</span>
                  )}
                </div>
              </div>

              {bot.total_conversations > 0 && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MessageSquare className="w-4 h-4" />
                  <span>{bot.total_conversations} conversations</span>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => openEditDialog(bot)}
                >
                  <Edit2 className="w-3 h-3 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => deleteMutation.mutate(bot.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {chatbots.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MessageSquare className="w-12 h-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No chatbots yet</h3>
            <p className="text-gray-500 text-center mt-2">Create your first chatbot to get started</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}