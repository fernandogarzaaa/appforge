import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  FolderKanban,
  Database,
  FileCode,
  Sparkles,
  Plus,
  LayoutTemplate,
  Brain,
  ArrowRight,
  TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import Skeletons from '@/components/common/Skeletons';
import { useToast } from '@/components/ui/use-toast';
import AutonomousTrigger from '@/components/admin/AutonomousTrigger';

export default function DashboardNew() {
  const [ideaInput, setIdeaInput] = useState('');
  const { toast } = useToast();

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list('-updated_date', 6)
  });

  // Calculate stats
  const totalStats = projects.reduce(
    (acc, p) => ({
      entities: acc.entities + (p.stats?.entities_count || 0),
      pages: acc.pages + (p.stats?.pages_count || 0),
      components: acc.components + (p.stats?.components_count || 0)
    }),
    { entities: 0, pages: 0, components: 0 }
  );

  const handleGenerateApp = () => {
    if (ideaInput.trim()) {
      window.location.href = createPageUrl('AIAssistant') + '?auto_start=true&idea=' + encodeURIComponent(ideaInput);
    } else {
      toast({
        title: "Please describe your idea",
        description: "Tell us what you want to build",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-6 py-12 space-y-12">

        {/* Hero Section - Clean & Minimal */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="space-y-8"
        >
          {/* Welcome Header */}
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
              Build apps at the{' '}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                speed of thought
              </span>
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl">
              From idea to deployment in minutes. Describe what you want to build and let AI handle the rest.
            </p>
          </div>

          {/* AI Input Card - Primary Feature */}
          <Card className="border border-gray-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    Describe your idea
                  </h3>
                  <p className="text-sm text-gray-600">
                    AI will generate your app architecture, pages, and components
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <Textarea
                  value={ideaInput}
                  onChange={(e) => setIdeaInput(e.target.value)}
                  placeholder="e.g., Build a task management app with team collaboration and real-time updates"
                  className="min-h-[100px] text-base resize-none border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  rows={4}
                />
                <div className="flex items-center justify-end">
                  <Button
                    onClick={handleGenerateApp}
                    disabled={!ideaInput.trim()}
                    className="bg-blue-500 hover:bg-blue-600 text-white"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate App
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats Overview - Simplified */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {/* Projects Stat */}
          <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-600">Projects</p>
                  <p className="text-3xl font-bold text-gray-900">{projects.length}</p>
                  <div className="flex items-center gap-1 text-sm text-green-600">
                    <TrendingUp className="w-4 h-4" />
                    <span>Active</span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center">
                  <FolderKanban className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Entities Stat */}
          <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-600">Entities</p>
                  <p className="text-3xl font-bold text-gray-900">{totalStats.entities}</p>
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <span>Data models</span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                  <Database className="w-6 h-6 text-gray-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pages Stat */}
          <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-600">Pages</p>
                  <p className="text-3xl font-bold text-gray-900">{totalStats.pages}</p>
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <span>Views created</span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                  <FileCode className="w-6 h-6 text-gray-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions - Primary 3 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="space-y-6"
        >
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Quick Actions</h2>
            <p className="text-sm text-gray-600">Start building with these popular tools</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* New Project */}
            <Link to={createPageUrl('Projects') + '?new=true'}>
              <Card className="h-full border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="w-12 h-12 rounded-lg bg-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Plus className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                        New Project
                      </h3>
                      <p className="text-sm text-gray-600">
                        Start from scratch with a blank canvas
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            {/* AI Assistant */}
            <Link to={createPageUrl('AIAssistant')}>
              <Card className="h-full border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all cursor-pointer group">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="w-12 h-12 rounded-lg bg-purple-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Brain className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors">
                        AI Assistant
                      </h3>
                      <p className="text-sm text-gray-600">
                        Let AI design and build your app
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            {/* Templates */}
            <Link to={createPageUrl('TemplateMarketplace')}>
              <Card className="h-full border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all cursor-pointer group">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="w-12 h-12 rounded-lg bg-gray-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <LayoutTemplate className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-gray-700 transition-colors">
                        Browse Templates
                      </h3>
                      <p className="text-sm text-gray-600">
                        Choose from 100+ ready-to-use templates
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </motion.div>

        {/* Recent Projects */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="space-y-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Recent Projects</h2>
              <p className="text-sm text-gray-600">Continue where you left off</p>
            </div>
            <Link to={createPageUrl('Projects')}>
              <Button variant="ghost" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                View all
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Skeletons.ProjectCard key={i} />
              ))}
            </div>
          ) : projects.length === 0 ? (
            <Card className="border-2 border-dashed border-gray-300 shadow-none">
              <CardContent className="p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <FolderKanban className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No projects yet
                </h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  Get started by creating your first project
                </p>
                <Link to={createPageUrl('Projects') + '?new=true'}>
                  <Button className="bg-blue-500 hover:bg-blue-600 text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Project
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.slice(0, 6).map((project) => (
                <ProjectCardMinimal key={project.id} project={project} />
              ))}
            </div>
          )}
        </motion.div>

        {/* Explore More Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <Card className="border border-gray-200 bg-gradient-to-br from-gray-50 to-white">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-gray-900">
                    Explore more capabilities
                  </h3>
                  <p className="text-gray-600">
                    Discover workflows, integrations, quantum computing, and more
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link to={createPageUrl('WorkflowBuilder')}>
                    <Button variant="outline" className="border-gray-300 hover:border-gray-400">
                      Workflows
                    </Button>
                  </Link>
                  <Link to={createPageUrl('Integrations')}>
                    <Button variant="outline" className="border-gray-300 hover:border-gray-400">
                      Integrations
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Autonomous Control Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
        >
          <AutonomousTrigger />
        </motion.div>

      </div >
    </div >
  );
}

// Minimal Project Card Component
function ProjectCardMinimal({ project }) {
  const stats = project.stats || {};

  return (
    <Link to={createPageUrl('ProjectDetail', { id: project.id })}>
      <Card className="h-full border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group">
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Project Icon & Name */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <FolderKanban className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {project.name || 'Untitled Project'}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {new Date(project.updated_date || project.created_date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Project Stats */}
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Database className="w-4 h-4" />
                <span>{stats.entities_count || 0}</span>
              </div>
              <div className="flex items-center gap-1">
                <FileCode className="w-4 h-4" />
                <span>{stats.pages_count || 0}</span>
              </div>
            </div>

            {/* Description if available */}
            {project.description && (
              <p className="text-sm text-gray-600 line-clamp-2">
                {project.description}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
