import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, Sparkles, Copy, Download, RefreshCw, 
  BookOpen, Mail, Code, Newspaper, File, Briefcase
} from 'lucide-react';
import { toast } from 'sonner';

const contentTypes = [
  { id: 'blog', name: 'Blog Post', icon: FileText, color: 'blue' },
  { id: 'article', name: 'Article', icon: Newspaper, color: 'green' },
  { id: 'docs', name: 'Documentation', icon: BookOpen, color: 'purple' },
  { id: 'email', name: 'Email Copy', icon: Mail, color: 'pink' },
  { id: 'product', name: 'Product Description', icon: Briefcase, color: 'orange' },
  { id: 'technical', name: 'Technical Content', icon: Code, color: 'red' }
];

export default function ContentStudio() {
  const [generating, setGenerating] = useState(false);
  const [contentType, setContentType] = useState('blog');
  const [tone, setTone] = useState('professional');
  const [length, setLength] = useState('medium');
  const [topic, setTopic] = useState('');
  const [keywords, setKeywords] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [history, setHistory] = useState([]);

  const generateContent = async () => {
    if (!topic.trim()) {
      toast.error('Enter a topic');
      return;
    }

    setGenerating(true);
    try {
      const lengthMap = {
        short: '300-500 words',
        medium: '800-1200 words',
        long: '1500-2500 words'
      };

      const prompt = `Write a ${contentType} about: ${topic}

Tone: ${tone}
Length: ${lengthMap[length]}
${keywords ? `Keywords to include: ${keywords}` : ''}

Requirements:
- Professional and well-structured
- Include headings and subheadings
- Engaging and informative
- SEO-optimized
- Add relevant examples where appropriate
- Include a compelling introduction and conclusion

Provide the content in markdown format.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            content: { type: 'string' },
            summary: { type: 'string' },
            word_count: { type: 'number' }
          }
        }
      });

      setGeneratedContent(result.content);
      setShowResult(true);
      setHistory([{ 
        type: contentType, 
        topic, 
        content: result.content, 
        title: result.title,
        date: new Date().toISOString() 
      }, ...history]);
      toast.success('Content generated successfully!');
    } catch (error) {
      toast.error('Failed to generate content');
    } finally {
      setGenerating(false);
    }
  };

  const improveContent = async () => {
    if (!generatedContent) return;
    
    setGenerating(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Improve and enhance this content:

${generatedContent}

Improvements to make:
- Better flow and readability
- More engaging language
- Add examples and data points
- Improve SEO optimization
- Stronger call-to-action
- Better formatting`,
        response_json_schema: {
          type: 'object',
          properties: {
            improved_content: { type: 'string' }
          }
        }
      });

      setGeneratedContent(result.improved_content);
      toast.success('Content improved!');
    } catch (error) {
      toast.error('Failed to improve content');
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedContent);
    toast.success('Copied to clipboard');
  };

  const downloadContent = () => {
    const blob = new Blob([generatedContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${topic.replace(/\s+/g, '-').toLowerCase()}.md`;
    a.click();
    toast.success('Downloaded');
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">AI Content Studio</h1>
        <p className="text-gray-500">Generate high-quality content with AI in seconds</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Panel */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Content Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Content Type</Label>
                <Select value={contentType} onValueChange={setContentType}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {contentTypes.map(type => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Topic / Subject</Label>
                <Textarea
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="What do you want to write about?"
                  rows={3}
                  className="mt-2"
                />
              </div>

              <div>
                <Label>Tone</Label>
                <Select value={tone} onValueChange={setTone}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="casual">Casual</SelectItem>
                    <SelectItem value="friendly">Friendly</SelectItem>
                    <SelectItem value="formal">Formal</SelectItem>
                    <SelectItem value="creative">Creative</SelectItem>
                    <SelectItem value="persuasive">Persuasive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Length</Label>
                <Select value={length} onValueChange={setLength}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="short">Short (300-500 words)</SelectItem>
                    <SelectItem value="medium">Medium (800-1200 words)</SelectItem>
                    <SelectItem value="long">Long (1500-2500 words)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Keywords (Optional)</Label>
                <Input
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  placeholder="SEO, Marketing, AI..."
                  className="mt-2"
                />
              </div>

              <Button onClick={generateContent} disabled={generating} className="w-full">
                {generating ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Content
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Quick Templates */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Quick Templates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {contentTypes.map(type => (
                <Button
                  key={type.id}
                  variant="outline"
                  size="sm"
                  onClick={() => setContentType(type.id)}
                  className="w-full justify-start"
                >
                  <type.icon className="w-4 h-4 mr-2" />
                  {type.name}
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Output Panel */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Generated Content</CardTitle>
                {generatedContent && (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={improveContent} disabled={generating}>
                      <Sparkles className="w-3 h-3 mr-1" />
                      Improve
                    </Button>
                    <Button variant="outline" size="sm" onClick={copyToClipboard}>
                      <Copy className="w-3 h-3 mr-1" />
                      Copy
                    </Button>
                    <Button variant="outline" size="sm" onClick={downloadContent}>
                      <Download className="w-3 h-3 mr-1" />
                      Download
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {generatedContent ? (
                <div className="prose prose-sm max-w-none">
                  <Textarea
                    value={generatedContent}
                    onChange={(e) => setGeneratedContent(e.target.value)}
                    rows={20}
                    className="font-mono text-sm"
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <FileText className="w-16 h-16 text-gray-300 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No content yet</h3>
                  <p className="text-gray-500">Configure settings and click Generate to create content</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* History */}
      {history.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Recent Content</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {history.slice(0, 5).map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
                  onClick={() => {
                    setGeneratedContent(item.content);
                    setTopic(item.topic);
                    setContentType(item.type);
                  }}
                >
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">{item.type}</Badge>
                    <span className="text-sm font-medium">{item.title || item.topic}</span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(item.date).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}