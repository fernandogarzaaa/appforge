import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { FolderKanban, Database, FileCode, Component, ArrowRight, Sparkles, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import StatCard from '@/components/dashboard/StatCard';
import ProjectCard from '@/components/dashboard/ProjectCard';
import EmptyState from '@/components/common/EmptyState';
import { motion } from 'framer-motion';

export default function Dashboard() {
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
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Welcome Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back 👋
        </h1>
        <p className="text-gray-500">
          Here's an overview of your projects and recent activity.
        </p>
      </motion.div>

      {/* Stats Grid */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
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
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl p-6 mb-8 text-white"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">AI-Powered Development</h2>
              <p className="text-white/80 text-sm">
                Use our AI assistant to build features faster
              </p>
            </div>
          </div>
          <Link to={createPageUrl('Projects') + '?new=true'}>
            <Button className="bg-white text-indigo-600 hover:bg-white/90 rounded-xl h-11 px-6">
              <Plus className="w-4 h-4 mr-2" />
              Create New Project
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* Recent Projects */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Recent Projects</h2>
          <Link to={createPageUrl('Projects')}>
            <Button variant="ghost" className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-xl">
              View all
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-xl" />
                  <div>
                    <div className="h-4 w-24 bg-gray-200 rounded mb-2" />
                    <div className="h-3 w-16 bg-gray-100 rounded" />
                  </div>
                </div>
                <div className="h-10 bg-gray-100 rounded mb-4" />
                <div className="h-8 bg-gray-50 rounded" />
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project, index) => (
              <ProjectCard key={project.id} project={project} index={index} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}