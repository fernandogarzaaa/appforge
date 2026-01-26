import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Code, Copy, Star, StarOff, Trash2, Plus, Search, 
  Sparkles, Check, Loader2, Filter, Tag, TrendingUp
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const languages = ['javascript', 'typescript', 'jsx', 'python', 'css', 'html', 'json', 'sql', 'bash'];
const categories = ['component', 'function', 'hook', 'utility', 'api', 'style', 'database', 'automation', 'other'];
const frameworks = ['react', 'vue', 'angular', 'node', 'deno', 'general'];

export default function CodeSnippetLibrary({ projectId, contextCode }) {
  const [search, setSearch] = useState('');
  const [filterLanguage, setFilterLanguage] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  const queryClient = useQueryClient();

  const { data: snippets = [], isLoading } = useQuery({
    queryKey: ['snippets', projectId],
    queryFn: () => base44.entities.CodeSnippet.filter(
      projectId ? { project_id: projectId } : {},
      '-usage_count'
    ),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.CodeSnippet.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['snippets'] });
      setShowCreateModal(false);
      toast.success('Snippet saved!');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.CodeSnippet.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['snippets'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.CodeSnippet.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['snippets'] });
      toast.success('Snippet deleted');
    },
  });

  const handleCopy = async (snippet) => {
    await navigator.clipboard.writeText(snippet.code);
    setCopiedId(snippet.id);
    updateMutation.mutate({
      id: snippet.id,
      data: { usage_count: (snippet.usage_count || 0) + 1 }
    });
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleFavorite = (snippet) => {
    updateMutation.mutate({
      id: snippet.id,
      data: { is_favorite: !snippet.is_favorite }
    });
  };

  const getAISuggestions = async () => {
    if (!contextCode) {
      toast.info('Provide some context code to get AI suggestions');
      return;
    }

    setLoadingSuggestions(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this code and suggest relevant code snippets that would be helpful:

${contextCode}

Available snippets:
${snippets.map(s => `- ${s.title} (${s.category}): ${s.description}`).join('\n')}

Return the top 3 most relevant snippet titles and explain why they're relevant.`,
        response_json_schema: {
          type: "object",
          properties: {
            suggestions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  reason: { type: "string" }
                }
              }
            }
          }
        }
      });

      setAiSuggestions(response.suggestions || []);
    } catch (error) {
      toast.error('Failed to get suggestions');
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const filteredSnippets = snippets.filter(snippet => {
    const matchesSearch = 
      snippet.title.toLowerCase().includes(search.toLowerCase()) ||
      snippet.description?.toLowerCase().includes(search.toLowerCase()) ||
      snippet.tags?.some(tag => tag.toLowerCase().includes(search.toLowerCase()));
    
    const matchesLanguage = filterLanguage === 'all' || snippet.language === filterLanguage;
    const matchesCategory = filterCategory === 'all' || snippet.category === filterCategory;

    return matchesSearch && matchesLanguage && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Code Snippet Library</h2>
          <p className="text-gray-500 mt-1">Save and reuse your favorite code snippets</p>
        </div>
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogTrigger asChild>
            <Button className="bg-indigo-600 hover:bg-indigo-700">
              <Plus className="w-4 h-4 mr-2" />
              New Snippet
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Code Snippet</DialogTitle>
            </DialogHeader>
            <CreateSnippetForm
              projectId={projectId}
              onSubmit={(data) => createMutation.mutate(data)}
              isLoading={createMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* AI Suggestions */}
      {contextCode && (
        <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Sparkles className="w-5 h-5 text-purple-600" />
                AI Snippet Suggestions
              </CardTitle>
              <Button
                onClick={getAISuggestions}
                disabled={loadingSuggestions}
                size="sm"
                variant="outline"
              >
                {loadingSuggestions ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Get Suggestions'
                )}
              </Button>
            </div>
          </CardHeader>
          {aiSuggestions.length > 0 && (
            <CardContent>
              <div className="space-y-2">
                {aiSuggestions.map((suggestion, idx) => {
                  const snippet = snippets.find(s => s.title === suggestion.title);
                  return snippet ? (
                    <SnippetCard
                      key={idx}
                      snippet={snippet}
                      onCopy={handleCopy}
                      onToggleFavorite={toggleFavorite}
                      onDelete={deleteMutation.mutate}
                      copiedId={copiedId}
                      aiReason={suggestion.reason}
                    />
                  ) : null;
                })}
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Search and Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex-1 min-w-[300px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search snippets by title, description, or tags..."
            className="pl-10"
          />
        </div>
        <Select value={filterLanguage} onValueChange={setFilterLanguage}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Language" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Languages</SelectItem>
            {languages.map(lang => (
              <SelectItem key={lang} value={lang}>{lang}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(cat => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-indigo-600">{snippets.length}</div>
            <div className="text-sm text-gray-500">Total Snippets</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-purple-600">
              {snippets.filter(s => s.is_favorite).length}
            </div>
            <div className="text-sm text-gray-500">Favorites</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {new Set(snippets.map(s => s.language)).size}
            </div>
            <div className="text-sm text-gray-500">Languages</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">
              {snippets.reduce((sum, s) => sum + (s.usage_count || 0), 0)}
            </div>
            <div className="text-sm text-gray-500">Total Uses</div>
          </CardContent>
        </Card>
      </div>

      {/* Snippets Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      ) : filteredSnippets.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Code className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No snippets found</h3>
            <p className="text-gray-500 mb-6">
              {search || filterLanguage !== 'all' || filterCategory !== 'all'
                ? 'Try adjusting your filters'
                : 'Create your first code snippet to get started'}
            </p>
            {!search && filterLanguage === 'all' && filterCategory === 'all' && (
              <Button onClick={() => setShowCreateModal(true)} className="bg-indigo-600">
                <Plus className="w-4 h-4 mr-2" />
                Create Snippet
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          <AnimatePresence>
            {filteredSnippets.map(snippet => (
              <SnippetCard
                key={snippet.id}
                snippet={snippet}
                onCopy={handleCopy}
                onToggleFavorite={toggleFavorite}
                onDelete={deleteMutation.mutate}
                copiedId={copiedId}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

function CreateSnippetForm({ projectId, onSubmit, isLoading }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    code: '',
    language: 'javascript',
    category: 'other',
    framework: 'general',
    tags: [],
    project_id: projectId
  });
  const [tagInput, setTagInput] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, tagInput.trim()] });
      setTagInput('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        placeholder="Snippet title"
        value={formData.title}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        required
      />
      <Textarea
        placeholder="Description (optional)"
        value={formData.description}
        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        rows={2}
      />
      <Textarea
        placeholder="Paste your code here..."
        value={formData.code}
        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
        className="font-mono text-sm"
        rows={8}
        required
      />
      <div className="grid grid-cols-3 gap-3">
        <Select value={formData.language} onValueChange={(v) => setFormData({ ...formData, language: v })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {languages.map(lang => (
              <SelectItem key={lang} value={lang}>{lang}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {categories.map(cat => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={formData.framework} onValueChange={(v) => setFormData({ ...formData, framework: v })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {frameworks.map(fw => (
              <SelectItem key={fw} value={fw}>{fw}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <div className="flex gap-2 mb-2">
          <Input
            placeholder="Add tags..."
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
          />
          <Button type="button" onClick={addTag} variant="outline">
            <Tag className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {formData.tags.map(tag => (
            <Badge key={tag} variant="secondary">
              {tag}
              <button
                type="button"
                onClick={() => setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) })}
                className="ml-1"
              >
                ×
              </button>
            </Badge>
          ))}
        </div>
      </div>
      <Button type="submit" disabled={isLoading} className="w-full bg-indigo-600">
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Snippet'}
      </Button>
    </form>
  );
}

function SnippetCard({ snippet, onCopy, onToggleFavorite, onDelete, copiedId, aiReason }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
    >
      <Card className={cn("hover:shadow-md transition-shadow", aiReason && "border-purple-300")}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <CardTitle className="text-lg">{snippet.title}</CardTitle>
                {snippet.is_favorite && <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />}
              </div>
              {snippet.description && (
                <p className="text-sm text-gray-600">{snippet.description}</p>
              )}
              {aiReason && (
                <div className="mt-2 p-2 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-purple-600 mt-0.5" />
                    <p className="text-xs text-purple-900">{aiReason}</p>
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onToggleFavorite(snippet)}
              >
                {snippet.is_favorite ? (
                  <StarOff className="w-4 h-4" />
                ) : (
                  <Star className="w-4 h-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onCopy(snippet)}
              >
                {copiedId === snippet.id ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(snippet.id)}
                className="text-red-600"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto text-sm">
            <code>{snippet.code}</code>
          </pre>
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <Badge variant="outline">{snippet.language}</Badge>
            <Badge variant="outline">{snippet.category}</Badge>
            {snippet.framework !== 'general' && <Badge variant="outline">{snippet.framework}</Badge>}
            {snippet.usage_count > 0 && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                {snippet.usage_count} uses
              </Badge>
            )}
            {snippet.tags?.map(tag => (
              <Badge key={tag} variant="secondary">{tag}</Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}