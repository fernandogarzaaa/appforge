import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Plus, Trash2 } from 'lucide-react';

export default function ChatbotKnowledgeConfig({ sources, onUpdate }) {
  const [sourceType, setSourceType] = useState('document');
  const [selectedSource, setSelectedSource] = useState('');

  const { data: documents = [] } = useQuery({
    queryKey: ['projectDocuments'],
    queryFn: () => base44.entities.ProjectDocument.list()
  });

  const { data: entities = [] } = useQuery({
    queryKey: ['entities'],
    queryFn: () => base44.entities.Entity.list()
  });

  const getAvailableSources = () => {
    if (sourceType === 'document') return documents;
    if (sourceType === 'entity') return entities;
    return [];
  };

  const handleAddSource = () => {
    if (!selectedSource) return;
    
    const availableSources = getAvailableSources();
    const selected = availableSources.find(s => s.id === selectedSource);
    
    if (selected && !sources.find(s => s.source_id === selectedSource)) {
      onUpdate([
        ...sources,
        {
          id: Math.random().toString(36).substr(2, 9),
          type: sourceType,
          source_id: selectedSource,
          name: selected.name || selected.title
        }
      ]);
      setSelectedSource('');
    }
  };

  return (
    <div className="space-y-4 mt-4">
      <div className="space-y-2">
        <Label>Source Type</Label>
        <Select value={sourceType} onValueChange={setSourceType}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="document">Documents</SelectItem>
            <SelectItem value="entity">Entities</SelectItem>
            <SelectItem value="api">APIs</SelectItem>
            <SelectItem value="webpage">Webpages</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Select {sourceType}</Label>
        <div className="flex gap-2">
          <Select value={selectedSource} onValueChange={setSelectedSource}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Choose a source..." />
            </SelectTrigger>
            <SelectContent>
              {getAvailableSources().map(source => (
                <SelectItem key={source.id} value={source.id}>
                  {source.name || source.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleAddSource} size="sm">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {sources.length > 0 && (
        <div className="space-y-2">
          <Label>Knowledge Sources</Label>
          <div className="space-y-2">
            {sources.map(source => (
              <div key={source.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">{source.name}</p>
                  <p className="text-xs text-gray-500 capitalize">{source.type}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onUpdate(sources.filter(s => s.id !== source.id))}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}