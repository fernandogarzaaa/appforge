import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Globe, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

export default function APIDiscoveryPanel({ onIntegrate }) {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  const handleSearch = async () => {
    if (!search.trim()) return;
    setLoading(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Find 5 popular free APIs for: ${search}. Return JSON with array of {name, description, endpoint, auth_type}`,
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
                  endpoint: { type: 'string' },
                  auth_type: { type: 'string' }
                }
              }
            }
          }
        }
      });
      setResults(result.apis || []);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search for APIs... (e.g., weather, crypto, news)"
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
        />
        <Button onClick={handleSearch} disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
        </Button>
      </div>

      <div className="grid gap-3">
        {results.map((api, idx) => (
          <Card key={idx}>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                {api.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-3">{api.description}</p>
              <div className="space-y-2 text-xs text-gray-500">
                <div><strong>Endpoint:</strong> {api.endpoint}</div>
                <div><strong>Auth:</strong> {api.auth_type}</div>
              </div>
              <Button onClick={() => onIntegrate?.(api)} className="w-full mt-4" size="sm">
                Integrate API
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}