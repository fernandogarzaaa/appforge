import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Search, Globe, Zap, Check, Plus, ExternalLink, 
  Loader2, Code, Copy, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const API_CATEGORIES = [
  { id: 'weather', name: 'Weather', icon: '🌤️' },
  { id: 'finance', name: 'Finance', icon: '💰' },
  { id: 'news', name: 'News', icon: '📰' },
  { id: 'maps', name: 'Maps & Location', icon: '🗺️' },
  { id: 'social', name: 'Social Media', icon: '📱' },
  { id: 'ai', name: 'AI & ML', icon: '🤖' },
  { id: 'crypto', name: 'Cryptocurrency', icon: '₿' },
  { id: 'sports', name: 'Sports', icon: '⚽' },
];

export default function APIDiscoveryPanel({ onIntegrate }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [discoveredAPIs, setDiscoveredAPIs] = useState([]);
  const [integratedAPIs, setIntegratedAPIs] = useState([]);

  const discoverAPIs = async () => {
    if (!searchQuery.trim() && !selectedCategory) {
      toast.error('Enter a search term or select a category');
      return;
    }

    setIsSearching(true);
    
    const prompt = `Find free public APIs for: ${searchQuery || selectedCategory}. 
Return a JSON array of APIs with these fields for each:
- name: API name
- description: Brief description
- baseUrl: Base URL endpoint
- authType: "none", "apiKey", or "oauth"
- category: category name
- docUrl: documentation URL
- endpoints: array of {method, path, description}
- rateLimit: requests per minute/hour if known
- isFree: boolean

Focus on well-documented, reliable, free-tier APIs. Return 5-8 results.`;

    const response = await base44.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: true,
      response_json_schema: {
        type: 'object',
        properties: {
          apis: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                description: { type: 'string' },
                baseUrl: { type: 'string' },
                authType: { type: 'string' },
                category: { type: 'string' },
                docUrl: { type: 'string' },
                endpoints: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      method: { type: 'string' },
                      path: { type: 'string' },
                      description: { type: 'string' }
                    }
                  }
                },
                rateLimit: { type: 'string' },
                isFree: { type: 'boolean' }
              }
            }
          }
        }
      }
    });

    setDiscoveredAPIs(response.apis || []);
    setIsSearching(false);
  };

  const handleIntegrate = (api) => {
    setIntegratedAPIs([...integratedAPIs, api.name]);
    onIntegrate?.(api);
    toast.success(`${api.name} integrated!`);
  };

  const copyEndpoint = (endpoint, baseUrl) => {
    navigator.clipboard.writeText(`${baseUrl}${endpoint.path}`);
    toast.success('Endpoint copied!');
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && discoverAPIs()}
            placeholder="Search for APIs (e.g., weather, stocks, news)..."
            className="pl-10 h-11 rounded-xl"
          />
        </div>
        <Button
          onClick={discoverAPIs}
          disabled={isSearching}
          className="h-11 px-6 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-xl"
        >
          {isSearching ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Globe className="w-4 h-4 mr-2" />
              Discover
            </>
          )}
        </Button>
      </div>

      {/* Categories */}
      <div className="flex flex-wrap gap-2">
        {API_CATEGORIES.map((cat) => (
          <Button
            key={cat.id}
            variant={selectedCategory === cat.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setSelectedCategory(selectedCategory === cat.id ? null : cat.id);
              setSearchQuery(cat.name);
            }}
            className={cn(
              "rounded-full",
              selectedCategory === cat.id && "bg-indigo-500 hover:bg-indigo-600"
            )}
          >
            <span className="mr-1">{cat.icon}</span>
            {cat.name}
          </Button>
        ))}
      </div>

      {/* Results */}
      <ScrollArea className="h-[400px]">
        <AnimatePresence>
          {discoveredAPIs.length > 0 ? (
            <div className="space-y-3">
              {discoveredAPIs.map((api, index) => (
                <motion.div
                  key={api.name}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="rounded-xl hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base flex items-center gap-2">
                            {api.name}
                            {api.isFree && (
                              <Badge className="bg-green-100 text-green-700 text-xs">Free</Badge>
                            )}
                          </CardTitle>
                          <CardDescription className="text-xs mt-1">
                            {api.description}
                          </CardDescription>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleIntegrate(api)}
                          disabled={integratedAPIs.includes(api.name)}
                          className={cn(
                            "rounded-lg",
                            integratedAPIs.includes(api.name)
                              ? "bg-green-500"
                              : "bg-indigo-500 hover:bg-indigo-600"
                          )}
                        >
                          {integratedAPIs.includes(api.name) ? (
                            <>
                              <Check className="w-3 h-3 mr-1" />
                              Added
                            </>
                          ) : (
                            <>
                              <Plus className="w-3 h-3 mr-1" />
                              Integrate
                            </>
                          )}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex flex-wrap gap-2 mb-3">
                        <Badge variant="outline" className="text-xs">
                          <Zap className="w-3 h-3 mr-1" />
                          {api.authType}
                        </Badge>
                        {api.rateLimit && (
                          <Badge variant="outline" className="text-xs">
                            {api.rateLimit}
                          </Badge>
                        )}
                        {api.docUrl && (
                          <a
                            href={api.docUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-500 hover:underline flex items-center gap-1"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Docs
                          </a>
                        )}
                      </div>
                      {api.endpoints?.length > 0 && (
                        <div className="bg-gray-50 rounded-lg p-2 space-y-1">
                          {api.endpoints.slice(0, 3).map((ep, i) => (
                            <div
                              key={i}
                              className="flex items-center justify-between text-xs group"
                            >
                              <div className="flex items-center gap-2">
                                <Badge
                                  className={cn(
                                    "text-[10px] px-1.5",
                                    ep.method === 'GET' && "bg-green-100 text-green-700",
                                    ep.method === 'POST' && "bg-blue-100 text-blue-700",
                                    ep.method === 'PUT' && "bg-yellow-100 text-yellow-700",
                                    ep.method === 'DELETE' && "bg-red-100 text-red-700"
                                  )}
                                >
                                  {ep.method}
                                </Badge>
                                <code className="text-gray-600">{ep.path}</code>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 opacity-0 group-hover:opacity-100"
                                onClick={() => copyEndpoint(ep, api.baseUrl)}
                              >
                                <Copy className="w-3 h-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <Globe className="w-12 h-12 mb-4 text-gray-300" />
              <p className="text-sm">Search for APIs to discover integrations</p>
            </div>
          )}
        </AnimatePresence>
      </ScrollArea>
    </div>
  );
}