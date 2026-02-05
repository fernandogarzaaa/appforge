import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, CheckCircle2, AlertCircle, Code2, Database, Layout, Zap } from 'lucide-react';
import { toast } from 'sonner';

export default function AIProjectGenerator({ isOpen, onClose, onProjectCreated }) {
  const [step, setStep] = useState('input'); // input, generating, review, success
  const [description, setDescription] = useState('');
  const [projectName, setProjectName] = useState('');
  const [generatedData, setGeneratedData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!description.trim()) {
      toast.error('Please describe your project idea');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      setStep('generating');

      // Use a simplified project name if not provided
      const finalProjectName = projectName.trim() || description.split('\n')[0].slice(0, 30);

      const response = await base44.functions.invoke('generateProjectFromDescription', {
        description: description,
        project_name: finalProjectName
      });

      if (response.data.success) {
        setGeneratedData(response.data);
        setStep('review');
        toast.success('Project structure generated successfully!');
      } else {
        throw new Error(response.data.error || 'Generation failed');
      }
    } catch (err) {
      console.error('Generation error:', err);
      setError(err.message || 'Failed to generate project');
      setStep('input');
      toast.error('Failed to generate project');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateProject = async () => {
    try {
      setIsLoading(true);
      // Project structure has been generated, save it
      if (generatedData && generatedData.success) {
        setStep('success');
        setTimeout(() => {
          onProjectCreated?.(generatedData);
          onClose();
        }, 2000);
      } else {
        throw new Error('Invalid project data');
      }
    } catch (err) {
      toast.error(`Error finalizing project: ${err.message}`);
      setStep('review');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (step === 'success') {
      onClose();
    } else {
      setStep('input');
      setDescription('');
      setProjectName('');
      setGeneratedData(null);
      setError('');
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            AI Project Generator
          </DialogTitle>
          <DialogDescription>
            Describe your project idea and let AI generate a complete structure
          </DialogDescription>
        </DialogHeader>

        {step === 'input' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Project Name (Optional)</label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="My Amazing App"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">If left blank, will be generated from description</p>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Project Description</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your project idea. Include:&#10;- Core functionality&#10;- Target users&#10;- Key features&#10;- Any specific integrations needed"
                className="min-h-32 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
              <p className="text-xs text-gray-500 mt-1">Be descriptive for best results</p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-red-700">{error}</div>
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={!description.trim() || isLoading}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Project
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {step === 'generating' && (
          <div className="py-8 text-center">
            <Loader2 className="w-12 h-12 animate-spin mx-auto text-purple-600 mb-4" />
            <p className="text-lg font-semibold mb-2">Generating your project...</p>
            <p className="text-sm text-gray-600">Analyzing your requirements and creating entities, pages, and components</p>
          </div>
        )}

        {step === 'review' && generatedData && (
          <div className="space-y-4">
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <h3 className="font-semibold text-lg mb-2">{generatedData.project.name}</h3>
              <p className="text-sm text-gray-700 mb-3">{generatedData.project.description}</p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{generatedData.project.category}</Badge>
                <Badge className="bg-purple-200 text-purple-900">AI Generated</Badge>
              </div>
            </div>

            <Tabs defaultValue="entities" className="space-y-3">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="entities" className="gap-1">
                  <Database className="w-3 h-3" />
                  <span className="hidden sm:inline">Entities</span>
                </TabsTrigger>
                <TabsTrigger value="pages" className="gap-1">
                  <Layout className="w-3 h-3" />
                  <span className="hidden sm:inline">Pages</span>
                </TabsTrigger>
                <TabsTrigger value="components" className="gap-1">
                  <Code2 className="w-3 h-3" />
                  <span className="hidden sm:inline">Components</span>
                </TabsTrigger>
                <TabsTrigger value="integrations" className="gap-1">
                  <Zap className="w-3 h-3" />
                  <span className="hidden sm:inline">Integrations</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="entities">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Entities ({generatedData.entities?.length || 0})</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 max-h-64 overflow-y-auto">
                    {generatedData.entities?.map((entity, i) => (
                      <div key={i} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="font-semibold text-sm">{entity.name}</p>
                        <p className="text-xs text-gray-600">{entity.description}</p>
                      </div>
                    )) || <p className="text-sm text-gray-600">No entities generated</p>}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="pages">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Pages ({generatedData.pages?.length || 0})</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 max-h-64 overflow-y-auto">
                    {generatedData.pages?.map((page, i) => (
                      <div key={i} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="font-semibold text-sm">{page.name}</p>
                        <p className="text-xs text-gray-600 mb-2">{page.description}</p>
                        <div className="flex flex-wrap gap-1">
                          {page.features?.map((f, j) => (
                            <Badge key={j} variant="outline" className="text-xs">{f}</Badge>
                          ))}
                        </div>
                      </div>
                    )) || <p className="text-sm text-gray-600">No pages generated</p>}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="components">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Components ({generatedData.components?.length || 0})</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 max-h-64 overflow-y-auto">
                    {generatedData.components?.map((comp, i) => (
                      <div key={i} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="font-semibold text-sm">{comp.name}</p>
                        <p className="text-xs text-gray-600">{comp.description}</p>
                      </div>
                    )) || <p className="text-sm text-gray-600">No components generated</p>}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="integrations">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Integrations ({generatedData.integrations?.length || 0})</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 max-h-64 overflow-y-auto">
                    {generatedData.integrations?.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {generatedData.integrations.map((integration, i) => (
                          <Badge key={i} className="bg-blue-100 text-blue-900">{integration}</Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-600">No specific integrations recommended</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setStep('input')}>
                Back
              </Button>
              <Button
                onClick={handleCreateProject}
                disabled={isLoading}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Create Project
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="py-8 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Project Created!</h3>
            <p className="text-sm text-gray-600 mb-2">{generatedData?.project.name}</p>
            <p className="text-xs text-gray-500">
              Your project has been generated with {generatedData?.entities?.length} entities, {generatedData?.pages?.length} pages, and {generatedData?.components?.length} components.
            </p>
            <Button
              onClick={handleClose}
              className="mt-4 w-full bg-gray-900 hover:bg-gray-800"
            >
              View Project
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}