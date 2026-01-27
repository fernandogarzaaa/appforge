import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { FolderKanban, Database, FileCode, Component, ArrowRight, Sparkles, Plus, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import StatCard from '@/components/dashboard/StatCard';
import ProjectCard from '@/components/dashboard/ProjectCard';
import EmptyState from '@/components/common/EmptyState';
import { motion } from 'framer-motion';

export default function Dashboard() {
  const [ideaInput, setIdeaInput] = useState('');

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list('-updated_date', 6),
  });

  const totalStats = projects.reduce(
    (acc, p) => ({
      entities: acc.entities + (p.stats?.entities_count || 0),
      pages: acc.pages + (p.stats?.pages_count || 0),
      components: acc.components + (p.stats?.components_count || 0),
    }),
    { entities: 0, pages: 0, components: 0 }
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Welcome Section */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15 }}
        className="mb-6"
      >
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          What do you want to create today?
        </h1>
        <p className="text-base text-gray-600 mb-6">
          Describe your idea and we'll help you build it
        </p>

        {/* Input Box */}
        <div className="max-w-3xl">
          <div className="relative">
            <Textarea
              value={ideaInput}
              onChange={(e) => setIdeaInput(e.target.value)}
              placeholder="Type your idea here... (e.g., 'Create a task management app' or 'Build a weather dashboard')"
              className="min-h-[100px] rounded-xl text-base px-5 py-4 pr-28 bg-white border-2 border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 resize-none shadow-sm"
              rows={3}
            />
            <Button
              onClick={() => {
                if (ideaInput.trim()) {
                  window.location.href = createPageUrl('Projects') + '?new=true&idea=' + encodeURIComponent(ideaInput);
                }
              }}
              disabled={!ideaInput.trim()}
              className="absolute right-3 bottom-3 h-11 px-5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg shadow-lg"
            >
              <Send className="w-4 h-4 mr-2" />
              Create
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-6"
      >
        <StatCard
          title="Total Projects"
          value={projects.length}
          icon={FolderKanban}
          gradient="bg-gradient-to-br from-indigo-500 to-purple-600"
          change="+12%"
          changeType="increase"
        />
        <StatCard
          title="Entities"
          value={totalStats.entities}
          icon={Database}
          gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
          change="+8%"
          changeType="increase"
        />
        <StatCard
          title="Pages"
          value={totalStats.pages}
          icon={FileCode}
          gradient="bg-gradient-to-br from-amber-500 to-orange-600"
          change="+5%"
          changeType="increase"
        />
        <StatCard
          title="Components"
          value={totalStats.components}
          icon={Component}
          gradient="bg-gradient-to-br from-pink-500 to-rose-600"
          change="+15%"
          changeType="increase"
        />
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15 }}
        className="bg-gray-900 rounded-xl p-5 mb-6 text-white"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold">AI-Powered Development</h2>
              <p className="text-white/60 text-[13px]">
                Build features faster with AI assistance
              </p>
            </div>
          </div>
          <Link to={createPageUrl('Projects') + '?new=true'}>
            <Button className="bg-white text-gray-900 hover:bg-gray-100 rounded-lg h-9 px-4 text-[13px] font-medium">
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              New Project
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* Recent Projects */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900">Recent Projects</h2>
          <Link to={createPageUrl('Projects')}>
            <Button variant="ghost" className="text-gray-600 hover:text-gray-900 hover:bg-gray-100/70 rounded-lg h-8 text-[13px]">
              View all
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-9 h-9 bg-gray-200 rounded-lg" />
                  <div>
                    <div className="h-3 w-20 bg-gray-200 rounded mb-1.5" />
                    <div className="h-2.5 w-14 bg-gray-100 rounded" />
                  </div>
                </div>
                <div className="h-8 bg-gray-100 rounded mb-3" />
                <div className="h-7 bg-gray-50 rounded" />
              </div>
            ))}
          </div>
        ) : projects.length === 0 ? (
          <EmptyState
            icon={FolderKanban}
            title="No projects yet"
            description="Create your first project to get started building amazing applications."
            actionLabel="Create Project"
            onAction={() => window.location.href = createPageUrl('Projects') + '?new=true'}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {projects.map((project, index) => (
              <ProjectCard key={project.id} project={project} index={index} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}