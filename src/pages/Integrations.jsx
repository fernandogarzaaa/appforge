import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  Bot, Database, Mail, MessageSquare, Zap, Code, 
  Cloud, Share2, CreditCard, BarChart3, FileText,
  Globe, Search, CheckCircle, Plus, Settings, Star,
  Users, Briefcase, ShoppingCart, TrendingUp, Package,
  Calendar, Video, Phone, DollarSign, Lock, Download
} from 'lucide-react';
import { toast } from 'sonner';

const integrations = {
  ai: [
    { name: 'OpenAI', description: 'GPT-4, DALL-E, Whisper APIs', icon: Bot, status: 'connected', color: 'green', rating: 4.9 },
    { name: 'Anthropic Claude', description: 'Claude 3 Opus, Sonnet & Haiku', icon: Bot, status: 'available', color: 'purple', rating: 4.8 },
    { name: 'Google Gemini', description: 'Gemini Pro & Ultra models', icon: Bot, status: 'available', color: 'blue', rating: 4.7 },
    { name: 'Mistral AI', description: 'Mistral Large & Medium', icon: Bot, status: 'available', color: 'orange', rating: 4.6 },
    { name: 'Cohere', description: 'Command & Embed models', icon: Bot, status: 'available', color: 'pink', rating: 4.5 },
    { name: 'Hugging Face', description: 'Access 100K+ AI models', icon: Bot, status: 'available', color: 'yellow', rating: 4.7 },
    { name: 'Replicate', description: 'Run AI models in cloud', icon: Bot, status: 'available', color: 'indigo', rating: 4.6 },
    { name: 'Stability AI', description: 'Stable Diffusion image generation', icon: Bot, status: 'available', color: 'violet', rating: 4.8 }
  ],
  crm: [
    { name: 'Salesforce', description: 'Leading CRM platform', icon: Briefcase, status: 'available', color: 'blue', rating: 4.8 },
    { name: 'HubSpot', description: 'All-in-one CRM', icon: Briefcase, status: 'available', color: 'orange', rating: 4.7 },
    { name: 'Pipedrive', description: 'Sales CRM & pipeline', icon: Briefcase, status: 'available', color: 'green', rating: 4.6 },
    { name: 'Zoho CRM', description: 'Customer management', icon: Briefcase, status: 'available', color: 'red', rating: 4.5 },
    { name: 'Freshsales', description: 'AI-powered CRM', icon: Briefcase, status: 'available', color: 'blue', rating: 4.4 },
    { name: 'Close', description: 'CRM for startups', icon: Briefcase, status: 'available', color: 'purple', rating: 4.6 },
    { name: 'Copper', description: 'Google Workspace CRM', icon: Briefcase, status: 'available', color: 'yellow', rating: 4.5 }
  ],
  project_management: [
    { name: 'Jira', description: 'Project & issue tracking', icon: BarChart3, status: 'available', color: 'blue', rating: 4.6 },
    { name: 'Trello', description: 'Visual project boards', icon: BarChart3, status: 'available', color: 'blue', rating: 4.7 },
    { name: 'Asana', description: 'Work management', icon: BarChart3, status: 'available', color: 'pink', rating: 4.7 },
    { name: 'Monday.com', description: 'Team collaboration', icon: BarChart3, status: 'available', color: 'red', rating: 4.6 },
    { name: 'Linear', description: 'Issue tracking', icon: BarChart3, status: 'available', color: 'purple', rating: 4.8 },
    { name: 'ClickUp', description: 'All-in-one workspace', icon: BarChart3, status: 'available', color: 'pink', rating: 4.5 },
    { name: 'Basecamp', description: 'Project management', icon: BarChart3, status: 'available', color: 'green', rating: 4.4 },
    { name: 'Wrike', description: 'Work management', icon: BarChart3, status: 'available', color: 'blue', rating: 4.5 }
  ],
  communication: [
    { name: 'Slack', description: 'Team messaging', icon: MessageSquare, status: 'available', color: 'purple', rating: 4.8 },
    { name: 'Microsoft Teams', description: 'Business chat', icon: MessageSquare, status: 'available', color: 'blue', rating: 4.6 },
    { name: 'Discord', description: 'Community platform', icon: MessageSquare, status: 'available', color: 'indigo', rating: 4.7 },
    { name: 'Telegram', description: 'Fast messaging', icon: MessageSquare, status: 'available', color: 'blue', rating: 4.6 },
    { name: 'WhatsApp Business', description: 'Business messaging', icon: MessageSquare, status: 'available', color: 'green', rating: 4.5 },
    { name: 'Twilio', description: 'SMS, Voice & Video', icon: Phone, status: 'available', color: 'red', rating: 4.7 },
    { name: 'SendGrid', description: 'Email delivery', icon: Mail, status: 'available', color: 'blue', rating: 4.6 },
    { name: 'Mailchimp', description: 'Email marketing', icon: Mail, status: 'available', color: 'yellow', rating: 4.5 },
    { name: 'Resend', description: 'Modern email API', icon: Mail, status: 'available', color: 'slate', rating: 4.7 },
    { name: 'Intercom', description: 'Customer messaging', icon: MessageSquare, status: 'available', color: 'blue', rating: 4.6 }
  ],
  development: [
    { name: 'GitHub', description: 'Version control', icon: Code, status: 'available', color: 'slate', rating: 4.9 },
    { name: 'GitLab', description: 'DevOps platform', icon: Code, status: 'available', color: 'orange', rating: 4.7 },
    { name: 'Bitbucket', description: 'Git solution', icon: Code, status: 'available', color: 'blue', rating: 4.5 },
    { name: 'Vercel', description: 'Deployment', icon: Cloud, status: 'available', color: 'black', rating: 4.8 },
    { name: 'Netlify', description: 'Web hosting', icon: Cloud, status: 'available', color: 'teal', rating: 4.7 },
    { name: 'Heroku', description: 'Cloud platform', icon: Cloud, status: 'available', color: 'purple', rating: 4.5 },
    { name: 'AWS', description: 'Cloud services', icon: Cloud, status: 'available', color: 'orange', rating: 4.7 },
    { name: 'Google Cloud', description: 'Cloud Platform', icon: Cloud, status: 'available', color: 'blue', rating: 4.7 },
    { name: 'Azure', description: 'Microsoft cloud', icon: Cloud, status: 'available', color: 'blue', rating: 4.6 },
    { name: 'DigitalOcean', description: 'Cloud computing', icon: Cloud, status: 'available', color: 'blue', rating: 4.6 }
  ],
  productivity: [
    { name: 'Notion', description: 'All-in-one workspace', icon: FileText, status: 'available', color: 'slate', rating: 4.8 },
    { name: 'Airtable', description: 'Database platform', icon: Database, status: 'available', color: 'yellow', rating: 4.7 },
    { name: 'Google Workspace', description: 'Docs, Sheets, Drive', icon: FileText, status: 'available', color: 'blue', rating: 4.7 },
    { name: 'Microsoft 365', description: 'Office suite', icon: FileText, status: 'available', color: 'blue', rating: 4.6 },
    { name: 'Dropbox', description: 'File storage', icon: Database, status: 'available', color: 'blue', rating: 4.5 },
    { name: 'Box', description: 'Content management', icon: Database, status: 'available', color: 'blue', rating: 4.4 },
    { name: 'Evernote', description: 'Note taking', icon: FileText, status: 'available', color: 'green', rating: 4.3 },
    { name: 'Confluence', description: 'Team workspace', icon: FileText, status: 'available', color: 'blue', rating: 4.5 }
  ],
  social: [
    { name: 'Twitter/X', description: 'Social network', icon: Share2, status: 'available', color: 'blue', rating: 4.5 },
    { name: 'LinkedIn', description: 'Professional network', icon: Share2, status: 'available', color: 'blue', rating: 4.6 },
    { name: 'Facebook', description: 'Social media', icon: Share2, status: 'available', color: 'blue', rating: 4.4 },
    { name: 'Instagram', description: 'Photo sharing', icon: Share2, status: 'available', color: 'pink', rating: 4.6 },
    { name: 'TikTok', description: 'Short videos', icon: Video, status: 'available', color: 'black', rating: 4.7 },
    { name: 'YouTube', description: 'Video platform', icon: Video, status: 'available', color: 'red', rating: 4.8 },
    { name: 'Reddit', description: 'Community forum', icon: Share2, status: 'available', color: 'orange', rating: 4.5 },
    { name: 'Pinterest', description: 'Visual discovery', icon: Share2, status: 'available', color: 'red', rating: 4.4 }
  ],
  payment: [
    { name: 'Stripe', description: 'Payment processing', icon: CreditCard, status: 'connected', color: 'purple', rating: 4.9 },
    { name: 'PayPal', description: 'Digital payments', icon: CreditCard, status: 'available', color: 'blue', rating: 4.6 },
    { name: 'Square', description: 'Payment platform', icon: CreditCard, status: 'available', color: 'slate', rating: 4.7 },
    { name: 'Braintree', description: 'Payment gateway', icon: CreditCard, status: 'available', color: 'blue', rating: 4.5 },
    { name: 'Razorpay', description: 'Payment solutions', icon: CreditCard, status: 'available', color: 'blue', rating: 4.6 },
    { name: 'Coinbase', description: 'Crypto payments', icon: CreditCard, status: 'available', color: 'blue', rating: 4.5 },
    { name: 'Adyen', description: 'Global payments', icon: CreditCard, status: 'available', color: 'green', rating: 4.6 }
  ],
  analytics: [
    { name: 'Google Analytics', description: 'Web analytics', icon: BarChart3, status: 'available', color: 'orange', rating: 4.7 },
    { name: 'Mixpanel', description: 'Product analytics', icon: BarChart3, status: 'available', color: 'purple', rating: 4.7 },
    { name: 'Amplitude', description: 'Digital analytics', icon: BarChart3, status: 'available', color: 'blue', rating: 4.6 },
    { name: 'Segment', description: 'Data platform', icon: BarChart3, status: 'available', color: 'green', rating: 4.7 },
    { name: 'PostHog', description: 'Product OS', icon: BarChart3, status: 'available', color: 'yellow', rating: 4.6 },
    { name: 'Heap', description: 'Digital insights', icon: BarChart3, status: 'available', color: 'purple', rating: 4.5 },
    { name: 'Hotjar', description: 'Behavior analytics', icon: BarChart3, status: 'available', color: 'red', rating: 4.5 }
  ],
  ecommerce: [
    { name: 'Shopify', description: 'E-commerce platform', icon: ShoppingCart, status: 'available', color: 'green', rating: 4.8 },
    { name: 'WooCommerce', description: 'WordPress commerce', icon: ShoppingCart, status: 'available', color: 'purple', rating: 4.6 },
    { name: 'BigCommerce', description: 'Online stores', icon: ShoppingCart, status: 'available', color: 'blue', rating: 4.5 },
    { name: 'Magento', description: 'Commerce platform', icon: ShoppingCart, status: 'available', color: 'orange', rating: 4.4 },
    { name: 'Amazon', description: 'Marketplace API', icon: ShoppingCart, status: 'available', color: 'orange', rating: 4.7 },
    { name: 'eBay', description: 'Online marketplace', icon: ShoppingCart, status: 'available', color: 'yellow', rating: 4.5 }
  ],
  marketing: [
    { name: 'HubSpot Marketing', description: 'Marketing automation', icon: TrendingUp, status: 'available', color: 'orange', rating: 4.7 },
    { name: 'Marketo', description: 'Marketing platform', icon: TrendingUp, status: 'available', color: 'purple', rating: 4.5 },
    { name: 'ActiveCampaign', description: 'Email marketing', icon: TrendingUp, status: 'available', color: 'blue', rating: 4.6 },
    { name: 'ConvertKit', description: 'Creator marketing', icon: TrendingUp, status: 'available', color: 'pink', rating: 4.5 },
    { name: 'Hootsuite', description: 'Social media management', icon: TrendingUp, status: 'available', color: 'slate', rating: 4.4 },
    { name: 'Buffer', description: 'Social scheduling', icon: TrendingUp, status: 'available', color: 'blue', rating: 4.5 }
  ],
  hr: [
    { name: 'BambooHR', description: 'HR management', icon: Users, status: 'available', color: 'green', rating: 4.6 },
    { name: 'Workday', description: 'Enterprise HR', icon: Users, status: 'available', color: 'orange', rating: 4.5 },
    { name: 'Gusto', description: 'Payroll & HR', icon: Users, status: 'available', color: 'red', rating: 4.7 },
    { name: 'ADP', description: 'Payroll services', icon: Users, status: 'available', color: 'blue', rating: 4.4 },
    { name: 'Rippling', description: 'Workforce platform', icon: Users, status: 'available', color: 'purple', rating: 4.6 }
  ],
  calendar: [
    { name: 'Google Calendar', description: 'Calendar management', icon: Calendar, status: 'available', color: 'blue', rating: 4.8 },
    { name: 'Outlook Calendar', description: 'Microsoft calendar', icon: Calendar, status: 'available', color: 'blue', rating: 4.6 },
    { name: 'Calendly', description: 'Scheduling tool', icon: Calendar, status: 'available', color: 'blue', rating: 4.7 },
    { name: 'Cal.com', description: 'Open-source scheduling', icon: Calendar, status: 'available', color: 'slate', rating: 4.6 }
  ],
  automation: [
    { name: 'Zapier', description: 'Connect 5000+ apps', icon: Zap, status: 'available', color: 'orange', rating: 4.8 },
    { name: 'Make (Integromat)', description: 'Visual automation', icon: Zap, status: 'available', color: 'purple', rating: 4.7 },
    { name: 'n8n', description: 'Workflow automation', icon: Zap, status: 'available', color: 'pink', rating: 4.6 },
    { name: 'IFTTT', description: 'Simple automations', icon: Zap, status: 'available', color: 'blue', rating: 4.5 }
  ]
};

export default function Integrations() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showConnectorBuilder, setShowConnectorBuilder] = useState(false);
  const [showMarketplace, setShowMarketplace] = useState(false);
  const [newConnector, setNewConnector] = useState({
    name: '', description: '', category: 'custom', auth_type: 'api_key',
    config: { base_url: '', endpoints: [] }
  });

  const { data: customIntegrations = [] } = useQuery({
    queryKey: ['custom-integrations'],
    queryFn: () => base44.entities.CustomIntegration.list('-created_date')
  });

  const { data: marketplaceIntegrations = [] } = useQuery({
    queryKey: ['marketplace-integrations'],
    queryFn: () => base44.entities.CustomIntegration.filter({ is_public: true }, '-install_count', 20)
  });

  const createConnectorMutation = useMutation({
    mutationFn: (data) => base44.entities.CustomIntegration.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-integrations'] });
      setShowConnectorBuilder(false);
      setNewConnector({ name: '', description: '', category: 'custom', auth_type: 'api_key', config: { base_url: '', endpoints: [] } });
      toast.success('Custom connector created!');
    }
  });

  const installIntegrationMutation = useMutation({
    mutationFn: async (integration) => {
      await base44.entities.IntegrationConnection.create({
        integration_id: integration.id,
        integration_name: integration.name
      });
      await base44.entities.CustomIntegration.update(integration.id, {
        install_count: (integration.install_count || 0) + 1
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketplace-integrations'] });
      toast.success('Integration installed!');
    }
  });

  const handleConnect = (integrationName) => {
    toast.success(`Connecting to ${integrationName}...`);
  };

  const handleConfigure = (integrationName) => {
    toast.info(`Opening ${integrationName} settings...`);
  };

  const allIntegrations = [...Object.values(integrations).flat(), ...customIntegrations.map(c => ({
    name: c.name,
    description: c.description,
    icon: Package,
    status: 'available',
    color: 'indigo',
    rating: c.rating || 0,
    custom: true
  }))];

  const filteredIntegrations = selectedCategory === 'all' 
    ? allIntegrations 
    : selectedCategory === 'custom'
    ? customIntegrations.map(c => ({ ...c, icon: Package, status: 'available', color: 'indigo', custom: true }))
    : integrations[selectedCategory] || [];

  const searchFiltered = filteredIntegrations.filter(int =>
    int.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    int.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalCount = allIntegrations.length;

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Integrations Hub</h1>
          <p className="text-gray-500">{totalCount}+ integrations across all categories</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowMarketplace(true)}>
            <Download className="w-4 h-4 mr-2" />
            Marketplace
          </Button>
          <Button onClick={() => setShowConnectorBuilder(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Build Custom
          </Button>
        </div>
      </div>

      <div className="mb-6">
        <Input
          placeholder="Search integrations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md"
          icon={<Search className="w-4 h-4" />}
        />
      </div>

      <Tabs defaultValue="all" onValueChange={setSelectedCategory}>
        <TabsList className="mb-6 flex-wrap h-auto">
          <TabsTrigger value="all">All ({totalCount})</TabsTrigger>
          <TabsTrigger value="ai">AI & LLMs ({integrations.ai.length})</TabsTrigger>
          <TabsTrigger value="crm">CRM ({integrations.crm.length})</TabsTrigger>
          <TabsTrigger value="project_management">Project Mgmt ({integrations.project_management.length})</TabsTrigger>
          <TabsTrigger value="communication">Communication ({integrations.communication.length})</TabsTrigger>
          <TabsTrigger value="ecommerce">E-commerce ({integrations.ecommerce.length})</TabsTrigger>
          <TabsTrigger value="marketing">Marketing ({integrations.marketing.length})</TabsTrigger>
          <TabsTrigger value="hr">HR ({integrations.hr.length})</TabsTrigger>
          <TabsTrigger value="calendar">Calendar ({integrations.calendar.length})</TabsTrigger>
          <TabsTrigger value="development">Development ({integrations.development.length})</TabsTrigger>
          <TabsTrigger value="productivity">Productivity ({integrations.productivity.length})</TabsTrigger>
          <TabsTrigger value="social">Social ({integrations.social.length})</TabsTrigger>
          <TabsTrigger value="payment">Payments ({integrations.payment.length})</TabsTrigger>
          <TabsTrigger value="analytics">Analytics ({integrations.analytics.length})</TabsTrigger>
          <TabsTrigger value="automation">Automation ({integrations.automation.length})</TabsTrigger>
          <TabsTrigger value="custom">Custom ({customIntegrations.length})</TabsTrigger>
        </TabsList>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {searchFiltered.map((integration, idx) => {
            const IntegrationIcon = integration.icon || Package;
            return (
              <Card key={idx} className="hover:shadow-lg transition-all">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <div className={`w-12 h-12 rounded-lg bg-${integration.color}-100 flex items-center justify-center`}>
                      <IntegrationIcon className={`w-6 h-6 text-${integration.color}-600`} />
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {integration.status === 'connected' && (
                        <Badge className="bg-green-600">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Connected
                        </Badge>
                      )}
                      {integration.custom && (
                        <Badge variant="outline">Custom</Badge>
                      )}
                      {integration.rating && (
                        <div className="flex items-center gap-1 text-xs text-gray-600">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          {integration.rating}
                        </div>
                      )}
                    </div>
                  </div>
                  <CardTitle className="text-lg">{integration.name}</CardTitle>
                  <CardDescription>{integration.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  {integration.status === 'connected' ? (
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => handleConfigure(integration.name)}
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Configure
                    </Button>
                  ) : (
                    <Button 
                      className="w-full"
                      onClick={() => handleConnect(integration.name)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Connect
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {searchFiltered.length === 0 && (
          <div className="text-center py-12">
            <Search className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">No integrations found matching your search</p>
          </div>
        )}
      </Tabs>

      {/* Custom Connector Builder */}
      <Dialog open={showConnectorBuilder} onOpenChange={setShowConnectorBuilder}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Build Custom Connector</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Name</label>
                <Input
                  value={newConnector.name}
                  onChange={(e) => setNewConnector({ ...newConnector, name: e.target.value })}
                  placeholder="My Custom API"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Category</label>
                <Select
                  value={newConnector.category}
                  onValueChange={(v) => setNewConnector({ ...newConnector, category: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="crm">CRM</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="analytics">Analytics</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Description</label>
              <Textarea
                value={newConnector.description}
                onChange={(e) => setNewConnector({ ...newConnector, description: e.target.value })}
                placeholder="What does this integration do?"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Base URL</label>
                <Input
                  value={newConnector.config.base_url}
                  onChange={(e) => setNewConnector({
                    ...newConnector,
                    config: { ...newConnector.config, base_url: e.target.value }
                  })}
                  placeholder="https://api.example.com"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Auth Type</label>
                <Select
                  value={newConnector.auth_type}
                  onValueChange={(v) => setNewConnector({ ...newConnector, auth_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="api_key">API Key</SelectItem>
                    <SelectItem value="oauth2">OAuth 2.0</SelectItem>
                    <SelectItem value="basic">Basic Auth</SelectItem>
                    <SelectItem value="bearer">Bearer Token</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={newConnector.is_public}
                onChange={(e) => setNewConnector({ ...newConnector, is_public: e.target.checked })}
                className="rounded"
              />
              <label className="text-sm">Share in marketplace</label>
            </div>

            <Button
              onClick={() => createConnectorMutation.mutate(newConnector)}
              className="w-full"
              disabled={!newConnector.name || !newConnector.config.base_url}
            >
              Create Connector
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Integration Marketplace */}
      <Dialog open={showMarketplace} onOpenChange={setShowMarketplace}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Integration Marketplace</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {marketplaceIntegrations.map((integration) => (
                <Card key={integration.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                          <Package className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{integration.name}</CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex items-center gap-1 text-xs">
                              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                              {integration.rating || 0}
                            </div>
                            <span className="text-xs text-gray-500">
                              {integration.install_count || 0} installs
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <CardDescription className="text-sm">{integration.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => installIntegrationMutation.mutate(integration)}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Install
                      </Button>
                      <Button size="sm" variant="outline">
                        Preview
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            {marketplaceIntegrations.length === 0 && (
              <div className="text-center py-12">
                <Package className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">No integrations in marketplace yet</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}