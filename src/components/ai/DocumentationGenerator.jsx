import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, Download, Loader2, Check, BookOpen, 
  Database, FileCode, Component, Workflow, Copy 
} from 'lucide-react';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

export default function DocumentationGenerator({ projectId }) {
  const [generating, setGenerating] = useState(false);
  const [documentation, setDocumentation] = useState(null);
  const [copied, setCopied] = useState(false);

  const generateDocumentation = async () => {
    if (!projectId) {
      toast.error('Please select a project first');
      return;
    }

    setGenerating(true);
    try {
      // Fetch project structure
      const [project, entities, pages, components] = await Promise.all([
        base44.entities.Project.filter({ id: projectId }).then(r => r[0]),
        base44.entities.Entity.filter({ project_id: projectId }),
        base44.entities.Page.filter({ project_id: projectId }),
        base44.entities.Component.filter({ project_id: projectId })
      ]);

      // Generate comprehensive documentation
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate comprehensive technical documentation for this application:

**Project:** ${project.name}
**Description:** ${project.description || 'N/A'}

**Database Schema (${entities.length} entities):**
${entities.map(e => `- ${e.name}: ${JSON.stringify(e.schema?.properties || {})}`).join('\n')}

**Pages (${pages.length}):**
${pages.map(p => `- ${p.name} (${p.path})`).join('\n')}

**Components (${components.length}):**
${components.map(c => `- ${c.name}`).join('\n')}

Create documentation with:
1. **Overview** - What the app does
2. **Architecture** - Tech stack and structure
3. **Database Schema** - Detailed entity documentation
4. **API Endpoints** - Available endpoints for each entity
5. **Pages & Components** - UI structure
6. **Setup Instructions** - How to deploy/run
7. **Features** - Key capabilities
8. **Future Enhancements** - Suggested improvements

Format in clear Markdown with code examples.`
      });

      const doc = {
        project_name: project.name,
        generated_at: new Date().toISOString(),
        content: response,
        stats: {
          entities: entities.length,
          pages: pages.length,
          components: components.length
        }
      };

      setDocumentation(doc);
      toast.success('Documentation generated successfully!');
    } catch (error) {
      console.error('Documentation generation error:', error);
      toast.error('Failed to generate documentation');
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(documentation.content);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadMarkdown = () => {
    const blob = new Blob([documentation.content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${documentation.project_name.replace(/\s+/g, '_')}_documentation.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Documentation downloaded');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle>Auto Documentation Generator</CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Generate comprehensive docs from your app structure
                </p>
              </div>
            </div>
            <Badge className="bg-blue-100 text-blue-700">AI-Powered</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!documentation ? (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Generate Documentation
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                AI will analyze your project structure, entities, pages, and components 
                to create professional documentation with setup guides and API references.
              </p>
              <Button
                onClick={generateDocumentation}
                disabled={generating || !projectId}
                className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing Project...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4 mr-2" />
                    Generate Documentation
                  </>
                )}
              </Button>
            </div>
          ) : (
            <>
              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Database className="w-5 h-5 text-purple-600" />
                      <div>
                        <div className="text-2xl font-bold text-purple-900">
                          {documentation.stats.entities}
                        </div>
                        <div className="text-xs text-purple-700">Entities</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <FileCode className="w-5 h-5 text-blue-600" />
                      <div>
                        <div className="text-2xl font-bold text-blue-900">
                          {documentation.stats.pages}
                        </div>
                        <div className="text-xs text-blue-700">Pages</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-green-50 to-green-100">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Component className="w-5 h-5 text-green-600" />
                      <div>
                        <div className="text-2xl font-bold text-green-900">
                          {documentation.stats.components}
                        </div>
                        <div className="text-xs text-green-700">Components</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Actions */}
              <div className="flex gap-3 mb-4">
                <Button onClick={copyToClipboard} variant="outline">
                  {copied ? (
                    <Check className="w-4 h-4 mr-2 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4 mr-2" />
                  )}
                  Copy
                </Button>
                <Button onClick={downloadMarkdown} variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Download .md
                </Button>
                <Button
                  onClick={generateDocumentation}
                  variant="outline"
                  className="ml-auto"
                >
                  <Workflow className="w-4 h-4 mr-2" />
                  Regenerate
                </Button>
              </div>

              {/* Documentation Preview */}
              <Card className="border-2">
                <CardContent className="p-6">
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown>{documentation.content}</ReactMarkdown>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}