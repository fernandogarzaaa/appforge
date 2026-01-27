import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Copy, Check, Star } from 'lucide-react';
import { toast } from 'sonner';

const languages = ['javascript', 'typescript', 'python', 'jsx', 'css', 'html'];
const categories = ['component', 'function', 'hook', 'utility', 'api'];

export default function CodeSnippetLibrary({ projectId, contextCode }) {
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  const { data: snippets = [] } = useQuery({
    queryKey: ['codeSnippets', projectId],
    queryFn: () => base44.entities.CodeSnippet.filter({ project_id: projectId }, '-created_date')
  });

  const filtered = snippets.filter(s => 
    s.title?.toLowerCase().includes(search.toLowerCase()) ||
    s.description?.toLowerCase().includes(search.toLowerCase())
  );

  const copyToClipboard = (code, id) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-4">
      <Input
        placeholder="Search snippets..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="grid gap-3">
        {filtered.map((snippet) => (
          <Card key={snippet.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-base">{snippet.title}</CardTitle>
                  <p className="text-xs text-gray-500 mt-1">{snippet.description}</p>
                </div>
                {snippet.is_favorite && <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />}
              </div>
              <div className="flex gap-1 mt-2">
                <Badge variant="outline" className="text-xs">{snippet.language}</Badge>
                <Badge variant="outline" className="text-xs">{snippet.category}</Badge>
                {snippet.framework && <Badge variant="outline" className="text-xs">{snippet.framework}</Badge>}
              </div>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-900 text-gray-100 rounded-lg p-3 text-xs overflow-x-auto mb-3">
                <code>{snippet.code}</code>
              </pre>
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(snippet.code, snippet.id)}
                className="w-full"
              >
                {copiedId === snippet.id ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                {copiedId === snippet.id ? 'Copied' : 'Copy Code'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No snippets found
        </div>
      )}
    </div>
  );
}