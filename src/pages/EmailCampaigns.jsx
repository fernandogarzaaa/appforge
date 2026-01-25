import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { 
  Mail, Send, Users, TrendingUp, Eye, MousePointer, 
  Sparkles, RefreshCw, Plus, Calendar
} from 'lucide-react';
import { toast } from 'sonner';

const emailTemplates = [
  { id: 'welcome', name: 'Welcome Email', category: 'onboarding' },
  { id: 'newsletter', name: 'Newsletter', category: 'marketing' },
  { id: 'promotion', name: 'Promotional', category: 'marketing' },
  { id: 'announcement', name: 'Announcement', category: 'updates' },
  { id: 'follow-up', name: 'Follow-up', category: 'sales' },
  { id: 'survey', name: 'Survey Request', category: 'feedback' }
];

export default function EmailCampaigns() {
  const [campaigns, setCampaigns] = useState([
    { id: 1, name: 'Welcome Series', status: 'active', sent: 1240, opened: 856, clicked: 342 },
    { id: 2, name: 'Product Launch', status: 'scheduled', sent: 0, opened: 0, clicked: 0 }
  ]);
  const [showDialog, setShowDialog] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    subject: '',
    audience: 'all',
    template: 'welcome',
    content: ''
  });

  const generateEmailContent = async () => {
    setGenerating(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Create a professional ${newCampaign.template} email with the subject: "${newCampaign.subject}"

Requirements:
- Engaging and personalized
- Clear call-to-action
- Professional formatting
- Mobile-friendly
- Persuasive copy

Provide the email body in HTML format.`,
        response_json_schema: {
          type: 'object',
          properties: {
            html_content: { type: 'string' },
            plain_text: { type: 'string' },
            preview_text: { type: 'string' }
          }
        }
      });

      setNewCampaign({ ...newCampaign, content: result.html_content });
      toast.success('Email content generated!');
    } catch (error) {
      toast.error('Failed to generate content');
    } finally {
      setGenerating(false);
    }
  };

  const createCampaign = () => {
    if (!newCampaign.name || !newCampaign.subject) {
      toast.error('Fill in required fields');
      return;
    }

    setCampaigns([...campaigns, {
      id: Date.now(),
      name: newCampaign.name,
      status: 'draft',
      sent: 0,
      opened: 0,
      clicked: 0
    }]);

    toast.success('Campaign created');
    setShowDialog(false);
    setNewCampaign({ name: '', subject: '', audience: 'all', template: 'welcome', content: '' });
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Email Campaigns</h1>
          <p className="text-gray-500">Create and manage email marketing campaigns</p>
        </div>
        <Button onClick={() => setShowDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Campaign
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <Send className="w-5 h-5 text-blue-600" />
              <Badge variant="outline">+12%</Badge>
            </div>
            <div className="text-2xl font-bold">3,240</div>
            <p className="text-sm text-gray-600">Emails Sent</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <Eye className="w-5 h-5 text-green-600" />
              <Badge variant="outline">+8%</Badge>
            </div>
            <div className="text-2xl font-bold">2,156</div>
            <p className="text-sm text-gray-600">Opened</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <MousePointer className="w-5 h-5 text-purple-600" />
              <Badge variant="outline">+15%</Badge>
            </div>
            <div className="text-2xl font-bold">642</div>
            <p className="text-sm text-gray-600">Clicked</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-5 h-5 text-orange-600" />
              <Badge variant="outline">66.5%</Badge>
            </div>
            <div className="text-2xl font-bold">19.8%</div>
            <p className="text-sm text-gray-600">Click Rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Campaigns List */}
      <Card>
        <CardHeader>
          <CardTitle>Active Campaigns</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {campaigns.map(campaign => (
              <Card key={campaign.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <Mail className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{campaign.name}</h3>
                      <div className="flex gap-4 text-xs text-gray-600 mt-1">
                        <span>Sent: {campaign.sent}</span>
                        <span>Opened: {campaign.opened}</span>
                        <span>Clicked: {campaign.clicked}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={campaign.status === 'active' ? 'default' : 'outline'}>
                      {campaign.status}
                    </Badge>
                    <Button variant="outline" size="sm">View</Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Create Campaign Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Email Campaign</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Campaign Name</Label>
                <Input
                  value={newCampaign.name}
                  onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                  placeholder="Monthly Newsletter"
                  className="mt-2"
                />
              </div>
              <div>
                <Label>Template</Label>
                <Select
                  value={newCampaign.template}
                  onValueChange={(value) => setNewCampaign({ ...newCampaign, template: value })}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {emailTemplates.map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Subject Line</Label>
              <Input
                value={newCampaign.subject}
                onChange={(e) => setNewCampaign({ ...newCampaign, subject: e.target.value })}
                placeholder="Your Amazing Subject Line"
                className="mt-2"
              />
            </div>

            <div>
              <Label>Target Audience</Label>
              <Select
                value={newCampaign.audience}
                onValueChange={(value) => setNewCampaign({ ...newCampaign, audience: value })}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subscribers</SelectItem>
                  <SelectItem value="active">Active Users</SelectItem>
                  <SelectItem value="new">New Subscribers</SelectItem>
                  <SelectItem value="custom">Custom Segment</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Email Content</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={generateEmailContent}
                  disabled={generating || !newCampaign.subject}
                >
                  {generating ? (
                    <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                  ) : (
                    <Sparkles className="w-3 h-3 mr-1" />
                  )}
                  Generate with AI
                </Button>
              </div>
              <Textarea
                value={newCampaign.content}
                onChange={(e) => setNewCampaign({ ...newCampaign, content: e.target.value })}
                placeholder="Email content..."
                rows={8}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={createCampaign}>Create Campaign</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}