import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Sparkles, FolderTree, FileCode, Database, Rocket, CheckCircle2, Code } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ProjectScaffolder({ onProjectCreated }) {
  const [description, setDescription] = useState('');
  const [projectName, setProjectName] = useState('');
  const [framework, setFramework] = useState('auto');
  const [generating, setGenerating] = useState(false);
  const [creating, setCreating] = useState(false);
  const [scaffold, setScaffold] = useState(null);
  const [activeTab, setActiveTab] = useState('entities');

  const handleGenerate = async () => {
    if (!description.trim()) {
      alert('Please describe your project');
      return;
    }

    setGenerating(true);
    try {
      const response = await base44.functions.invoke('generateProjectScaffold', {
        project_description: description,
        framework_preference: framework === 'auto' ? null : framework
      });

      setScaffold(response.data.scaffold);
      setProjectName(response.data.scaffold.project.name);
    } catch (error) {
      console.error('Failed to generate scaffold:', error);
      alert('Failed to generate project: ' + error.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleCreateProject = async () => {
    if (!projectName.trim()) {
      alert('Please enter a project name');
      return;
    }

    setCreating(true);
    try {
      const response = await base44.functions.invoke('createProjectFromScaffold', {
        scaffold: scaffold,
        project_name: projectName
      });

      onProjectCreated?.(response.data.project_id);
      alert('Project created successfully! Check the results below.');
    } catch (error) {
      console.error('Failed to create project:', error);
      alert('Failed to create project: ' + error.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            AI Project Scaffolder
          </CardTitle>
          <p className="text-sm text-gray-600">
            Describe your project and AI will generate the complete structure
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-2 block">
              Project Description
            </label>
            <Textarea
              placeholder="e.g., A task management app with user authentication, real-time updates, and team collaboration features. Users can create projects, assign tasks, set deadlines, and track progress."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[120px]"
              disabled={generating}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">
                Framework Preference
              </label>
              <select
                value={framework}
                onChange={(e) => setFramework(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                disabled={generating}
              >
                <option value="auto">Auto-detect</option>
                <option value="react">React + Tailwind</option>
                <option value="next">Next.js</option>
                <option value="vue">Vue.js</option>
              </select>
            </div>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={generating || !description.trim()}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating Structure...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Project Structure
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Generated Scaffold Preview */}
      <AnimatePresence>
        {scaffold && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Project Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FolderTree className="w-5 h-5 text-blue-600" />
                  Generated Project: {scaffold.project.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700">{scaffold.project.description}</p>
                
                <div className="flex flex-wrap gap-2">
                  {scaffold.project.tech_stack?.map(tech => (
                    <Badge key={tech} variant="outline">{tech}</Badge>
                  ))}
                  <Badge className="bg-green-600">
                    {scaffold.project.estimated_build_time}
                  </Badge>
                </div>

                <div className="grid grid-cols-4 gap-4 pt-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <Database className="w-6 h-6 mx-auto mb-1 text-blue-600" />
                    <div className="text-2xl font-bold">{scaffold.entities?.length || 0}</div>
                    <div className="text-xs text-gray-600">Entities</div>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <FileCode className="w-6 h-6 mx-auto mb-1 text-purple-600" />
                    <div className="text-2xl font-bold">{scaffold.pages?.length || 0}</div>
                    <div className="text-xs text-gray-600">Pages</div>
                  </div>
                  <div className="text-center p-3 bg-pink-50 rounded-lg">
                    <Code className="w-6 h-6 mx-auto mb-1 text-pink-600" />
                    <div className="text-2xl font-bold">{scaffold.components?.length || 0}</div>
                    <div className="text-xs text-gray-600">Components</div>
                  </div>
                  <div className="text-center p-3 bg-orange-50 rounded-lg">
                    <Rocket className="w-6 h-6 mx-auto mb-1 text-orange-600" />
                    <div className="text-2xl font-bold">{scaffold.functions?.length || 0}</div>
                    <div className="text-xs text-gray-600">Functions</div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">
                    Project Name
                  </label>
                  <Input
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="Enter project name"
                  />
                </div>

                <Button
                  onClick={handleCreateProject}
                  disabled={creating || !projectName.trim()}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600"
                >
                  {creating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating Project...
                    </>
                  ) : (
                    <>
                      <Rocket className="w-4 h-4 mr-2" />
                      Create Project from Scaffold
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Detailed Structure */}
            <Card>
              <CardHeader>
                <CardTitle>Project Structure Details</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid grid-cols-5 w-full">
                    <TabsTrigger value="entities">Entities</TabsTrigger>
                    <TabsTrigger value="pages">Pages</TabsTrigger>
                    <TabsTrigger value="components">Components</TabsTrigger>
                    <TabsTrigger value="functions">Functions</TabsTrigger>
                    <TabsTrigger value="setup">Setup</TabsTrigger>
                  </TabsList>

                  <TabsContent value="entities" className="space-y-3 mt-4">
                    {scaffold.entities?.map((entity, idx) => (
                      <div key={idx} className="p-4 bg-gray-50 rounded-lg border">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-gray-900">{entity.name}</h4>
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{entity.rationale}</p>
                        <pre className="text-xs bg-white p-2 rounded overflow-auto max-h-40">
                          {JSON.stringify(entity.schema, null, 2)}
                        </pre>
                      </div>
                    ))}
                  </TabsContent>

                  <TabsContent value="pages" className="space-y-3 mt-4">
                    {scaffold.pages?.map((page, idx) => (
                      <div key={idx} className="p-4 bg-gray-50 rounded-lg border">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-semibold text-gray-900">{page.name}</h4>
                            <Badge variant="outline" className="text-xs mt-1">{page.route}</Badge>
                          </div>
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{page.description}</p>
                        <pre className="text-xs bg-white p-2 rounded overflow-auto max-h-60">
                          {page.code}
                        </pre>
                      </div>
                    ))}
                  </TabsContent>

                  <TabsContent value="components" className="space-y-3 mt-4">
                    {scaffold.components?.map((component, idx) => (
                      <div key={idx} className="p-4 bg-gray-50 rounded-lg border">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-gray-900">{component.name}</h4>
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{component.usage}</p>
                        <pre className="text-xs bg-white p-2 rounded overflow-auto max-h-60">
                          {component.code}
                        </pre>
                      </div>
                    ))}
                  </TabsContent>

                  <TabsContent value="functions" className="space-y-3 mt-4">
                    {scaffold.functions?.map((func, idx) => (
                      <div key={idx} className="p-4 bg-gray-50 rounded-lg border">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-semibold text-gray-900">{func.name}</h4>
                            <Badge variant="outline" className="text-xs mt-1">{func.endpoint}</Badge>
                          </div>
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{func.description}</p>
                        <pre className="text-xs bg-white p-2 rounded overflow-auto max-h-60">
                          {func.code}
                        </pre>
                      </div>
                    ))}
                  </TabsContent>

                  <TabsContent value="setup" className="mt-4">
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h4 className="font-semibold text-blue-900 mb-3">Setup Instructions</h4>
                      <ol className="space-y-2">
                        {scaffold.setup_instructions?.map((step, idx) => (
                          <li key={idx} className="flex gap-2">
                            <span className="font-semibold text-blue-600">{idx + 1}.</span>
                            <span className="text-gray-700">{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}