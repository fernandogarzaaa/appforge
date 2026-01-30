import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { quantumService } from '@/api/appforge';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  FolderKanban, Database, FileCode, Component, ArrowRight, Sparkles, Plus, Zap, 
  ShieldCheck, Rocket, TrendingUp, Users, Globe, Smartphone, Brain, LayoutTemplate,
  Code, Activity, Coins, Blocks, Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import StatCard from '@/components/dashboard/StatCard';
import ProjectCard from '@/components/dashboard/ProjectCard';
import EmptyState from '@/components/common/EmptyState';
import { motion } from 'framer-motion';
import Skeletons from '@/components/common/Skeletons';
import { useToast } from '@/components/ui/use-toast';
import { useBackendAuth } from '@/contexts/BackendAuthContext';
import QuantumCircuitDisplay from '@/components/QuantumCircuitDisplay';
import QuantumCircuitVisualizer from '@/components/QuantumCircuitVisualizer';
import QuantumCircuitEducation from '@/components/QuantumCircuitEducation';

export default function Dashboard() {
  const [ideaInput, setIdeaInput] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();
  const { isAuthenticated } = useBackendAuth();

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list('-updated_date', 6),
  });

  // Fetch quantum circuits from backend if authenticated
  const { data: quantumCircuits = [], isLoading: isLoadingCircuits } = useQuery({
    queryKey: ['quantumCircuits'],
    queryFn: () => quantumService.listCircuits(),
    enabled: isAuthenticated, // Only fetch if authenticated with backend
    retry: 1,
    onError: (error) => {
      console.error('Failed to load quantum circuits:', error);
    }
  });

  const totalStats = projects.reduce(
    (acc, p) => ({
      entities: acc.entities + (p.stats?.entities_count || 0),
      pages: acc.pages + (p.stats?.pages_count || 0),
      components: acc.components + (p.stats?.components_count || 0),
    }),
    { entities: 0, pages: 0, components: 0 }
  );

  const quickActions = [
    {
      title: 'Start from Template',
      description: 'Browse 100+ ready-to-use templates',
      icon: LayoutTemplate,
      href: createPageUrl('TemplateMarketplace'),
      gradient: 'from-blue-500 to-cyan-500',
      badge: 'Popular'
    },
    {
      title: 'Build with AI',
      description: 'Let AI create your app from description',
      icon: Sparkles,
      href: createPageUrl('AIAssistant'),
      gradient: 'from-purple-500 to-pink-500',
      badge: 'New'
    },
    {
      title: 'Mobile App Studio',
      description: 'Create iOS & Android apps',
      icon: Smartphone,
      href: createPageUrl('MobileStudio'),
      gradient: 'from-green-500 to-emerald-500',
    },
    {
      title: 'NFT & Web3',
      description: 'Build blockchain applications',
      icon: Coins,
      href: createPageUrl('NFTStudio'),
      gradient: 'from-orange-500 to-red-500',
    },
  ];

  const capabilities = [
    { icon: Code, label: 'Bot Builder', href: createPageUrl('BotBuilder'), color: 'text-blue-600 bg-blue-50' },
    { icon: Rocket, label: 'Workflows', href: createPageUrl('WorkflowBuilder'), color: 'text-purple-600 bg-purple-50' },
    { icon: Brain, label: 'AI/ML', href: createPageUrl('MLIntegration'), color: 'text-pink-600 bg-pink-50' },
    { icon: Globe, label: 'DeFi Hub', href: createPageUrl('DeFiHub'), color: 'text-green-600 bg-green-50' },
    { icon: ShieldCheck, label: 'Security', href: createPageUrl('Security'), color: 'text-red-600 bg-red-50' },
    { icon: Activity, label: 'Observability', href: createPageUrl('Observability'), color: 'text-orange-600 bg-orange-50' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50/30">
      <div className="p-8 max-w-[1600px] mx-auto">
        {/* Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-indigo-900 to-purple-900 bg-clip-text text-transparent">
                Welcome to AppForge
              </h1>
              <p className="text-lg text-gray-600 mt-1">
                Build production-ready apps with AI, Web3, and Quantum computing
              </p>
            </div>
          </div>

          {/* AI Input Box */}
          <Card className="border-2 border-indigo-200/50 shadow-xl shadow-indigo-500/10 bg-gradient-to-br from-white to-indigo-50/30">
            <CardContent className="p-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">Describe your idea</h3>
                  <p className="text-sm text-gray-600">AI will help you build it in minutes</p>
                </div>
              </div>
              <div className="relative">
                <Textarea
                  value={ideaInput}
                  onChange={(e) => setIdeaInput(e.target.value)}
                  placeholder="e.g., 'Build a CRM for real estate with lead tracking and email automation' or 'Create a fitness tracking app with workout plans'"
                  className="min-h-[120px] rounded-xl text-base px-5 py-4 pr-32 border-2 border-indigo-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 resize-none shadow-sm"
                  rows={4}
                />
                <Button
                  onClick={() => {
                    if (ideaInput.trim()) {
                      window.location.href = createPageUrl('AIAssistant') + '?auto_start=true&idea=' + encodeURIComponent(ideaInput);
                    }
                  }}
                  disabled={!ideaInput.trim()}
                  className="absolute right-3 bottom-3 h-12 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl shadow-lg shadow-indigo-500/30 disabled:opacity-50 font-medium"
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  Generate App
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Start</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, idx) => (
              <motion.div
                key={action.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 + idx * 0.05 }}
              >
                <Link to={action.href}>
                  <Card className="h-full hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer border-2 hover:border-indigo-300 group">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                          <action.icon className="w-6 h-6 text-white" />
                        </div>
                        {action.badge && (
                          <Badge className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-0">
                            {action.badge}
                          </Badge>
                        )}
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">
                        {action.title}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {action.description}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Stats Overview */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-12"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Your Workspace</h2>
            <Link to={createPageUrl('Projects') + '?new=true'}>
              <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/30">
                <Plus className="w-4 h-4 mr-2" />
                New Project
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <StatCard
              title="Projects"
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
            {isAuthenticated && (
              <StatCard
                title="Quantum"
                value={isLoadingCircuits ? '...' : quantumCircuits.length}
                icon={Zap}
                gradient="bg-gradient-to-br from-cyan-500 to-blue-600"
                change="New"
                changeType="increase"
              />
            )}
            <StatCard
              title="Total Users"
              value="2.4k"
              icon={Users}
              gradient="bg-gradient-to-br from-violet-500 to-purple-600"
              change="+24%"
              changeType="increase"
            />
          </div>
        </motion.div>

        {/* Platform Capabilities */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Platform Capabilities</h2>
          <Card className="border-2 shadow-xl">
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {capabilities.map((cap, idx) => (
                  <Link key={cap.label} to={cap.href}>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.2, delay: 0.3 + idx * 0.05 }}
                      className="group"
                    >
                      <div className="flex flex-col items-center gap-3 p-4 rounded-xl hover:bg-gray-50 transition-all cursor-pointer">
                        <div className={`w-12 h-12 rounded-xl ${cap.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                          <cap.icon className="w-6 h-6" />
                        </div>
                        <span className="text-sm font-medium text-gray-700 text-center group-hover:text-gray-900">
                          {cap.label}
                        </span>
                      </div>
                    </motion.div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Projects */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Projects</h2>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Skeletons.ProjectCard key={i} />
              ))}
            </div>
          ) : projects.length === 0 ? (
            <Card className="border-2 border-dashed border-gray-300 shadow-none">
              <CardContent className="p-12 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <FolderKanban className="w-8 h-8 text-indigo-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No projects yet</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  Get started by creating your first project with our powerful no-code builder
                </p>
                <Link to={createPageUrl('Projects') + '?new=true'}>
                  <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/30">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Project
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project, index) => (
                <ProjectCard key={project.id} project={project} index={index} />
              ))}
            </div>
          )}
        </motion.div>

        {/* Quantum Computing - For Authenticated Users */}
        {isAuthenticated && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <Card className="border-2 shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-cyan-600 to-blue-600 p-6 text-white">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                    <Zap className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Quantum Computing</h2>
                    <p className="text-cyan-50 text-sm">
                      Harness quantum power for your applications
                    </p>
                  </div>
                </div>
              </div>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                  {/* Quantum Circuits Display */}
                  <QuantumCircuitDisplay 
                    data={quantumCircuits && quantumCircuits[0]}
                    loading={isLoadingCircuits}
                  />
                  
                  {/* Quantum Circuit Visualizer */}
                  <QuantumCircuitVisualizer 
                    initialQubits={3}
                    onCircuitChange={(circuit) => {
                      console.log('Circuit updated:', circuit);
                    }}
                  />
                </div>

                {/* Quantum Education Section */}
                <QuantumCircuitEducation />
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}