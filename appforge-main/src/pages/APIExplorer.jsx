import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Search, Globe, Code, Copy, ExternalLink, Check, Loader2, Star, Play, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

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
  const [codeSnippets, setCodeSnippets] = useState([]);
  const [showSnippetsDialog, setShowSnippetsDialog] = useState(false);
  const [showTestDialog, setShowTestDialog] = useState(false);
  const [selectedAPI, setSelectedAPI] = useState(null);
  const [testEndpoint, setTestEndpoint] = useState('');
  const [testMethod, setTestMethod] = useState('GET');
  const [testResponse, setTestResponse] = useState(null);
  const [isTesting, setIsTesting] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Find 5 free public APIs related to "${searchQuery}". For each API provide:
        - name: API name
        - category: auto-categorize into one of (Weather, Finance, Social Media, Data, Entertainment, Productivity, Developer Tools, Media, E-commerce, Sports, News, Other)
        - description: brief description
        - url: official documentation URL
        - base_url: base API endpoint URL (e.g., https://api.example.com)
        - free: whether it's completely free (true/false)
        - auth_required: whether authentication is needed
        
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
                  base_url: { type: 'string' },
                  free: { type: 'boolean' },
                  auth_required: { type: 'boolean' }
                }
              }
            }
          }
        }
      });
      
      setDiscoveredAPIs(result.apis || []);
      
      // Auto-generate code snippets for top 3 free APIs
      const freeAPIs = (result.apis || []).filter(api => api.free).slice(0, 3);
      if (freeAPIs.length > 0) {
        generateCodeSnippets(freeAPIs);
      }
    } catch (error) {
      toast.error('Failed to search APIs');
    } finally {
      setLoading(false);
    }
  };

  const generateCodeSnippets = async (apis) => {
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate integration code snippets for these APIs:
        ${JSON.stringify(apis)}
        
        For each API provide:
        - api_name: API name
        - javascript: fetch example code
        - python: requests example code
        - curl: curl command example
        
        Make them complete, working examples.`,
        response_json_schema: {
          type: 'object',
          properties: {
            snippets: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  api_name: { type: 'string' },
                  javascript: { type: 'string' },
                  python: { type: 'string' },
                  curl: { type: 'string' }
                }
              }
            }
          }
        }
      });
      
      setCodeSnippets(result.snippets || []);
      toast.success('Code snippets generated for top 3 free APIs!');
    } catch (error) {
      console.error('Failed to generate snippets');
    }
  };

  const testAPI = async () => {
    if (!testEndpoint.trim()) {
      toast.error('Enter an API endpoint');
      return;
    }

    setIsTesting(true);
    try {
      const response = await fetch(testEndpoint, {
        method: testMethod,
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await response.json();
      setTestResponse({
        status: response.status,
        statusText: response.statusText,
        data: JSON.stringify(data, null, 2)
      });
      toast.success('API test successful!');
    } catch (error) {
      setTestResponse({
        status: 'Error',
        statusText: error.message,
        data: null
      });
      toast.error('API test failed');
    } finally {
      setIsTesting(false);
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
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Search Results</h2>
            {codeSnippets.length > 0 && (
              <Button onClick={() => setShowSnippetsDialog(true)} variant="outline">
                <Sparkles className="w-4 h-4 mr-2" />
                View Code Snippets
              </Button>
            )}
          </div>
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
                        <div className="flex gap-1 mt-1">
                          <Badge variant="outline">{api.category}</Badge>
                          {api.auth_required && <Badge variant="outline" className="text-xs">Auth Required</Badge>}
                        </div>
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
                      onClick={() => {
                        setSelectedAPI(api);
                        setTestEndpoint(api.base_url || '');
                        setShowTestDialog(true);
                      }}
                    >
                      <Play className="w-3 h-3 mr-1" />
                      Test
                    </Button>
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

      {/* Code Snippets Dialog */}
      <Dialog open={showSnippetsDialog} onOpenChange={setShowSnippetsDialog}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Code className="w-5 h-5" />
              Integration Code Snippets - Top 3 Free APIs
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {codeSnippets.map((snippet, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-base">{snippet.api_name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-xs font-medium">JavaScript (Fetch)</Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(snippet.javascript);
                          toast.success('Copied!');
                        }}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                    <pre className="bg-gray-900 text-gray-100 p-3 rounded text-xs overflow-x-auto">
                      {snippet.javascript}
                    </pre>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-xs font-medium">Python (Requests)</Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(snippet.python);
                          toast.success('Copied!');
                        }}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                    <pre className="bg-gray-900 text-gray-100 p-3 rounded text-xs overflow-x-auto">
                      {snippet.python}
                    </pre>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-xs font-medium">cURL</Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(snippet.curl);
                          toast.success('Copied!');
                        }}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                    <pre className="bg-gray-900 text-gray-100 p-3 rounded text-xs overflow-x-auto">
                      {snippet.curl}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <DialogFooter>
            <Button onClick={() => setShowSnippetsDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Test API Dialog */}
      <Dialog open={showTestDialog} onOpenChange={setShowTestDialog}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Play className="w-5 h-5" />
              Test API - {selectedAPI?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>HTTP Method</Label>
              <Tabs value={testMethod} onValueChange={setTestMethod} className="mt-2">
                <TabsList>
                  <TabsTrigger value="GET">GET</TabsTrigger>
                  <TabsTrigger value="POST">POST</TabsTrigger>
                  <TabsTrigger value="PUT">PUT</TabsTrigger>
                  <TabsTrigger value="DELETE">DELETE</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <div>
              <Label>API Endpoint</Label>
              <Input
                value={testEndpoint}
                onChange={(e) => setTestEndpoint(e.target.value)}
                placeholder="https://api.example.com/endpoint"
                className="mt-2"
              />
            </div>
            <Button onClick={testAPI} disabled={isTesting} className="w-full">
              {isTesting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Send Request
                </>
              )}
            </Button>
            {testResponse && (
              <div className="space-y-2">
                <Label>Response</Label>
                <div className="flex gap-2 items-center">
                  <Badge variant={testResponse.status < 300 ? 'default' : 'destructive'}>
                    {testResponse.status}
                  </Badge>
                  <span className="text-sm text-gray-600">{testResponse.statusText}</span>
                </div>
                {testResponse.data && (
                  <Textarea
                    value={testResponse.data}
                    readOnly
                    rows={10}
                    className="font-mono text-xs"
                  />
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowTestDialog(false);
              setTestResponse(null);
            }}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}