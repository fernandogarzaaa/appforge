import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bot, Database, Mail, MessageSquare, Zap, Code, 
  Cloud, Share2, CreditCard, BarChart3, FileText,
  Globe, Search, CheckCircle, Plus, Settings
} from 'lucide-react';
import { toast } from 'sonner';

const integrations = {
  ai: [
    { name: 'OpenAI', description: 'GPT-4, DALL-E, Whisper APIs', icon: Bot, status: 'connected', color: 'green' },
    { name: 'Anthropic Claude', description: 'Claude 3 Opus, Sonnet & Haiku', icon: Bot, status: 'available', color: 'purple' },
    { name: 'Google Gemini', description: 'Gemini Pro & Ultra models', icon: Bot, status: 'available', color: 'blue' },
    { name: 'Mistral AI', description: 'Mistral Large & Medium', icon: Bot, status: 'available', color: 'orange' },
    { name: 'Cohere', description: 'Command & Embed models', icon: Bot, status: 'available', color: 'pink' },
    { name: 'Hugging Face', description: 'Access 100K+ AI models', icon: Bot, status: 'available', color: 'yellow' },
    { name: 'Replicate', description: 'Run AI models in cloud', icon: Bot, status: 'available', color: 'indigo' },
    { name: 'Stability AI', description: 'Stable Diffusion image generation', icon: Bot, status: 'available', color: 'violet' }
  ],
  communication: [
    { name: 'Slack', description: 'Team messaging & notifications', icon: MessageSquare, status: 'available', color: 'purple' },
    { name: 'Discord', description: 'Community & bot integration', icon: MessageSquare, status: 'available', color: 'indigo' },
    { name: 'Telegram', description: 'Bot API & messaging', icon: MessageSquare, status: 'available', color: 'blue' },
    { name: 'WhatsApp Business', description: 'Business messaging API', icon: MessageSquare, status: 'available', color: 'green' },
    { name: 'Twilio', description: 'SMS, Voice & WhatsApp', icon: MessageSquare, status: 'available', color: 'red' },
    { name: 'SendGrid', description: 'Email delivery service', icon: Mail, status: 'available', color: 'blue' },
    { name: 'Mailchimp', description: 'Email marketing automation', icon: Mail, status: 'available', color: 'yellow' },
    { name: 'Resend', description: 'Modern email API', icon: Mail, status: 'available', color: 'slate' }
  ],
  development: [
    { name: 'GitHub', description: 'Version control & CI/CD', icon: Code, status: 'available', color: 'slate' },
    { name: 'GitLab', description: 'DevOps platform', icon: Code, status: 'available', color: 'orange' },
    { name: 'Vercel', description: 'Deployment platform', icon: Cloud, status: 'available', color: 'black' },
    { name: 'Netlify', description: 'JAMstack deployments', icon: Cloud, status: 'available', color: 'teal' },
    { name: 'Docker Hub', description: 'Container registry', icon: Cloud, status: 'available', color: 'blue' },
    { name: 'AWS', description: 'S3, Lambda, EC2 & more', icon: Cloud, status: 'available', color: 'orange' },
    { name: 'Google Cloud', description: 'Cloud Platform services', icon: Cloud, status: 'available', color: 'blue' },
    { name: 'Cloudflare', description: 'CDN & security', icon: Globe, status: 'available', color: 'orange' }
  ],
  productivity: [
    { name: 'Notion', description: 'All-in-one workspace', icon: FileText, status: 'available', color: 'slate' },
    { name: 'Airtable', description: 'Database & spreadsheets', icon: Database, status: 'available', color: 'yellow' },
    { name: 'Google Workspace', description: 'Docs, Sheets, Drive', icon: FileText, status: 'available', color: 'blue' },
    { name: 'Microsoft 365', description: 'Office suite integration', icon: FileText, status: 'available', color: 'blue' },
    { name: 'Trello', description: 'Project management boards', icon: BarChart3, status: 'available', color: 'blue' },
    { name: 'Asana', description: 'Work management platform', icon: BarChart3, status: 'available', color: 'pink' },
    { name: 'Monday.com', description: 'Team collaboration tool', icon: BarChart3, status: 'available', color: 'red' },
    { name: 'Linear', description: 'Issue tracking & projects', icon: BarChart3, status: 'available', color: 'purple' }
  ],
  social: [
    { name: 'Twitter/X', description: 'Post tweets & read timeline', icon: Share2, status: 'available', color: 'blue' },
    { name: 'LinkedIn', description: 'Professional networking', icon: Share2, status: 'available', color: 'blue' },
    { name: 'Facebook', description: 'Social media API', icon: Share2, status: 'available', color: 'blue' },
    { name: 'Instagram', description: 'Photo & video sharing', icon: Share2, status: 'available', color: 'pink' },
    { name: 'TikTok', description: 'Short video platform', icon: Share2, status: 'available', color: 'black' },
    { name: 'YouTube', description: 'Video platform API', icon: Share2, status: 'available', color: 'red' },
    { name: 'Reddit', description: 'Community discussions', icon: Share2, status: 'available', color: 'orange' },
    { name: 'Medium', description: 'Publishing platform', icon: Share2, status: 'available', color: 'slate' }
  ],
  payment: [
    { name: 'Stripe', description: 'Online payment processing', icon: CreditCard, status: 'connected', color: 'purple' },
    { name: 'PayPal', description: 'Digital payments', icon: CreditCard, status: 'available', color: 'blue' },
    { name: 'Square', description: 'Payment processing', icon: CreditCard, status: 'available', color: 'slate' },
    { name: 'Braintree', description: 'Payment gateway', icon: CreditCard, status: 'available', color: 'blue' },
    { name: 'Razorpay', description: 'Indian payment gateway', icon: CreditCard, status: 'available', color: 'blue' },
    { name: 'Coinbase', description: 'Cryptocurrency payments', icon: CreditCard, status: 'available', color: 'blue' }
  ],
  analytics: [
    { name: 'Google Analytics', description: 'Web analytics platform', icon: BarChart3, status: 'available', color: 'orange' },
    { name: 'Mixpanel', description: 'Product analytics', icon: BarChart3, status: 'available', color: 'purple' },
    { name: 'Amplitude', description: 'Digital analytics', icon: BarChart3, status: 'available', color: 'blue' },
    { name: 'Segment', description: 'Customer data platform', icon: BarChart3, status: 'available', color: 'green' },
    { name: 'PostHog', description: 'Open-source analytics', icon: BarChart3, status: 'available', color: 'yellow' },
    { name: 'Heap', description: 'Digital insights platform', icon: BarChart3, status: 'available', color: 'purple' }
  ],
  automation: [
    { name: 'Zapier', description: 'Connect 5000+ apps', icon: Zap, status: 'available', color: 'orange' },
    { name: 'Make (Integromat)', description: 'Visual automation', icon: Zap, status: 'available', color: 'purple' },
    { name: 'n8n', description: 'Workflow automation', icon: Zap, status: 'available', color: 'pink' },
    { name: 'IFTTT', description: 'Simple automations', icon: Zap, status: 'available', color: 'blue' }
  ]
};

export default function Integrations() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const handleConnect = (integrationName) => {
    toast.success(`Connecting to ${integrationName}...`);
  };

  const handleConfigure = (integrationName) => {
    toast.info(`Opening ${integrationName} settings...`);
  };

  const allIntegrations = Object.values(integrations).flat();
  const filteredIntegrations = selectedCategory === 'all' 
    ? allIntegrations 
    : integrations[selectedCategory] || [];

  const searchFiltered = filteredIntegrations.filter(int =>
    int.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    int.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Integrations Hub</h1>
        <p className="text-gray-500">Connect your favorite AI models, tools, and services</p>
      </div>

      <div className="mb-6">
        <Input
          placeholder="Search integrations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md"
        />
      </div>

      <Tabs defaultValue="all" onValueChange={setSelectedCategory}>
        <TabsList className="mb-6">
          <TabsTrigger value="all">All ({allIntegrations.length})</TabsTrigger>
          <TabsTrigger value="ai">AI & LLMs ({integrations.ai.length})</TabsTrigger>
          <TabsTrigger value="communication">Communication ({integrations.communication.length})</TabsTrigger>
          <TabsTrigger value="development">Development ({integrations.development.length})</TabsTrigger>
          <TabsTrigger value="productivity">Productivity ({integrations.productivity.length})</TabsTrigger>
          <TabsTrigger value="social">Social Media ({integrations.social.length})</TabsTrigger>
          <TabsTrigger value="payment">Payments ({integrations.payment.length})</TabsTrigger>
          <TabsTrigger value="analytics">Analytics ({integrations.analytics.length})</TabsTrigger>
          <TabsTrigger value="automation">Automation ({integrations.automation.length})</TabsTrigger>
        </TabsList>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {searchFiltered.map((integration, idx) => (
            <Card key={idx} className="hover:shadow-lg transition-all">
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <div className={`w-12 h-12 rounded-lg bg-${integration.color}-100 flex items-center justify-center`}>
                    <integration.icon className={`w-6 h-6 text-${integration.color}-600`} />
                  </div>
                  {integration.status === 'connected' && (
                    <Badge className="bg-green-600">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Connected
                    </Badge>
                  )}
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
          ))}
        </div>

        {searchFiltered.length === 0 && (
          <div className="text-center py-12">
            <Search className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">No integrations found matching your search</p>
          </div>
        )}
      </Tabs>
    </div>
  );
}