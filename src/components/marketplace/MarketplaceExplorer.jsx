import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, Download, Search } from 'lucide-react';

export default function MarketplaceExplorer({ onSelectAsset }) {
  const [assets, setAssets] = useState([]);
  const [filteredAssets, setFilteredAssets] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  const DOMAINS = ['all', 'finance', 'healthcare', 'enterprise_software', 'legal', 'manufacturing', 'research'];
  const TYPES = ['all', 'custom_agent', 'workflow', 'training_dataset'];

  useEffect(() => {
    fetchAssets();
  }, []);

  useEffect(() => {
    filterAssets();
  }, [searchQuery, selectedDomain, selectedType, assets]);

  const fetchAssets = async () => {
    try {
      const data = await base44.entities.MarketplaceAsset.filter(
        { is_public: true },
        '-average_rating',
        50
      );
      setAssets(data || []);
    } catch (error) {
      console.error('Failed to fetch assets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterAssets = () => {
    let filtered = assets;

    if (selectedDomain !== 'all') {
      filtered = filtered.filter(a => a.domain === selectedDomain);
    }
    if (selectedType !== 'all') {
      filtered = filtered.filter(a => a.asset_type === selectedType);
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(a =>
        a.title.toLowerCase().includes(query) ||
        a.description.toLowerCase().includes(query) ||
        a.tags?.some(t => t.toLowerCase().includes(query))
      );
    }

    setFilteredAssets(filtered);
  };

  const downloadAsset = async (asset) => {
    // Track download
    try {
      await base44.entities.MarketplaceAsset.update(asset.id, {
        downloads: (asset.downloads || 0) + 1,
      });
      onSelectAsset?.(asset);
    } catch (error) {
      console.error('Download error:', error);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search agents, workflows, datasets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1">Domain</label>
            <select
              value={selectedDomain}
              onChange={(e) => setSelectedDomain(e.target.value)}
              className="w-full px-2 py-1.5 text-sm border rounded-lg"
            >
              {DOMAINS.map(d => (
                <option key={d} value={d} className="capitalize">
                  {d.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1">Type</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-2 py-1.5 text-sm border rounded-lg"
            >
              {TYPES.map(t => (
                <option key={t} value={t} className="capitalize">
                  {t.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Assets Grid */}
      {isLoading ? (
        <div className="text-center py-8">
          <p className="text-gray-500">Loading marketplace...</p>
        </div>
      ) : filteredAssets.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No assets found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredAssets.map((asset) => (
            <Card key={asset.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-4 space-y-3">
                <div>
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="font-semibold text-sm text-gray-900">{asset.title}</h3>
                    {asset.featured && <Badge className="bg-amber-600">Featured</Badge>}
                  </div>
                  <p className="text-xs text-gray-600">{asset.description.substring(0, 80)}...</p>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                    <span className="font-semibold">{asset.average_rating.toFixed(1)}</span>
                    <span className="text-gray-500">({asset.review_count} reviews)</span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-600">
                    <Download className="w-3 h-3" />
                    <span>{asset.downloads}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1">
                  <Badge variant="outline" className="text-xs capitalize">
                    {asset.asset_type.replace(/_/g, ' ')}
                  </Badge>
                  <Badge variant="outline" className="text-xs capitalize">
                    {asset.domain}
                  </Badge>
                </div>

                {asset.tags && asset.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {asset.tags.slice(0, 3).map((tag, idx) => (
                      <Badge key={idx} className="bg-gray-200 text-gray-800 text-xs">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                )}

                <Button
                  size="sm"
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600"
                  onClick={() => downloadAsset(asset)}
                >
                  <Download className="w-3 h-3 mr-1" />
                  Use This Asset
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}