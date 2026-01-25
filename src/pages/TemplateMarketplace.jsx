import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, Star, Download, Eye, TrendingUp, 
  Zap, ShoppingCart, Briefcase, Users, Heart,
  Coins, Gamepad2, Newspaper, Mail, BarChart3, Image as ImageIcon,
  Database, Stethoscope, Building2
} from 'lucide-react';
import { toast } from 'sonner';

const templates = [
  { 
    id: 1, 
    name: 'SaaS Dashboard', 
    category: 'saas', 
    price: 0, 
    downloads: 1240, 
    rating: 4.8,
    preview: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop',
    description: 'Complete SaaS dashboard with authentication, billing, and analytics'
  },
  { 
    id: 19, 
    name: 'Data Analytics Platform', 
    category: 'analytics', 
    price: 0, 
    downloads: 2450, 
    rating: 4.9,
    preview: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop',
    description: 'AI-powered data analysis with statistical tools, trend analysis, and visualizations'
  },
  { 
    id: 20, 
    name: 'Medical AI Suite', 
    category: 'medical', 
    price: 49, 
    downloads: 890, 
    rating: 4.8,
    preview: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400&h=300&fit=crop',
    description: 'Medical AI tools for symptom analysis, report parsing, drug interactions, and clinical support'
  },
  { 
    id: 21, 
    name: 'GovTech Platform', 
    category: 'government', 
    price: 59, 
    downloads: 540, 
    rating: 4.7,
    preview: 'https://images.unsplash.com/photo-1449247666642-264389f5f5b1?w=400&h=300&fit=crop',
    description: 'Government AI tools for policy analysis, compliance, citizen services, and document processing'
  },
  { 
    id: 2, 
    name: 'E-commerce Store', 
    category: 'ecommerce', 
    price: 29, 
    downloads: 890, 
    rating: 4.9,
    preview: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=400&h=300&fit=crop',
    description: 'Full-featured online store with cart, checkout, and inventory management'
  },
  { 
    id: 3, 
    name: 'Portfolio Website', 
    category: 'portfolio', 
    price: 0, 
    downloads: 2340, 
    rating: 4.7,
    preview: 'https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=400&h=300&fit=crop',
    description: 'Stunning portfolio template for creatives and developers'
  },
  { 
    id: 4, 
    name: 'CRM Platform', 
    category: 'business', 
    price: 49, 
    downloads: 560, 
    rating: 4.9,
    preview: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop',
    description: 'Enterprise CRM with lead management, pipelines, and reporting'
  },
  { 
    id: 5, 
    name: 'Social Network', 
    category: 'social', 
    price: 39, 
    downloads: 720, 
    rating: 4.6,
    preview: 'https://images.unsplash.com/photo-1432888622747-4eb9a8f2c293?w=400&h=300&fit=crop',
    description: 'Social media platform with posts, profiles, and messaging'
  },
  { 
    id: 6, 
    name: 'Landing Page Pro', 
    category: 'marketing', 
    price: 19, 
    downloads: 1560, 
    rating: 4.8,
    preview: 'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=400&h=300&fit=crop',
    description: 'High-converting landing page with lead capture forms'
  },
  { 
    id: 7, 
    name: 'NFT Marketplace', 
    category: 'web3', 
    price: 59, 
    downloads: 1120, 
    rating: 4.9,
    preview: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&h=300&fit=crop',
    description: 'Full NFT marketplace with minting, trading, and wallet integration'
  },
  { 
    id: 8, 
    name: 'Crypto Exchange', 
    category: 'web3', 
    price: 79, 
    downloads: 840, 
    rating: 4.8,
    preview: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=300&fit=crop',
    description: 'Professional trading platform with order books and real-time charts'
  },
  { 
    id: 9, 
    name: 'Gaming Platform', 
    category: 'gaming', 
    price: 49, 
    downloads: 1560, 
    rating: 4.7,
    preview: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&h=300&fit=crop',
    description: 'Play-to-earn gaming platform with leaderboards and token rewards'
  },
  { 
    id: 10, 
    name: 'Blog & Magazine', 
    category: 'content', 
    price: 0, 
    downloads: 3200, 
    rating: 4.6,
    preview: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=400&h=300&fit=crop',
    description: 'Modern blog with categories, comments, and newsletter subscription'
  },
  { 
    id: 11, 
    name: 'Email Marketing Hub', 
    category: 'marketing', 
    price: 39, 
    downloads: 920, 
    rating: 4.8,
    preview: 'https://images.unsplash.com/photo-1557200134-90327ee9fafa?w=400&h=300&fit=crop',
    description: 'Complete email campaign manager with templates and analytics'
  },
  { 
    id: 12, 
    name: 'Analytics Dashboard', 
    category: 'business', 
    price: 29, 
    downloads: 1340, 
    rating: 4.7,
    preview: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop',
    description: 'Business intelligence dashboard with charts and real-time metrics'
  },
  { 
    id: 13, 
    name: 'Crypto Casino', 
    category: 'gaming', 
    price: 69, 
    downloads: 680, 
    rating: 4.5,
    preview: 'https://images.unsplash.com/photo-1596838132731-3301c3fd4317?w=400&h=300&fit=crop',
    description: 'Provably fair casino with dice, slots, and crypto payments'
  },
  { 
    id: 14, 
    name: 'AI Content Studio', 
    category: 'content', 
    price: 0, 
    downloads: 2100, 
    rating: 4.9,
    preview: 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=400&h=300&fit=crop',
    description: 'AI-powered content generator for blogs, social media, and marketing'
  },
  { 
    id: 15, 
    name: 'Token Launchpad', 
    category: 'web3', 
    price: 49, 
    downloads: 760, 
    rating: 4.6,
    preview: 'https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=400&h=300&fit=crop',
    description: 'Create and launch crypto tokens with built-in tokenomics tools'
  },
  { 
    id: 16, 
    name: 'Social Media Manager', 
    category: 'marketing', 
    price: 39, 
    downloads: 1420, 
    rating: 4.8,
    preview: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&h=300&fit=crop',
    description: 'Schedule posts, manage campaigns, and track analytics across platforms'
  },
  { 
    id: 17, 
    name: 'Job Board Platform', 
    category: 'business', 
    price: 0, 
    downloads: 1890, 
    rating: 4.5,
    preview: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=400&h=300&fit=crop',
    description: 'Complete job listing platform with applications and employer dashboard'
  },
  { 
    id: 18, 
    name: 'DAO Governance', 
    category: 'web3', 
    price: 59, 
    downloads: 540, 
    rating: 4.7,
    preview: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=400&h=300&fit=crop',
    description: 'Decentralized organization platform with voting and treasury management'
  }
];

const categories = [
  { id: 'all', name: 'All Templates', icon: Zap },
  { id: 'analytics', name: 'Data Analytics', icon: Database },
  { id: 'medical', name: 'Medical AI', icon: Stethoscope },
  { id: 'government', name: 'Government', icon: Building2 },
  { id: 'saas', name: 'SaaS', icon: TrendingUp },
  { id: 'ecommerce', name: 'E-commerce', icon: ShoppingCart },
  { id: 'business', name: 'Business', icon: Briefcase },
  { id: 'web3', name: 'Web3', icon: Coins },
  { id: 'gaming', name: 'Gaming', icon: Gamepad2 },
  { id: 'content', name: 'Content', icon: Newspaper },
  { id: 'marketing', name: 'Marketing', icon: Mail },
  { id: 'social', name: 'Social', icon: Users },
  { id: 'portfolio', name: 'Portfolio', icon: Heart }
];

export default function TemplateMarketplace() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredTemplates = templates.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         t.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || t.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleInstall = (template) => {
    toast.success(`${template.name} installed successfully!`);
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">Template Marketplace</h1>
        <p className="text-gray-500">Browse and install ready-made templates for your projects</p>
      </div>

      {/* Search & Filter */}
      <div className="mb-6 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search templates..."
            className="pl-10"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map(cat => (
            <Button
              key={cat.id}
              variant={selectedCategory === cat.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(cat.id)}
              className="whitespace-nowrap"
            >
              <cat.icon className="w-4 h-4 mr-2" />
              {cat.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map(template => (
          <Card key={template.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className="aspect-video bg-gray-100 overflow-hidden">
              <img 
                src={template.preview} 
                alt={template.name}
                className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
              />
            </div>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs capitalize">{template.category}</Badge>
                    {template.price === 0 && (
                      <Badge className="bg-green-100 text-green-700 text-xs">Free</Badge>
                    )}
                  </div>
                </div>
                {template.price > 0 && (
                  <div className="text-right">
                    <div className="text-xl font-bold">${template.price}</div>
                  </div>
                )}
              </div>
              <CardDescription className="mt-2">{template.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span>{template.rating}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Download className="w-4 h-4" />
                  <span>{template.downloads.toLocaleString()}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">
                  <Eye className="w-3 h-3 mr-1" />
                  Preview
                </Button>
                <Button size="sm" onClick={() => handleInstall(template)} className="flex-1">
                  <Download className="w-3 h-3 mr-1" />
                  Install
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <Search className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No templates found</h3>
          <p className="text-gray-500">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  );
}