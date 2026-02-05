import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, ShoppingCart, FileText, Users, Briefcase, Heart, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function AITemplateGenerator() {
  const navigate = useNavigate();
  const [projectName, setProjectName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [generatedTemplate, setGeneratedTemplate] = useState(null);

  const templates = [
    {
      id: 'ecommerce',
      name: 'E-Commerce Store',
      icon: ShoppingCart,
      description: 'Full-featured online store with products, cart, checkout, and payments',
      color: 'from-green-500 to-emerald-600',
      features: ['Product Catalog', 'Shopping Cart', 'Payment Integration', 'Order Management', 'Inventory Tracking']
    },
    {
      id: 'blog',
      name: 'Blog/CMS',
      icon: FileText,
      description: 'Content management system with posts, categories, and comments',
      color: 'from-blue-500 to-cyan-600',
      features: ['Blog Posts', 'Categories & Tags', 'Comments', 'Rich Text Editor', 'SEO Optimization']
    },
    {
      id: 'social',
      name: 'Social Media',
      icon: Users,
      description: 'Social network with profiles, posts, follows, and messaging',
      color: 'from-purple-500 to-pink-600',
      features: ['User Profiles', 'Posts & Feed', 'Follow System', 'Direct Messages', 'Notifications']
    },
    {
      id: 'saas',
      name: 'SaaS Platform',
      icon: Briefcase,
      description: 'Software-as-a-Service with subscriptions, teams, and billing',
      color: 'from-orange-500 to-red-600',
      features: ['User Subscriptions', 'Team Management', 'Billing', 'Usage Analytics', 'API Access']
    },
    {
      id: 'marketplace',
      name: 'Marketplace',
      icon: Zap,
      description: 'Multi-vendor marketplace with sellers, products, and reviews',
      color: 'from-indigo-500 to-purple-600',
      features: ['Vendor Accounts', 'Product Listings', 'Reviews & Ratings', 'Commission System', 'Analytics']
    },
    {
      id: 'healthcare',
      name: 'Healthcare Portal',
      icon: Heart,
      description: 'Patient management system with appointments and records',
      color: 'from-red-500 to-pink-600',
      features: ['Patient Records', 'Appointments', 'Prescriptions', 'Medical History', 'Billing']
    }
  ];

  const handleGenerate = async () => {
    if (!projectName.trim() || !selectedTemplate) {
      toast.error('Please enter project name and select a template');
      return;
    }

    setGenerating(true);
    try {
      const response = await base44.functions.invoke('generateProjectTemplate', {
        template_type: selectedTemplate.name,
        project_name: projectName
      });

      setGeneratedTemplate(response.data.template);
      toast.success('Project template generated successfully!');
      
      // Navigate to project after a short delay
      setTimeout(() => {
        navigate(`${createPageUrl('PageEditor')}?projectId=${response.data.project_id}`);
      }, 2000);
    } catch (error) {
      console.error('Generation failed:', error);
      toast.error('Failed to generate template: ' + error.message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            AI Project Templates
          </CardTitle>
          <p className="text-sm text-gray-600">
            Generate complete, production-ready projects in seconds
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-2 block">
              Project Name
            </label>
            <Input
              placeholder="e.g., My Awesome Store"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="text-lg"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700 mb-3 block">
              Select Template Type
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((template) => {
                const Icon = template.icon;
                const isSelected = selectedTemplate?.id === template.id;
                return (
                  <div
                    key={template.id}
                    onClick={() => setSelectedTemplate(template)}
                    className={`cursor-pointer rounded-xl border-2 transition-all ${
                      isSelected
                        ? 'border-purple-500 bg-purple-50 shadow-lg scale-105'
                        : 'border-gray-200 hover:border-purple-300 hover:shadow-md'
                    }`}
                  >
                    <div className="p-4">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${template.color} flex items-center justify-center mb-3`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1">{template.name}</h3>
                      <p className="text-xs text-gray-600 mb-3">{template.description}</p>
                      <div className="flex flex-wrap gap-1">
                        {template.features.slice(0, 3).map((feature, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {selectedTemplate && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-2">Included Features:</h4>
              <div className="grid grid-cols-2 gap-2">
                {selectedTemplate.features.map((feature, idx) => (
                  <div key={idx} className="text-sm text-blue-800 flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                    {feature}
                  </div>
                ))}
              </div>
            </div>
          )}

          <Button
            onClick={handleGenerate}
            disabled={generating || !projectName || !selectedTemplate}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600"
            size="lg"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating Your Project...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Project
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {generatedTemplate && (
        <Card>
          <CardHeader>
            <CardTitle>Project Generated Successfully! 🎉</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm text-green-800 mb-2">
                Your project "{generatedTemplate.project_name}" has been created with:
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                <div>✓ {generatedTemplate.entities?.length || 0} Entities</div>
                <div>✓ {generatedTemplate.pages?.length || 0} Pages</div>
                <div>✓ {generatedTemplate.components?.length || 0} Components</div>
                <div>✓ {generatedTemplate.functions?.length || 0} Functions</div>
                <div>✓ {generatedTemplate.ai_agents?.length || 0} AI Agents</div>
                <div>✓ {generatedTemplate.workflows?.length || 0} Workflows</div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Features:</h4>
              <div className="flex flex-wrap gap-2">
                {generatedTemplate.features?.map((feature, idx) => (
                  <Badge key={idx} className="bg-purple-600">{feature}</Badge>
                ))}
              </div>
            </div>

            <p className="text-sm text-gray-600">Redirecting to project editor...</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}