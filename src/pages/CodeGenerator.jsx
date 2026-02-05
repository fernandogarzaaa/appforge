import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkles, Database, FileCode, Code2, ArrowRight } from 'lucide-react';
import CodeGeneratorPanel from '@/components/ai/CodeGeneratorPanel';
import { motion } from 'framer-motion';

export default function CodeGenerator() {
  const [showGenerator, setShowGenerator] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [selectedPage, setSelectedPage] = useState(null);

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list('-updated_date', 10)
  });

  const { data: entities = [] } = useQuery({
    queryKey: ['entities'],
    queryFn: () => base44.asServiceRole.entities.Entity.list()
  });

  const { data: pages = [] } = useQuery({
    queryKey: ['pages'],
    queryFn: () => base44.asServiceRole.entities.Page.list()
  });

  const handleSelectEntity = (entity) => {
    setSelectedEntity(entity);
    setSelectedPage(null);
    setShowGenerator(true);
  };

  const handleSelectPage = (page) => {
    setSelectedPage(page);
    setSelectedEntity(null);
    setShowGenerator(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50">
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="w-8 h-8 text-purple-600" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              AI Code Generator
            </h1>
          </div>
          <p className="text-gray-600 text-lg">Generate boilerplate code for your entities and pages with one click</p>
        </motion.div>

        <Tabs defaultValue="entities" className="space-y-6">
          <TabsList className="bg-gradient-to-r from-purple-100 to-pink-100">
            <TabsTrigger value="entities" className="gap-2">
              <Database className="w-4 h-4" />
              Entities
            </TabsTrigger>
            <TabsTrigger value="pages" className="gap-2">
              <FileCode className="w-4 h-4" />
              Pages
            </TabsTrigger>
            <TabsTrigger value="projects" className="gap-2">
              <Code2 className="w-4 h-4" />
              Projects
            </TabsTrigger>
          </TabsList>

          {/* Entities Tab */}
          <TabsContent value="entities" className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold mb-2">Entity Code Generation</h2>
              <p className="text-gray-600 mb-6">Generate CRUD components, forms, or API endpoints for your entities</p>
            </div>

            {entities.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="p-12 text-center">
                  <Database className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">No entities found</p>
                  <p className="text-sm text-gray-500">Create entities in your project to generate code</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {entities.map((entity, idx) => (
                  <motion.div
                    key={entity.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Card className="h-full hover:shadow-lg hover:border-purple-300 transition-all cursor-pointer">
                      <CardHeader>
                        <CardTitle className="text-lg flex items-start justify-between">
                          <span>{entity.name}</span>
                          <Database className="w-5 h-5 text-purple-600" />
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-sm text-gray-600">{entity.description}</p>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="secondary">Entity</Badge>
                        </div>
                        <Button
                          onClick={() => handleSelectEntity(entity)}
                          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 group"
                        >
                          Generate Code
                          <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Pages Tab */}
          <TabsContent value="pages" className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold mb-2">Page Code Generation</h2>
              <p className="text-gray-600 mb-6">Generate page components, layouts, or templates</p>
            </div>

            {pages.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="p-12 text-center">
                  <FileCode className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">No pages found</p>
                  <p className="text-sm text-gray-500">Create pages in your project to generate code</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pages.map((page, idx) => (
                  <motion.div
                    key={page.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Card className="h-full hover:shadow-lg hover:border-purple-300 transition-all">
                      <CardHeader>
                        <CardTitle className="text-lg flex items-start justify-between">
                          <span>{page.name}</span>
                          <FileCode className="w-5 h-5 text-purple-600" />
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-sm text-gray-600">{page.description}</p>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="secondary">Page</Badge>
                        </div>
                        <Button
                          onClick={() => handleSelectPage(page)}
                          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 group"
                        >
                          Generate Code
                          <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Projects Tab */}
          <TabsContent value="projects" className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold mb-2">Projects</h2>
              <p className="text-gray-600 mb-6">Select a project to generate code for its entities and pages</p>
            </div>

            {projects.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="p-12 text-center">
                  <Code2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">No projects found</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {projects.map((project, idx) => (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Card className="h-full hover:shadow-lg hover:border-purple-300 transition-all">
                      <CardHeader>
                        <CardTitle className="text-lg">{project.icon} {project.name}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-sm text-gray-600">{project.description}</p>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div className="bg-gray-50 p-2 rounded">
                            <p className="font-semibold">{project.stats?.entities_count || 0}</p>
                            <p className="text-gray-600">Entities</p>
                          </div>
                          <div className="bg-gray-50 p-2 rounded">
                            <p className="font-semibold">{project.stats?.pages_count || 0}</p>
                            <p className="text-gray-600">Pages</p>
                          </div>
                          <div className="bg-gray-50 p-2 rounded">
                            <p className="font-semibold">{project.stats?.components_count || 0}</p>
                            <p className="text-gray-600">Components</p>
                          </div>
                        </div>
                        <Badge className={`bg-${project.color || 'gray'}-100 text-${project.color || 'gray'}-900`}>
                          {project.status}
                        </Badge>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Code Generator Panel */}
      <CodeGeneratorPanel
        isOpen={showGenerator}
        onClose={() => setShowGenerator(false)}
        entity={selectedEntity}
        page={selectedPage}
      />
    </div>
  );
}