import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Sparkles, Loader, Copy, Download, RefreshCw, FileText, CheckCircle 
} from 'lucide-react';
import { toast } from 'sonner';

export default function BlogPostGenerator() {
  const [mode, setMode] = useState('generate');
  const [loading, setLoading] = useState(false);
  const [topic, setTopic] = useState('');
  const [style, setStyle] = useState('professional');
  const [wordCount, setWordCount] = useState(1500);
  const [existingContent, setExistingContent] = useState('');
  const [generatedPost, setGeneratedPost] = useState(null);
  const [copied, setCopied] = useState(null);

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast.error('Please enter a topic');
      return;
    }

    setLoading(true);
    try {
      const response = await base44.functions.invoke('generateBlogPost', {
        topic: topic.trim(),
        style,
        wordCount: parseInt(wordCount),
        existingContent: mode === 'refine' ? existingContent : null,
        action: mode,
      });

      if (response.data.success) {
        setGeneratedPost(response.data.data);
        toast.success(`Blog post ${mode === 'generate' ? 'generated' : 'refined'} successfully!`);
      } else {
        toast.error('Failed to generate blog post');
      }
    } catch (error) {
      toast.error(error.message || 'Error generating blog post');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  };

  const downloadAsMarkdown = () => {
    if (!generatedPost) return;

    const markdown = `# ${generatedPost.title}

**Meta Title:** ${generatedPost.meta_title}
**Meta Description:** ${generatedPost.meta_description}
**Slug:** ${generatedPost.slug}

**Tags:** ${generatedPost.tags.join(', ')}
**Categories:** ${generatedPost.categories.join(', ')}

---

${generatedPost.content}
`;

    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${generatedPost.slug}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="generator" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="generator">Generator</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="generator" className="space-y-6">
          {/* Mode Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                Blog Post Creator
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Action Tabs */}
              <div className="flex gap-2">
                <Button
                  variant={mode === 'generate' ? 'default' : 'outline'}
                  onClick={() => {
                    setMode('generate');
                    setExistingContent('');
                  }}
                  className="flex-1"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Generate from Scratch
                </Button>
                <Button
                  variant={mode === 'refine' ? 'default' : 'outline'}
                  onClick={() => setMode('refine')}
                  className="flex-1"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refine Existing
                </Button>
              </div>

              {/* Topic Input */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">
                  Topic {mode === 'refine' && '(optional - leave empty to keep original)'}
                </label>
                <Input
                  placeholder={mode === 'generate' ? 'e.g., "How to build scalable React apps"' : 'e.g., "Advanced React patterns" (optional)'}
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  disabled={loading}
                />
              </div>

              {/* Existing Content (for refine mode) */}
              {mode === 'refine' && (
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">
                    Current Content
                  </label>
                  <Textarea
                    placeholder="Paste your blog post content here..."
                    value={existingContent}
                    onChange={(e) => setExistingContent(e.target.value)}
                    disabled={loading}
                    className="min-h-48"
                  />
                </div>
              )}

              {/* Style Selection */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">
                  Tone & Style
                </label>
                <select
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  disabled={loading}
                  className="w-full h-10 px-3 rounded-md border border-gray-300 bg-white"
                >
                  <option value="professional">Professional</option>
                  <option value="casual">Casual & Friendly</option>
                  <option value="technical">Technical & Detailed</option>
                  <option value="engaging">Engaging & Conversational</option>
                  <option value="academic">Academic & Formal</option>
                </select>
              </div>

              {/* Word Count (for generate mode) */}
              {mode === 'generate' && (
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">
                    Target Word Count: {wordCount}
                  </label>
                  <input
                    type="range"
                    min="500"
                    max="5000"
                    step="100"
                    value={wordCount}
                    onChange={(e) => setWordCount(e.target.value)}
                    disabled={loading}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>500</span>
                    <span>5000</span>
                  </div>
                </div>
              )}

              {/* Generate Button */}
              <Button
                onClick={handleGenerate}
                disabled={loading || !topic.trim()}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    {mode === 'generate' ? 'Generating' : 'Refining'}...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    {mode === 'generate' ? 'Generate Blog Post' : 'Refine Post'}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview">
          {generatedPost ? (
            <div className="space-y-4">
              {/* SEO Metadata Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    SEO Metadata
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-700">Meta Title</label>
                    <div className="flex gap-2 mt-1">
                      <input
                        type="text"
                        value={generatedPost.meta_title}
                        readOnly
                        className="flex-1 px-3 py-2 border rounded-md bg-gray-50 text-sm"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(generatedPost.meta_title, 'meta_title')}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {generatedPost.meta_title.length}/60 characters
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-gray-700">Meta Description</label>
                    <div className="flex gap-2 mt-1">
                      <textarea
                        value={generatedPost.meta_description}
                        readOnly
                        className="flex-1 px-3 py-2 border rounded-md bg-gray-50 text-sm min-h-16"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(generatedPost.meta_description, 'meta_desc')}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {generatedPost.meta_description.length}/160 characters
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-gray-700">URL Slug</label>
                    <div className="flex gap-2 mt-1">
                      <input
                        type="text"
                        value={generatedPost.slug}
                        readOnly
                        className="flex-1 px-3 py-2 border rounded-md bg-gray-50 text-sm font-mono"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(generatedPost.slug, 'slug')}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-gray-700 block mb-2">Tags</label>
                    <div className="flex flex-wrap gap-2">
                      {generatedPost.tags.map((tag) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-gray-700 block mb-2">Categories</label>
                    <div className="flex flex-wrap gap-2">
                      {generatedPost.categories.map((cat) => (
                        <Badge key={cat} variant="outline">
                          {cat}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Content Card */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>{generatedPost.title}</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadAsMarkdown}
                    className="gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    {generatedPost.content.split('\n\n').map((para, idx) => (
                      <p key={idx} className="mb-4 text-gray-700 leading-relaxed">
                        {para}
                      </p>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setGeneratedPost(null)}
                  className="flex-1"
                >
                  Generate Another
                </Button>
              </div>
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No blog post generated yet. Go to Generator tab to create one.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}