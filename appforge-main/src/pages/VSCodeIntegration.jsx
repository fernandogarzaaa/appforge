import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { 
  Code, Download, FolderTree, FileCode, Settings,
  CheckCircle, Loader2, ExternalLink, Copy, Sparkles, Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';

export default function VSCodeIntegration() {
  const [isExporting, setIsExporting] = useState(false);
  const [showSetupDialog, setShowSetupDialog] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const urlParams = new URLSearchParams(window.location.search);
  const projectId = urlParams.get('projectId');

  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => base44.entities.Project.filter({ id: projectId }).then(p => p[0]),
    enabled: !!projectId
  });

  const exportToVSCode = async () => {
    setIsExporting(true);
    try {
      // Simulate export process
      await new Promise(r => setTimeout(r, 2000));
      toast.success('Project exported! Download starting...');
      // In real implementation, this would generate a zip file
    } catch (error) {
      toast.error('Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  const generateCode = async () => {
    if (!aiPrompt.trim()) {
      toast.error('Enter a prompt');
      return;
    }

    setIsGenerating(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate production-ready code for: ${aiPrompt}
        
        Provide:
        - file_name: suggested filename with extension
        - code: complete, working code
        - description: what the code does
        - dependencies: array of npm packages needed
        
        Make it clean, well-documented, and follow best practices.`,
        response_json_schema: {
          type: 'object',
          properties: {
            file_name: { type: 'string' },
            code: { type: 'string' },
            description: { type: 'string' },
            dependencies: { type: 'array', items: { type: 'string' } }
          }
        }
      });
      
      toast.success('Code generated! Ready to export.');
    } catch (error) {
      toast.error('Failed to generate code');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!projectId) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Code className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Select a Project</h2>
          <p className="text-gray-500">Choose a project to integrate with VS Code</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">VS Code Integration</h1>
          <p className="text-gray-500">Export and sync your project with VS Code</p>
        </div>
        <Button onClick={exportToVSCode} disabled={isExporting} className="bg-blue-600 hover:bg-blue-700">
          {isExporting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Export Project
            </>
          )}
        </Button>
      </div>

      <Tabs defaultValue="export" className="space-y-6">
        <TabsList>
          <TabsTrigger value="export">Export</TabsTrigger>
          <TabsTrigger value="ai-code">AI Code Generator</TabsTrigger>
          <TabsTrigger value="setup">Setup Guide</TabsTrigger>
        </TabsList>

        <TabsContent value="export" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center mb-4 mx-auto">
                  <FolderTree className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-center mb-2">Full Project Export</h3>
                <p className="text-sm text-gray-600 text-center mb-4">
                  Download complete project structure with all files
                </p>
                <Button onClick={exportToVSCode} className="w-full" variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center mb-4 mx-auto">
                  <FileCode className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-center mb-2">Source Code Only</h3>
                <p className="text-sm text-gray-600 text-center mb-4">
                  Export only pages, components, and entities
                </p>
                <Button className="w-full" variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center mb-4 mx-auto">
                  <Settings className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-center mb-2">Configuration Files</h3>
                <p className="text-sm text-gray-600 text-center mb-4">
                  Export package.json, configs, and dependencies
                </p>
                <Button className="w-full" variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Project Structure</CardTitle>
              <CardDescription>Preview of exported files</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm">
                <div className="space-y-1">
                  <div className="text-blue-400">📁 {project?.name || 'my-project'}/</div>
                  <div className="ml-4 text-green-400">📁 src/</div>
                  <div className="ml-8 text-yellow-400">📁 pages/</div>
                  <div className="ml-12 text-gray-300">📄 Home.jsx</div>
                  <div className="ml-12 text-gray-300">📄 Dashboard.jsx</div>
                  <div className="ml-8 text-yellow-400">📁 components/</div>
                  <div className="ml-12 text-gray-300">📄 Header.jsx</div>
                  <div className="ml-12 text-gray-300">📄 Sidebar.jsx</div>
                  <div className="ml-8 text-yellow-400">📁 entities/</div>
                  <div className="ml-12 text-gray-300">📄 Project.json</div>
                  <div className="ml-4 text-gray-300">📄 package.json</div>
                  <div className="ml-4 text-gray-300">📄 README.md</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Copy className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="font-medium text-sm">Clone Command</p>
                    <code className="text-xs text-gray-600 bg-white px-2 py-1 rounded">
                      git clone https://github.com/user/project.git
                    </code>
                  </div>
                </div>
                <Button size="sm" variant="outline">Copy</Button>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <ExternalLink className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="font-medium text-sm">Open in VS Code Web</p>
                    <p className="text-xs text-gray-600">Edit online without installing</p>
                  </div>
                </div>
                <Button size="sm" variant="outline">Open</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai-code" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                AI Code Generator
              </CardTitle>
              <CardDescription>Generate production-ready code with AI</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>What do you want to build?</Label>
                <Textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="e.g., Create a React component for a user profile card with avatar, name, bio, and social links..."
                  rows={4}
                />
              </div>
              <Button onClick={generateCode} disabled={isGenerating} className="w-full">
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Code
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>AI Features</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { icon: Code, title: 'Code Completion', desc: 'Smart autocomplete suggestions' },
                  { icon: Zap, title: 'Refactor Code', desc: 'Optimize and improve code quality' },
                  { icon: FileCode, title: 'Generate Tests', desc: 'Auto-generate unit tests' },
                  { icon: Sparkles, title: 'Debug Assistant', desc: 'AI-powered debugging help' }
                ].map((feature, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 border rounded-lg">
                    <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <feature.icon className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{feature.title}</p>
                      <p className="text-xs text-gray-600">{feature.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="setup" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Setup Instructions</CardTitle>
              <CardDescription>Get started with VS Code integration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {[
                  { step: 1, title: 'Export Your Project', desc: 'Click the "Export Project" button to download your project files as a ZIP' },
                  { step: 2, title: 'Extract Files', desc: 'Unzip the downloaded file to your desired location' },
                  { step: 3, title: 'Open in VS Code', desc: 'Open VS Code and select "Open Folder" from the File menu' },
                  { step: 4, title: 'Install Dependencies', desc: 'Run "npm install" in the integrated terminal' },
                  { step: 5, title: 'Start Development', desc: 'Run "npm start" to launch the development server' }
                ].map((item) => (
                  <div key={item.step} className="flex gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                      {item.step}
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">{item.title}</h4>
                      <p className="text-sm text-gray-600">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recommended Extensions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[
                  'ES7+ React/Redux/React-Native snippets',
                  'Tailwind CSS IntelliSense',
                  'Prettier - Code formatter',
                  'ESLint',
                  'GitLens'
                ].map((ext, i) => (
                  <div key={i} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm">{ext}</span>
                    </div>
                    <Button size="sm" variant="ghost">Install</Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}