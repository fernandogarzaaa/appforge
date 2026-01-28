import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Download, Star, Zap, Plus, DollarSign, Eye } from 'lucide-react';
import { toast } from 'sonner';
import CreateTemplateModal from '@/components/templates/CreateTemplateModal';
import TemplateReviews from '@/components/templates/TemplateReviews';

export default function TemplateMarketplace() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewMode, setViewMode] = useState('marketplace'); // 'marketplace' or 'myTemplates'
  const queryClient = useQueryClient();

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['botTemplates', viewMode],
    queryFn: async () => {
      if (viewMode === 'myTemplates') {
        const user = await base44.auth.me();
        return await base44.entities.BotTemplate.filter({ author_email: user.email }, '-created_date');
      }
      return await base44.entities.BotTemplate.filter({ is_published: true }, '-downloads_count');
    }
  });

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me()
  });

  const downloadMutation = useMutation({
    mutationFn: async (templateId) => {
      const template = await base44.entities.BotTemplate.get(templateId);
      
      // Check if premium and handle payment
      if (template.is_premium && template.price > 0) {
        const purchases = await base44.entities.TemplatePurchase.filter({
          template_id: templateId,
          buyer_email: user?.email
        });
        
        if (purchases.length === 0) {
          toast.error('Please purchase this template first');
          return null;
        }
      }

      // Record download
      await base44.entities.BotTemplate.update(templateId, {
        downloads_count: (template.downloads_count || 0) + 1
      });

      // Create purchase record for free templates
      if (!template.is_premium || template.price === 0) {
        await base44.entities.TemplatePurchase.create({
          template_id: templateId,
          buyer_email: user?.email,
          price_paid: 0,
          payment_method: 'free',
          status: 'completed',
          author_revenue: 0,
          platform_fee: 0
        });
      }

      return template;
    },
    onSuccess: (template) => {
      if (template) {
        queryClient.invalidateQueries(['botTemplates']);
        toast.success('Template downloaded successfully!');
      }
    }
  });

  const purchaseMutation = useMutation({
    mutationFn: async ({ templateId, price }) => {
      const response = await base44.functions.invoke('purchaseTemplate', {
        template_id: templateId,
        price
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['botTemplates']);
      toast.success('Purchase successful! You can now download the template.');
    }
  });

  const filteredTemplates = templates.filter(t => {
    const matchesSearch = t.name?.toLowerCase().includes(search.toLowerCase()) ||
                         t.description?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === 'all' || t.category === category;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Template Marketplace</h1>
          <p className="text-gray-500">Discover, create, and monetize automation templates</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setViewMode(viewMode === 'marketplace' ? 'myTemplates' : 'marketplace')}>
            {viewMode === 'marketplace' ? 'My Templates' : 'Marketplace'}
          </Button>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Template
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{templates.length}</div>
            <div className="text-sm text-gray-500">{viewMode === 'marketplace' ? 'Available Templates' : 'My Templates'}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {templates.filter(t => t.is_premium).length}
            </div>
            <div className="text-sm text-gray-500">Premium Templates</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {templates.reduce((sum, t) => sum + (t.downloads_count || 0), 0)}
            </div>
            <div className="text-sm text-gray-500">Total Downloads</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {viewMode === 'myTemplates' 
                ? `$${templates.reduce((sum, t) => sum + (t.total_revenue || 0), 0).toFixed(2)}`
                : templates.filter(t => t.is_featured).length
              }
            </div>
            <div className="text-sm text-gray-500">
              {viewMode === 'myTemplates' ? 'Total Revenue' : 'Featured'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search templates..."
            className="pl-10"
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="ai_automation">AI Automation</SelectItem>
            <SelectItem value="data_visualization">Data Visualization</SelectItem>
            <SelectItem value="finance_automation">Finance Automation</SelectItem>
            <SelectItem value="customer_service">Customer Service</SelectItem>
            <SelectItem value="marketing">Marketing</SelectItem>
            <SelectItem value="analytics">Analytics</SelectItem>
            <SelectItem value="sales_automation">Sales Automation</SelectItem>
            <SelectItem value="hr_automation">HR Automation</SelectItem>
            <SelectItem value="ecommerce">E-commerce</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map(template => (
          <Card key={template.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setSelectedTemplate(template)}>
            <CardHeader>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <Badge variant="outline" className="capitalize text-xs">{template.category.replace('_', ' ')}</Badge>
                    {template.is_premium && (
                      <Badge className="bg-yellow-500 text-xs">
                        <DollarSign className="w-3 h-3 mr-1" />
                        ${template.price}
                      </Badge>
                    )}
                    {template.is_featured && <Badge className="bg-purple-500 text-xs">Featured</Badge>}
                  </div>
                  {viewMode === 'myTemplates' && (
                    <Badge variant={template.is_published ? 'default' : 'secondary'} className="mt-2 text-xs">
                      {template.is_published ? 'Published' : 'Draft'}
                    </Badge>
                  )}
                </div>
              </div>
              <CardDescription className="line-clamp-2">{template.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  {template.rating?.toFixed(1) || '0.0'} ({template.review_count || 0})
                </span>
                <span className="flex items-center gap-1">
                  <Download className="w-4 h-4" />
                  {template.downloads_count || 0}
                </span>
              </div>
              {viewMode === 'myTemplates' && template.is_premium && (
                <div className="text-sm text-gray-600 mb-2">
                  Revenue: ${(template.total_revenue || 0).toFixed(2)}
                </div>
              )}
              <Button 
                className="w-full" 
                onClick={(e) => {
                  e.stopPropagation();
                  if (viewMode === 'marketplace') {
                    downloadMutation.mutate(template.id);
                  } else {
                    setSelectedTemplate(template);
                  }
                }}
                disabled={downloadMutation.isPending}
              >
                {viewMode === 'marketplace' ? (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    {template.is_premium && template.price > 0 ? `Buy $${template.price}` : 'Use Template'}
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4 mr-2" />
                    View Details
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <Card className="text-center py-12">
          <Search className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-semibold mb-2">No Templates Found</h3>
          <p className="text-gray-500">Try adjusting your search or create your own!</p>
        </Card>
      )}

      {/* Template Details Modal */}
      {selectedTemplate && (
        <Dialog open={true} onOpenChange={() => setSelectedTemplate(null)}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl">{selectedTemplate.name}</DialogTitle>
            </DialogHeader>
            
            <Tabs defaultValue="overview">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="workflow">Workflow</TabsTrigger>
                <TabsTrigger value="reviews">Reviews ({selectedTemplate.review_count || 0})</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline">{selectedTemplate.category.replace('_', ' ')}</Badge>
                  <Badge variant="secondary">{selectedTemplate.difficulty_level}</Badge>
                  {selectedTemplate.is_premium && (
                    <Badge className="bg-yellow-500">Premium - ${selectedTemplate.price}</Badge>
                  )}
                  <span className="text-sm text-gray-500">
                    ~{selectedTemplate.estimated_setup_time} min setup
                  </span>
                </div>

                <p className="text-gray-700">{selectedTemplate.description}</p>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Rating</h4>
                    <div className="flex items-center gap-2">
                      <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                      <span className="text-lg font-semibold">{selectedTemplate.rating?.toFixed(1) || '0.0'}</span>
                      <span className="text-sm text-gray-500">({selectedTemplate.review_count || 0} reviews)</span>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Downloads</h4>
                    <div className="flex items-center gap-2">
                      <Download className="w-5 h-5" />
                      <span className="text-lg font-semibold">{selectedTemplate.downloads_count || 0}</span>
                    </div>
                  </div>
                </div>

                {selectedTemplate.tags && selectedTemplate.tags.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedTemplate.tags.map((tag, i) => (
                        <Badge key={i} variant="outline">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="font-semibold mb-2">Author</h4>
                  <p className="text-gray-700">{selectedTemplate.author_name || 'Anonymous'}</p>
                </div>

                <Button 
                  className="w-full"
                  onClick={() => {
                    if (selectedTemplate.is_premium && selectedTemplate.price > 0) {
                      purchaseMutation.mutate({ 
                        templateId: selectedTemplate.id, 
                        price: selectedTemplate.price 
                      });
                    } else {
                      downloadMutation.mutate(selectedTemplate.id);
                    }
                  }}
                >
                  {selectedTemplate.is_premium && selectedTemplate.price > 0 ? (
                    <>
                      <DollarSign className="w-4 h-4 mr-2" />
                      Purchase for ${selectedTemplate.price}
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Download Free
                    </>
                  )}
                </Button>
              </TabsContent>

              <TabsContent value="workflow">
                <div className="space-y-3">
                  <h4 className="font-semibold">Workflow Steps</h4>
                  {selectedTemplate.workflow_steps?.map((step, i) => (
                    <Card key={i}>
                      <CardContent className="pt-4">
                        <div className="flex items-start gap-3">
                          <div className="bg-blue-100 text-blue-800 rounded-full w-8 h-8 flex items-center justify-center font-semibold flex-shrink-0">
                            {i + 1}
                          </div>
                          <div className="flex-1">
                            <h5 className="font-semibold">{step.name}</h5>
                            <p className="text-sm text-gray-600 mt-1">{step.description}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="reviews">
                <TemplateReviews templateId={selectedTemplate.id} />
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}

      {/* Create Template Modal */}
      <CreateTemplateModal open={showCreateModal} onClose={() => setShowCreateModal(false)} />
    </div>
  );
}