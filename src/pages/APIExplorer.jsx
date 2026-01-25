import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Search, Globe, Code, Copy, ExternalLink, Check, Loader2, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

const popularAPIs = [
  { name: 'OpenWeatherMap', category: 'Weather', description: 'Weather data and forecasts', url: 'https://openweathermap.org/api', free: true },
  { name: 'REST Countries', category: 'Data', description: 'Country information', url: 'https://restcountries.com', free: true },
  { name: 'CoinGecko', category: 'Crypto', description: 'Cryptocurrency prices', url: 'https://www.coingecko.com/en/api', free: true },
  { name: 'News API', category: 'News', description: 'News articles and headlines', url: 'https://newsapi.org', free: true },
  { name: 'GitHub', category: 'Dev Tools', description: 'Repository and user data', url: 'https://docs.github.com/en/rest', free: true },
  { name: 'Unsplash', category: 'Media', description: 'Free stock photos', url: 'https://unsplash.com/developers', free: true },
  { name: 'JSONPlaceholder', category: 'Testing', description: 'Fake REST API for testing', url: 'https://jsonplaceholder.typicode.com', free: true },
  { name: 'Cat Facts', category: 'Fun', description: 'Random cat facts', url: 'https://catfact.ninja', free: true }
];

export default function APIExplorer() {
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [discoveredAPIs, setDiscoveredAPIs] = useState([]);
  const [copiedUrl, setCopiedUrl] = useState(null);
  const [category, setCategory] = useState('all');

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Find 5 free public APIs related to "${searchQuery}". For each API provide:
        - name: API name
        - category: category (e.g., Weather, Finance, Social Media)
        - description: brief description
        - url: official documentation URL
        - free: whether it's completely free (true/false)
        
        Return as JSON array.`,
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
                  category: { type: 'string' },
                  description: { type: 'string' },
                  url: { type: 'string' },
                  free: { type: 'boolean' }
                }
              }
            }
          }
        }
      });
      
      setDiscoveredAPIs(result.apis || []);
    } catch (error) {
      toast.error('Failed to search APIs');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (url) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    toast.success('URL copied to clipboard');
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const categories = ['all', ...new Set(popularAPIs.map(api => api.category))];
  const filteredPopular = category === 'all' 
    ? popularAPIs 
    : popularAPIs.filter(api => api.category === category);

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">API Explorer</h1>
        <p className="text-gray-500">Discover free APIs to integrate into your projects</p>
      </div>

      <div className="flex gap-2 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search for APIs (e.g., weather, maps, crypto)..."
            className="pl-10 h-11 rounded-xl"
          />
        </div>
        <Button onClick={handleSearch} disabled={loading} className="h-11 px-6 rounded-xl">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
        </Button>
      </div>

      {discoveredAPIs.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Search Results</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {discoveredAPIs.map((api, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                        <Globe className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{api.name}</CardTitle>
                        <Badge variant="outline" className="mt-1">{api.category}</Badge>
                      </div>
                    </div>
                    {api.free && <Badge className="bg-green-100 text-green-700">Free</Badge>}
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="mb-4">{api.description}</CardDescription>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(api.url)}
                      className="flex-1"
                    >
                      {copiedUrl === api.url ? (
                        <>
                          <Check className="w-3 h-3 mr-1" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 mr-1" />
                          Copy URL
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => window.open(api.url, '_blank')}
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      View Docs
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Popular APIs</h2>
          <Tabs value={category} onValueChange={setCategory}>
            <TabsList>
              {categories.map(cat => (
                <TabsTrigger key={cat} value={cat} className="text-xs capitalize">
                  {cat}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPopular.map((api, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gray-900 to-gray-700 flex items-center justify-center">
                      <Code className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{api.name}</CardTitle>
                      <Badge variant="outline" className="mt-1">{api.category}</Badge>
                    </div>
                  </div>
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-4">{api.description}</CardDescription>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(api.url)}
                    className="flex-1"
                  >
                    {copiedUrl === api.url ? (
                      <>
                        <Check className="w-3 h-3 mr-1" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 mr-1" />
                        Copy URL
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => window.open(api.url, '_blank')}
                  >
                    <ExternalLink className="w-3 h-3 mr-1" />
                    Docs
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}