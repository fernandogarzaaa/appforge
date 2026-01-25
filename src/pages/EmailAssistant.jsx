import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { 
  Mail, Plus, Settings, Inbox, Send, Calendar, 
  Sparkles, CheckCircle, Clock, AlertCircle, Trash2, RefreshCw
} from 'lucide-react';

export default function EmailAssistant() {
  const queryClient = useQueryClient();
  const [showConnect, setShowConnect] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [newEmail, setNewEmail] = useState('');
  const [editingReply, setEditingReply] = useState('');

  const { data: accounts = [] } = useQuery({
    queryKey: ['email-accounts'],
    queryFn: () => base44.entities.EmailAccount.list('-created_date')
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['email-messages'],
    queryFn: () => base44.entities.EmailMessage.list('-received_at', 50)
  });

  const connectAccountMutation = useMutation({
    mutationFn: (data) => base44.entities.EmailAccount.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-accounts'] });
      setShowConnect(false);
      toast.success('Email account connected!');
    }
  });

  const updateAccountMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.EmailAccount.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-accounts'] });
      toast.success('Settings updated!');
    }
  });

  const sendReplyMutation = useMutation({
    mutationFn: async ({ messageId, reply }) => {
      await base44.integrations.Core.SendEmail({
        to: messages.find(m => m.id === messageId)?.from_email,
        subject: 'Re: ' + messages.find(m => m.id === messageId)?.subject,
        body: reply
      });
      return base44.entities.EmailMessage.update(messageId, {
        status: 'replied',
        reply_sent_at: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-messages'] });
      setSelectedMessage(null);
      toast.success('Reply sent!');
    }
  });

  const analyzeEmail = async (message) => {
    toast.loading('Analyzing email...');
    
    const analysis = await base44.integrations.Core.InvokeLLM({
      prompt: `Analyze this email and provide structured analysis:
From: ${message.from_email}
Subject: ${message.subject}
Body: ${message.body}

Provide category (query/assignment/meeting_request/general/spam), priority (high/medium/low), sentiment, whether it requires response, and suggested action.`,
      response_json_schema: {
        type: "object",
        properties: {
          category: { type: "string" },
          priority: { type: "string" },
          sentiment: { type: "string" },
          requires_response: { type: "boolean" },
          suggested_action: { type: "string" }
        }
      }
    });

    const suggestedReply = await base44.integrations.Core.InvokeLLM({
      prompt: `Generate a professional reply to this email:
From: ${message.from_email}
Subject: ${message.subject}
Body: ${message.body}

Generate a helpful, professional response.`
    });

    await base44.entities.EmailMessage.update(message.id, {
      ai_analysis: analysis,
      suggested_reply: suggestedReply,
      status: 'read'
    });

    queryClient.invalidateQueries({ queryKey: ['email-messages'] });
    toast.dismiss();
    toast.success('Email analyzed!');
  };

  const autoReplyToEmail = async (message) => {
    if (!message.suggested_reply) {
      await analyzeEmail(message);
      const updated = await base44.entities.EmailMessage.filter({ id: message.id });
      message = updated[0];
    }

    await sendReplyMutation.mutateAsync({ messageId: message.id, reply: message.suggested_reply });
    await base44.entities.EmailMessage.update(message.id, { auto_replied: true });
  };

  const syncEmails = async () => {
    toast.loading('Syncing emails...');
    
    // Simulate syncing - in real implementation, this would call email API
    const mockEmails = [
      {
        account_id: accounts[0]?.id,
        message_id: `msg-${Date.now()}`,
        from_email: 'client@example.com',
        to_email: accounts[0]?.email,
        subject: 'Project Update Request',
        body: 'Hi, can you provide an update on the project timeline?',
        received_at: new Date().toISOString()
      }
    ];

    for (const email of mockEmails) {
      await base44.entities.EmailMessage.create(email);
    }

    queryClient.invalidateQueries({ queryKey: ['email-messages'] });
    toast.dismiss();
    toast.success(`Synced ${mockEmails.length} new emails`);
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'query': return <AlertCircle className="w-4 h-4" />;
      case 'assignment': return <CheckCircle className="w-4 h-4" />;
      case 'meeting_request': return <Calendar className="w-4 h-4" />;
      default: return <Mail className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-600';
      case 'medium': return 'bg-yellow-600';
      case 'low': return 'bg-green-600';
      default: return 'bg-gray-600';
    }
  };

  return (
    <div className="h-screen flex flex-col p-6 bg-gray-50">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">AI Email Assistant</h1>
          <p className="text-gray-500">AI-powered email management and automation</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={syncEmails}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Sync Emails
          </Button>
          <Button variant="outline" onClick={() => setShowConnect(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Connect Account
          </Button>
        </div>
      </div>

      {accounts.length === 0 ? (
        <Card className="max-w-2xl mx-auto mt-20">
          <CardContent className="pt-6 text-center">
            <Mail className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Email Accounts Connected</h3>
            <p className="text-gray-500 mb-4">Connect your email account to start using AI-powered features</p>
            <Button onClick={() => setShowConnect(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Connect Email Account
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-4 gap-4 flex-1 overflow-hidden">
          {/* Sidebar - Accounts */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Connected Accounts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {accounts.map(account => (
                <div
                  key={account.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedAccount?.id === account.id ? 'bg-indigo-50 border-indigo-600' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedAccount(account)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Mail className="w-4 h-4 text-indigo-600" />
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedAccount(account);
                        setShowSettings(true);
                      }}
                    >
                      <Settings className="w-3 h-3" />
                    </Button>
                  </div>
                  <p className="text-sm font-semibold truncate">{account.email}</p>
                  <div className="flex gap-1 mt-2">
                    {account.auto_reply_enabled && (
                      <Badge variant="outline" className="text-xs">Auto-Reply</Badge>
                    )}
                    {account.scheduling_enabled && (
                      <Badge variant="outline" className="text-xs">Scheduling</Badge>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Main Content - Messages */}
          <div className="col-span-2 flex flex-col gap-4">
            <Card className="flex-1 overflow-hidden flex flex-col">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Inbox ({messages.length})</CardTitle>
                  <Badge variant="outline">
                    {messages.filter(m => m.status === 'unread').length} unread
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto space-y-2">
                {messages.map(message => (
                  <div
                    key={message.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedMessage?.id === message.id ? 'bg-indigo-50 border-indigo-600' : 'hover:bg-gray-50'
                    } ${message.status === 'unread' ? 'border-l-4 border-l-indigo-600' : ''}`}
                    onClick={() => setSelectedMessage(message)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{message.from_email}</p>
                        <p className="text-sm text-gray-600">{message.subject}</p>
                      </div>
                      {message.ai_analysis && (
                        <div className="flex gap-1">
                          {getCategoryIcon(message.ai_analysis.category)}
                          <Badge className={getPriorityColor(message.ai_analysis.priority)}>
                            {message.ai_analysis.priority}
                          </Badge>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="outline" className="text-xs">{message.status}</Badge>
                      {message.auto_replied && (
                        <Badge className="bg-green-600 text-xs">Auto-Replied</Badge>
                      )}
                    </div>
                  </div>
                ))}
                {messages.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <Inbox className="w-12 h-12 mx-auto mb-2" />
                    <p>No emails yet. Click "Sync Emails" to load messages.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Message Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Email Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedMessage ? (
                <>
                  <div>
                    <label className="text-xs text-gray-500">From</label>
                    <p className="text-sm font-semibold">{selectedMessage.from_email}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Subject</label>
                    <p className="text-sm font-semibold">{selectedMessage.subject}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Body</label>
                    <p className="text-sm text-gray-600 max-h-32 overflow-y-auto">{selectedMessage.body}</p>
                  </div>

                  {selectedMessage.ai_analysis && (
                    <div className="border-t pt-4">
                      <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-indigo-600" />
                        AI Analysis
                      </h4>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Category:</span>
                          <span className="font-semibold">{selectedMessage.ai_analysis.category}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Sentiment:</span>
                          <span className="font-semibold">{selectedMessage.ai_analysis.sentiment}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Action:</span>
                          <p className="mt-1">{selectedMessage.ai_analysis.suggested_action}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="border-t pt-4 space-y-2">
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => analyzeEmail(selectedMessage)}
                      disabled={!!selectedMessage.ai_analysis}
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      {selectedMessage.ai_analysis ? 'Already Analyzed' : 'Analyze with AI'}
                    </Button>

                    {selectedMessage.suggested_reply && (
                      <>
                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">Suggested Reply</label>
                          <Textarea
                            value={editingReply || selectedMessage.suggested_reply}
                            onChange={(e) => setEditingReply(e.target.value)}
                            rows={4}
                            className="text-sm"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="flex-1"
                            onClick={() => sendReplyMutation.mutate({
                              messageId: selectedMessage.id,
                              reply: editingReply || selectedMessage.suggested_reply
                            })}
                          >
                            <Send className="w-4 h-4 mr-2" />
                            Send Reply
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => autoReplyToEmail(selectedMessage)}
                          >
                            Auto-Reply
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Mail className="w-12 h-12 mx-auto mb-2" />
                  <p>Select an email to view details</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Connect Account Dialog */}
      <Dialog open={showConnect} onOpenChange={setShowConnect}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect Email Account</DialogTitle>
            <DialogDescription>Add your email account to enable AI features</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Email Address</label>
              <Input
                type="email"
                placeholder="you@example.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Provider</label>
              <Select defaultValue="gmail">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gmail">Gmail</SelectItem>
                  <SelectItem value="outlook">Outlook</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              className="w-full"
              onClick={() => connectAccountMutation.mutate({
                email: newEmail,
                provider: 'gmail',
                auto_reply_enabled: true,
                auto_reply_rules: {
                  tone: 'professional',
                  max_response_length: 500
                }
              })}
            >
              Connect Account
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Email Account Settings</DialogTitle>
          </DialogHeader>
          {selectedAccount && (
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Auto-Reply</h4>
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    checked={selectedAccount.auto_reply_enabled}
                    onChange={(e) => updateAccountMutation.mutate({
                      id: selectedAccount.id,
                      data: { auto_reply_enabled: e.target.checked }
                    })}
                    className="rounded"
                  />
                  <label className="text-sm">Enable auto-reply</label>
                </div>
                {selectedAccount.auto_reply_enabled && (
                  <Select
                    value={selectedAccount.auto_reply_rules?.tone || 'professional'}
                    onValueChange={(value) => updateAccountMutation.mutate({
                      id: selectedAccount.id,
                      data: {
                        auto_reply_rules: {
                          ...selectedAccount.auto_reply_rules,
                          tone: value
                        }
                      }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="friendly">Friendly</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div>
                <h4 className="font-semibold mb-2">Scheduling</h4>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedAccount.scheduling_enabled}
                    onChange={(e) => updateAccountMutation.mutate({
                      id: selectedAccount.id,
                      data: { scheduling_enabled: e.target.checked }
                    })}
                    className="rounded"
                  />
                  <label className="text-sm">Enable auto-scheduling</label>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}