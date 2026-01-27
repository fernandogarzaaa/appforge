import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Zap, Star } from 'lucide-react';
import { toast } from 'sonner';

const sampleTemplates = [
  {
    name: 'Zapier CRM Sync',
    platform: 'zapier',
    category: 'crm',
    description: 'Automatically sync contacts from Zapier to your CRM',
    icon: '👥',
    is_featured: true,
    setup_instructions: '1. Connect Zapier\n2. Map contact fields\n3. Enable sync'
  },
  {
    name: 'Make.com E-commerce Orders',
    platform: 'make',
    category: 'ecommerce',
    description: 'Process new orders from your e-commerce platform',
    icon: '🛒',
    is_featured: true
  },
  {
    name: 'Email Campaign Webhook',
    platform: 'custom_api',
    category: 'marketing',
    description: 'Receive campaign events and track engagement',
    icon: '📧',
    is_featured: false
  },
  {
    name: 'Analytics Data Push',
    platform: 'n8n',
    category: 'analytics',
    description: 'Push analytics data to external dashboards',
    icon: '📊',
    is_featured: true
  },
  {
    name: 'Slack Notifications',
    platform: 'zapier',
    category: 'communication',
    description: 'Send automated notifications to Slack channels',
    icon: '💬',
    is_featured: false
  },
  {
    name: 'Task Management Sync',
    platform: 'make',
    category: 'productivity',
    description: 'Sync tasks between platforms automatically',
    icon: '✅',
    is_featured: false
  }
];

export default function IntegrationTemplates() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const queryClient = useQueryClient();

  const { data: templates = [] } = useQuery({
    queryKey: ['integrationTemplates'],
    queryFn: () => base44.entities.IntegrationTemplate.list(),
    initialData: []
  });

  const useTemplateMutation = useMutation({
    mutationFn: async (template) => {
      const response = await base44.functions.invoke('useIntegrationTemplate', {
        template_id: template.id
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Integration created from template');
      queryClient.invalidateQueries(['externalBotIntegrations']);
    }
  });

  const allTemplates = [...templates, ...sampleTemplates];
  
  const filteredTemplates = allTemplates.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase()) ||
                         t.description?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || t.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['all', 'crm', 'marketing', 'ecommerce', 'analytics', 'communication', 'productivity'];

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">Integration Templates</h1>
        <p className="text-gray-500">Quick-start templates for common integrations</p>
      </div>

      {/* Search & Filter */}
      <div className="mb-6 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search templates..."
            className="pl-10"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map(cat => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(cat)}
              className="whitespace-nowrap capitalize"
            >
              {cat}
            </Button>
          ))}
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template, idx) => (
          <Card key={template.id || idx} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between mb-2">
                <div className="text-3xl">{template.icon}</div>
                {template.is_featured && (
                  <Badge className="bg-yellow-100 text-yellow-800">
                    <Star className="w-3 h-3 mr-1" />
                    Featured
                  </Badge>
                )}
              </div>
              <CardTitle className="text-lg">{template.name}</CardTitle>
              <div className="flex gap-2 mt-2">
                <Badge variant="outline" className="capitalize">{template.platform}</Badge>
                <Badge variant="secondary" className="capitalize">{template.category}</Badge>
              </div>
              <CardDescription className="mt-2">{template.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full"
                onClick={() => template.id ? useTemplateMutation.mutate(template) : toast.info('Template preview')}
              >
                <Zap className="w-4 h-4 mr-2" />
                Use Template
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <Card className="text-center py-12">
          <Search className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-semibold mb-2">No Templates Found</h3>
          <p className="text-gray-500">Try adjusting your search or filters</p>
        </Card>
      )}
    </div>
  );
}