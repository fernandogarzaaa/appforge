import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ExternalLink, Code, Eye, Database, FileCode, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function ProjectViewer() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('preview');

  const { data: project, isLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: () => base44.entities.Project.get(id),
  });

  const { data: entities = [] } = useQuery({
    queryKey: ['entities', id],
    queryFn: () => base44.entities.Entity.filter({ project_id: id }),
    enabled: !!id,
  });

  const { data: pages = [] } = useQuery({
    queryKey: ['pages', id],
    queryFn: () => base44.entities.Page.filter({ project_id: id }),
    enabled: !!id,
  });

  // Generate custom content based on project description
  const generateCustomContent = () => {
    if (!project) return null;
    
    const desc = project.description.toLowerCase();
    const name = project.name;
    
    // Smart business name extraction
    const extractBusinessName = () => {
      // Remove filler words and extract core name
      const fillerWords = [
        'create', 'build', 'make', 'develop', 'design', 'generate',
        'landing page', 'website', 'web app', 'app', 'page', 'site',
        'for me', 'for', 'a', 'an', 'the'
      ];
      
      let cleaned = name;
      fillerWords.forEach(word => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        cleaned = cleaned.replace(regex, '');
      });
      
      cleaned = cleaned.replace(/\s+/g, ' ').trim();
      
      // Capitalize properly
      if (cleaned.length > 2) {
        return cleaned.split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');
      }
      
      return null;
    };
    
    const businessName = extractBusinessName();
    
    // Intelligent keyword detection with scoring
    const detectIntent = () => {
      const keywords = {
        cafe: ['cafe', 'coffee', 'restaurant', 'bistro', 'diner', 'eatery'],
        shop: ['shop', 'store', 'ecommerce', 'marketplace', 'retail'],
        product: ['product', 'catalog', 'inventory'],
        portfolio: ['portfolio', 'showcase', 'gallery', 'work'],
        blog: ['blog', 'article', 'news', 'journal', 'magazine'],
        event: ['event', 'booking', 'reservation', 'ticket'],
        service: ['service', 'booking', 'appointment', 'consultation'],
        real_estate: ['real estate', 'property', 'rental', 'listing'],
        education: ['course', 'learning', 'education', 'training', 'tutorial']
      };
      
      const scores = {};
      Object.entries(keywords).forEach(([category, words]) => {
        scores[category] = words.filter(word => desc.includes(word)).length;
      });
      
      const maxScore = Math.max(...Object.values(scores));
      const detected = Object.entries(scores).find(([_, score]) => score === maxScore && score > 0);
      
      return detected ? detected[0] : 'generic';
    };
    
    const intent = detectIntent();
    
    const templates = {
      cafe: {
        hero: businessName ? `Welcome to ${businessName}` : 'Your Perfect Coffee Spot',
        subtitle: 'Experience exceptional coffee in a warm, welcoming atmosphere',
        cta: 'View Menu',
        features: [
          { icon: '☕', title: 'Artisan Coffee', desc: 'Premium beans roasted to perfection, crafted by expert baristas' },
          { icon: '🍰', title: 'Fresh Baked Goods', desc: 'Delicious pastries and treats made fresh daily' },
          { icon: '✨', title: 'Inviting Space', desc: 'Cozy atmosphere perfect for work, meetings, or relaxation' }
        ]
      },
      shop: {
        hero: businessName || 'Shop Premium Products',
        subtitle: 'Discover curated collections of exceptional quality',
        cta: 'Start Shopping',
        features: [
          { icon: '⭐', title: 'Premium Quality', desc: 'Hand-selected products that exceed expectations' },
          { icon: '🚀', title: 'Fast Delivery', desc: 'Quick shipping with real-time tracking' },
          { icon: '🔒', title: 'Secure Shopping', desc: 'Safe checkout with buyer protection' }
        ]
      },
      product: {
        hero: businessName || 'Premium Products',
        subtitle: 'Quality items delivered to your door',
        cta: 'Browse Catalog',
        features: [
          { icon: '🎯', title: 'Best Selection', desc: 'Carefully curated products for every need' },
          { icon: '💎', title: 'Top Quality', desc: 'Only the finest materials and craftsmanship' },
          { icon: '📦', title: 'Easy Returns', desc: 'Hassle-free returns within 30 days' }
        ]
      },
      portfolio: {
        hero: businessName || 'Creative Portfolio',
        subtitle: 'Bringing ideas to life through design and innovation',
        cta: 'View Work',
        features: [
          { icon: '🎨', title: 'Award-Winning Design', desc: 'Recognized for creative excellence and innovation' },
          { icon: '💼', title: 'Client Success', desc: 'Proven track record of delivering exceptional results' },
          { icon: '🚀', title: 'Modern Approach', desc: 'Cutting-edge techniques and latest technologies' }
        ]
      },
      blog: {
        hero: businessName || 'Insights & Stories',
        subtitle: 'Expert perspectives on what matters most',
        cta: 'Read Latest',
        features: [
          { icon: '✍️', title: 'Expert Authors', desc: 'Written by industry leaders and specialists' },
          { icon: '📚', title: 'In-Depth Analysis', desc: 'Comprehensive coverage of trending topics' },
          { icon: '🔔', title: 'Weekly Updates', desc: 'Fresh content delivered every week' }
        ]
      },
      event: {
        hero: businessName || 'Unforgettable Events',
        subtitle: 'Creating memorable experiences that inspire',
        cta: 'Book Now',
        features: [
          { icon: '🎉', title: 'Expert Planning', desc: 'Professional team handles every detail' },
          { icon: '📅', title: 'Easy Booking', desc: 'Simple online reservation system' },
          { icon: '⭐', title: 'Top Venues', desc: 'Premium locations for any occasion' }
        ]
      },
      service: {
        hero: businessName || 'Professional Services',
        subtitle: 'Expert solutions tailored to your needs',
        cta: 'Get Started',
        features: [
          { icon: '🎯', title: 'Expert Team', desc: 'Experienced professionals dedicated to your success' },
          { icon: '⚡', title: 'Fast Turnaround', desc: 'Quick and efficient service delivery' },
          { icon: '💯', title: 'Satisfaction Guaranteed', desc: 'We stand behind our work' }
        ]
      },
      real_estate: {
        hero: businessName || 'Find Your Dream Home',
        subtitle: 'Discover the perfect property in your ideal location',
        cta: 'Browse Listings',
        features: [
          { icon: '🏡', title: 'Premium Properties', desc: 'Exclusive listings in prime locations' },
          { icon: '🔍', title: 'Smart Search', desc: 'Find exactly what you\'re looking for' },
          { icon: '🤝', title: 'Expert Agents', desc: 'Professional guidance every step' }
        ]
      },
      education: {
        hero: businessName || 'Learn & Grow',
        subtitle: 'Master new skills with expert-led courses',
        cta: 'Browse Courses',
        features: [
          { icon: '🎓', title: 'Expert Instructors', desc: 'Learn from industry professionals' },
          { icon: '📱', title: 'Learn Anywhere', desc: 'Access courses on any device' },
          { icon: '🏆', title: 'Certificates', desc: 'Earn recognized credentials' }
        ]
      }
    };
    
    if (templates[intent]) {
      return templates[intent];
    }
    
    // Default/generic - use cleaned name if available
    return {
      hero: businessName || name,
      subtitle: project.description,
      cta: 'Get Started',
      features: [
        { icon: '✨', title: 'Fast & Easy', desc: 'Built with cutting-edge technology for the best performance' },
        { icon: '💪', title: 'Powerful', desc: 'Everything you need to manage your data effectively' },
        { icon: '🚀', title: 'Ready to Deploy', desc: 'Launch your website to the world in seconds' }
      ]
    };
  };

  const customContent = generateCustomContent();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Project Not Found</h2>
          <p className="text-gray-600">The project you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-4xl">{project.icon || '✨'}</div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
                <p className="text-sm text-gray-600">{project.description}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="gap-2">
                <Code className="w-4 h-4" />
                View Code
              </Button>
              <Button className="gap-2 bg-gradient-to-r from-indigo-600 to-purple-600">
                <Globe className="w-4 h-4" />
                Deploy Live
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="preview" className="gap-2">
              <Eye className="w-4 h-4" />
              Live Preview
            </TabsTrigger>
            <TabsTrigger value="database" className="gap-2">
              <Database className="w-4 h-4" />
              Database ({entities.length})
            </TabsTrigger>
            <TabsTrigger value="pages" className="gap-2">
              <FileCode className="w-4 h-4" />
              Pages ({pages.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="preview">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              {/* Browser mockup */}
              <div className="bg-gray-100 px-4 py-3 border-b border-gray-200 flex items-center gap-2">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                </div>
                <div className="flex-1 mx-4">
                  <div className="bg-white px-3 py-1 rounded text-sm text-gray-600 flex items-center gap-2">
                    <Globe className="w-3 h-3" />
                    {project.name.toLowerCase().replace(/\s+/g, '-')}.appforge.fun
                  </div>
                </div>
              </div>

              {/* Website Preview */}
              <div className="p-8 min-h-[600px] bg-gradient-to-br from-white to-gray-50">
                <div className="text-center mb-12">
                  <h1 className="text-4xl font-bold text-gray-900 mb-4">
                    {customContent?.hero || project.name}
                  </h1>
                  <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                    {customContent?.subtitle || project.description}
                  </p>
                  <div className="mt-8">
                    <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-3 rounded-lg text-lg">
                      {customContent?.cta || 'Get Started'}
                    </Button>
                  </div>
                </div>

                {/* Show entities if they exist */}
                {entities.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                    {entities.map((entity) => (
                      <div key={entity.id} className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                        <Database className="w-8 h-8 text-indigo-600 mb-3" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{entity.name}</h3>
                        <p className="text-sm text-gray-600">
                          {Object.keys(entity.schema || {}).length} fields configured
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Show custom generated content */}
                {entities.length === 0 && customContent && (
                  <div className="max-w-4xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                      {customContent.features.map((feature, idx) => (
                        <div key={idx} className="bg-white rounded-lg shadow-md p-6 border border-indigo-200 hover:border-indigo-400 transition-colors">
                          <div className="text-4xl mb-4">{feature.icon}</div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                          <p className="text-sm text-gray-600">{feature.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="database">
            <div className="space-y-4">
              {entities.map((entity, idx) => (
                <div key={entity.id || idx} className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
                  {/* Entity Header */}
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Database className="w-5 h-5 text-indigo-600" />
                        <div>
                          <h3 className="font-semibold text-gray-900">{entity.name}</h3>
                          <p className="text-sm text-gray-600">
                            {Object.keys(entity.schema || {}).length} fields
                            {entity.metadata?.indexes?.length > 0 && ` • ${entity.metadata.indexes.length} indexes`}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {entity.metadata?.relationships?.length > 0 && (
                          <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                            {entity.metadata.relationships.length} relations
                          </span>
                        )}
                        {entity.metadata?.api_endpoints && Object.keys(entity.metadata.api_endpoints).length > 0 && (
                          <span className="px-3 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                            {Object.keys(entity.metadata.api_endpoints).length} APIs
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Schema Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 bg-gray-50">
                          <th className="text-left px-6 py-3 font-semibold text-gray-700">Field</th>
                          <th className="text-left px-6 py-3 font-semibold text-gray-700">Type</th>
                          <th className="text-left px-6 py-3 font-semibold text-gray-700">Constraints</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(entity.schema || {}).map(([field, config], fieldIdx) => (
                          <tr key={fieldIdx} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                            <td className="px-6 py-3">
                              <code className="font-mono text-indigo-600 font-medium">{field}</code>
                            </td>
                            <td className="px-6 py-3">
                              <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-mono">
                                {config.type === 'reference' ? `→ ${config.entity}` : config.type}
                              </span>
                            </td>
                            <td className="px-6 py-3">
                              <div className="flex flex-wrap gap-1">
                                {config.required && (
                                  <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded">required</span>
                                )}
                                {config.unique && (
                                  <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded">unique</span>
                                )}
                                {config.minLength && (
                                  <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">min: {config.minLength}</span>
                                )}
                                {config.maxLength && (
                                  <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">max: {config.maxLength}</span>
                                )}
                                {config.min !== undefined && (
                                  <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-700 rounded">≥{config.min}</span>
                                )}
                                {config.pattern && (
                                  <span className="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded">regex</span>
                                )}
                                {config.enum && (
                                  <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded">enum[{config.enum.length}]</span>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Indexes */}
                  {entity.metadata?.indexes?.length > 0 && (
                    <div className="px-6 py-4 bg-blue-50 border-t border-blue-100">
                      <p className="text-sm font-semibold text-blue-900 mb-2">Database Indexes</p>
                      <div className="flex flex-wrap gap-2">
                        {entity.metadata.indexes.map((idx, i) => (
                          <code key={i} className="px-3 py-1 bg-white border border-blue-200 rounded text-xs text-blue-700 font-mono">
                            {idx}
                          </code>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Relationships */}
                  {entity.metadata?.relationships?.length > 0 && (
                    <div className="px-6 py-4 bg-purple-50 border-t border-purple-100">
                      <p className="text-sm font-semibold text-purple-900 mb-2">Relationships</p>
                      <div className="space-y-2">
                        {entity.metadata.relationships.map((rel, i) => (
                          <div key={i} className="text-sm text-purple-800 flex items-center gap-2">
                            <span className="font-mono">→</span>
                            <span><strong>{rel.type}</strong> {entity.name} {rel.type === 'belongsTo' ? '→' : '←'} {rel.entity}</span>
                            {rel.foreignKey && <code className="text-xs bg-white px-2 py-0.5 rounded">{rel.foreignKey}</code>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* API Endpoints */}
                  {entity.metadata?.api_endpoints && Object.keys(entity.metadata.api_endpoints).length > 0 && (
                    <div className="px-6 py-4 bg-green-50 border-t border-green-100">
                      <p className="text-sm font-semibold text-green-900 mb-3">API Endpoints</p>
                      <div className="space-y-2">
                        {Object.entries(entity.metadata.api_endpoints).map(([_name, config], i) => (
                          <div key={i} className="flex items-center gap-3 p-2 bg-white rounded border border-green-100">
                            <span className={`px-2 py-1 text-xs font-mono rounded font-semibold ${
                              config.method === 'GET' ? 'bg-green-100 text-green-700' :
                              config.method === 'POST' ? 'bg-blue-100 text-blue-700' :
                              config.method === 'PUT' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {config.method}
                            </span>
                            <code className="text-sm font-mono flex-1">{config.path}</code>
                            {config.auth && (
                              <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded font-medium">
                                🔒 {config.role || 'auth'}
                              </span>
                            )}
                            {config.cache && (
                              <span className="text-xs text-gray-500">⚡ {config.cache}s</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {entities.length === 0 && (
                <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                  <Database className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No database entities yet</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="pages">
            <div className="space-y-4">
              {pages.map((page) => (
                <div key={page.id} className="bg-white rounded-lg shadow border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{page.name}</h3>
                      <p className="text-sm text-gray-500">{page.path}</p>
                    </div>
                    <Button variant="outline" size="sm" className="gap-2">
                      <ExternalLink className="w-4 h-4" />
                      Open
                    </Button>
                  </div>
                </div>
              ))}
              {pages.length === 0 && (
                <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                  <FileCode className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No pages created yet</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
