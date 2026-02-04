import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Upload } from 'lucide-react';

export default function PublishAssetModal({ asset, assetType, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    domain: 'general',
    tags: '',
  });
  const [isPublishing, setIsPublishing] = useState(false);

  const handlePublish = async () => {
    if (!formData.title || !formData.description) {
      alert('Title and description required');
      return;
    }

    setIsPublishing(true);
    try {
      const response = await base44.functions.invoke('publishToMarketplace', {
        assetType,
        agentId: asset.id,
        title: formData.title,
        description: formData.description,
        domain: formData.domain,
        tags: formData.tags.split(',').map(t => t.trim()).filter(t => t),
      });

      if (response.data?.success) {
        onSuccess?.(response.data);
        onClose();
      }
    } catch (error) {
      console.error('Publish error:', error);
      alert('Failed to publish');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Upload className="w-4 h-4" />
          Publish to Marketplace
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-xs font-semibold block mb-1">Asset Title</label>
          <Input
            placeholder="Give your asset a catchy title"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          />
        </div>

        <div>
          <label className="text-xs font-semibold block mb-1">Description</label>
          <Textarea
            placeholder="Describe what this asset does and why others should use it"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            className="h-24"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold block mb-1">Domain</label>
            <select
              value={formData.domain}
              onChange={(e) => setFormData(prev => ({ ...prev, domain: e.target.value }))}
              className="w-full px-2 py-1.5 text-sm border rounded-lg"
            >
              <option value="general">General</option>
              <option value="finance">Finance</option>
              <option value="healthcare">Healthcare</option>
              <option value="enterprise_software">Enterprise Software</option>
              <option value="legal">Legal</option>
              <option value="manufacturing">Manufacturing</option>
              <option value="research">Research</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold block mb-1">Tags (comma separated)</label>
            <Input
              placeholder="e.g., automation, analysis, testing"
              value={formData.tags}
              onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handlePublish}
            disabled={isPublishing}
            className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600"
          >
            {isPublishing ? (
              <>
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                Publishing...
              </>
            ) : (
              <>
                <Upload className="w-3 h-3 mr-1" />
                Publish Now
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}