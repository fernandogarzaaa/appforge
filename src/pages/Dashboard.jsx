import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { quantumService } from '@/api/appforge';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  FolderKanban, Database, FileCode, Component, Sparkles, Plus, Zap,
  ShieldCheck, Rocket, Users, Smartphone, Brain, LayoutTemplate,
  Code, Activity } from
'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import StatCard from '@/components/dashboard/StatCard';
import ProjectCard from '@/components/dashboard/ProjectCard';
import { motion } from 'framer-motion';
import Skeletons from '@/components/common/Skeletons';
import { useToast } from '@/components/ui/use-toast';
import QuantumCircuitDisplay from '@/components/QuantumCircuitDisplay';
import QuantumCircuitVisualizer from '@/components/QuantumCircuitVisualizer';
import QuantumCircuitEducation from '@/components/QuantumCircuitEducation';

export default function Dashboard() {
  const [ideaInput, setIdeaInput] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);

  React.useEffect(() => {
    base44.auth.isAuthenticated().then(setIsAuthenticated);
  }, []);

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list('-updated_date', 6)
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
      components: acc.components + (p.stats?.components_count || 0)
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
    title: 'AGI Studio',
    description: 'Create autonomous AI assistants',
    icon: Brain,
    href: createPageUrl('AGIStudio'),
    gradient: 'from-purple-600 to-pink-600',
    badge: 'AGI'
  },
  {
    title: 'Mobile App Studio',
    description: 'Create iOS & Android apps',
    icon: Smartphone,
    href: createPageUrl('MobileStudio'),
    gradient: 'from-green-500 to-emerald-500'
  }];


  const [user, setUser] = React.useState(null);

  React.useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const capabilities = [
  { icon: Sparkles, label: 'AI Templates', href: createPageUrl('AITemplates'), color: 'text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-950/50' },
  { icon: Brain, label: 'Superior AI', href: createPageUrl('SuperiorAIStudio'), color: 'text-pink-600 bg-pink-50 dark:text-pink-400 dark:bg-pink-950/50' },
  { icon: ShieldCheck, label: 'Code Review', href: createPageUrl('CodeReview'), color: 'text-cyan-600 bg-cyan-50 dark:text-cyan-400 dark:bg-cyan-950/50' },
  { icon: Rocket, label: 'AI Deploy', href: createPageUrl('AIDeployment'), color: 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-950/50' },
  { icon: Brain, label: 'AI Agents', href: createPageUrl('CustomAgentStudio'), color: 'text-indigo-600 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-950/50' },
  { icon: Code, label: 'Observability', href: createPageUrl('Observability'), color: 'text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-950/50' }];

  const adminCapabilities = user?.role === 'admin' ? [
    { icon: ShieldCheck, label: 'Admin Dashboard', href: createPageUrl('AdminDashboard'), color: 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950/50' },
    { icon: ShieldCheck, label: 'Security Center', href: createPageUrl('SecurityCenter'), color: 'text-red-700 bg-red-100 dark:text-red-300 dark:bg-red-900/50' },
    { icon: Users, label: 'User Management', href: createPageUrl('AdminUserManagement'), color: 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950/50' },
    { icon: Brain, label: 'AI Control', href: createPageUrl('AdminAIControl'), color: 'text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-950/50' },
    { icon: Rocket, label: 'Deployments', href: createPageUrl('AdminDeployments'), color: 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-950/50' },
    { icon: LayoutTemplate, label: 'Templates', href: createPageUrl('AdminTemplates'), color: 'text-indigo-600 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-950/50' },
    { icon: Activity, label: 'Analytics', href: createPageUrl('AdminAnalytics'), color: 'text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-950/50' }
  ] : [];


  const onboardingSteps = [
  {
    title: 'Start with a prompt',
    description: 'Describe your app and let AI draft the architecture.',
    icon: Sparkles,
    href: createPageUrl('AIAssistant')
  },
  {
    title: 'Connect your data',
    description: 'Model entities, permissions, and workflows in minutes.',
    icon: Database,
    href: createPageUrl('EntityDesigner')
  },
  {
    title: 'Ship and monitor',
    description: 'Deploy with confidence and watch performance live.',
    icon: Rocket,
    href: createPageUrl('Deployments')
  }];


  const HeroSection = () =>
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    className="space-y-6">

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold text-indigo-700 bg-indigo-100">
            Spectrum Journey · Beginner → Quantum
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 via-indigo-900 to-purple-900 dark:from-gray-100 dark:via-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
            Build beautiful apps at the speed of thought
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl">
            AppForge adapts to you. Start simple, unlock advanced power, and reach quantum-grade workflows when you need them.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to={createPageUrl('Projects') + '?new=true'}>
              <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/30">
                <Plus className="w-4 h-4 mr-2" />
                New Project
              </Button>
            </Link>
            <Link to={createPageUrl('AIAssistant')}>
              <Button variant="outline" className="border-indigo-200 text-indigo-700 hover:bg-indigo-50">
                <Sparkles className="w-4 h-4 mr-2" />
                Try AI Builder
              </Button>
            </Link>
          </div>
        </div>
        <div className="flex flex-col items-start gap-3 rounded-2xl border border-indigo-100 bg-white/80 p-5 shadow-xl shadow-indigo-500/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Capability Ladder</p>
              <p className="text-xs text-gray-500">Unlock advanced features as you grow</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <span className="px-2 py-1 rounded-full bg-indigo-50 text-indigo-700">Starter</span>
            <span className="px-2 py-1 rounded-full bg-purple-50 text-purple-700">Pro</span>
            <span className="px-2 py-1 rounded-full bg-cyan-50 text-cyan-700">Quantum</span>
          </div>
        </div>
      </div>

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
            rows={4} />

            <Button
            onClick={() => {
              if (ideaInput.trim()) {
                window.location.href = createPageUrl('AIAssistant') + '?auto_start=true&idea=' + encodeURIComponent(ideaInput);
              }
            }}
            disabled={!ideaInput.trim()}
            className="absolute right-3 bottom-3 h-12 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl shadow-lg shadow-indigo-500/30 disabled:opacity-50 font-medium">

              <Sparkles className="w-5 h-5 mr-2" />
              Generate App
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>;


  const SmartRecommendations = () =>
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay: 0.1 }}
    className="space-y-6">

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Smart Recommendations</h2>
          <p className="text-sm text-gray-600">Personalized paths to launch your next build faster</p>
        </div>
        <Badge className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-0">
          Powered by Spectrum
        </Badge>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickActions.map((action, idx) =>
      <motion.div
        key={action.title}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 + idx * 0.05 }}>

            <Link to={action.href}>
              <Card className="h-full hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer border-2 hover:border-indigo-300 group">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                      <action.icon className="w-6 h-6 text-white" />
                    </div>
                    {action.badge &&
                <Badge className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-0">
                        {action.badge}
                      </Badge>
                }
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
      )}
      </div>
    </motion.div>;


  const CapabilityDiscovery = () =>
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay: 0.3 }}
    className="space-y-6">

      <div>
        <h2 className="text-2xl font-bold text-gray-900">Capability Discovery</h2>
        <p className="text-sm text-gray-600">Explore everything AppForge can do — from AI to observability</p>
      </div>
      <Card className="border-2 shadow-xl">
        <CardContent className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {capabilities.map((cap, idx) =>
          <Link key={cap.label} to={cap.href}>
                <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2, delay: 0.3 + idx * 0.05 }}
              className="group">

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
          )}
          </div>
        </CardContent>
      </Card>
    </motion.div>;


  const OnboardingTour = () =>
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay: 0.2 }}
    className="space-y-6">

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Onboarding Tour</h2>
          <p className="text-sm text-gray-600">Three quick wins to go from idea to launch</p>
        </div>
        <Badge className="bg-slate-100 text-slate-700 border-0">Estimated 15 min</Badge>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {onboardingSteps.map((step, idx) =>
      <Link key={step.title} to={step.href}>
            <Card className="h-full border border-slate-200 hover:border-indigo-300 hover:shadow-lg transition">
              <CardContent className="p-6 space-y-3">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
                  <step.icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{step.title}</h3>
                  <p className="text-sm text-gray-600">{step.description}</p>
                </div>
                <Button variant="ghost" className="px-0 text-indigo-600">
                  Start step {idx + 1}
                </Button>
              </CardContent>
            </Card>
          </Link>
      )}
      </div>
    </motion.div>;


  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/30">
      <div className="mx-auto p-8 max-w-[1600px] space-y-12">
        <HeroSection />
        <SmartRecommendations />
        <OnboardingTour />

        {/* Stats Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-12">

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
              changeType="increase" />

            <StatCard
              title="Entities"
              value={totalStats.entities}
              icon={Database}
              gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
              change="+8%"
              changeType="increase" />

            <StatCard
              title="Pages"
              value={totalStats.pages}
              icon={FileCode}
              gradient="bg-gradient-to-br from-amber-500 to-orange-600"
              change="+5%"
              changeType="increase" />

            <StatCard
              title="Components"
              value={totalStats.components}
              icon={Component}
              gradient="bg-gradient-to-br from-pink-500 to-rose-600"
              change="+15%"
              changeType="increase" />

            {isAuthenticated &&
            <StatCard
              title="Quantum"
              value={isLoadingCircuits ? '...' : quantumCircuits.length}
              icon={Zap}
              gradient="bg-gradient-to-br from-cyan-500 to-blue-600"
              change="New"
              changeType="increase" />

            }
            <StatCard
              title="Total Users"
              value="2.4k"
              icon={Users}
              gradient="bg-gradient-to-br from-violet-500 to-purple-600"
              change="+24%"
              changeType="increase" />

          </div>
        </motion.div>

        <CapabilityDiscovery />

        {/* Admin Controls */}
        {user?.role === 'admin' && adminCapabilities.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Admin Controls</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">System administration and management</p>
            </div>
            <Card className="border-2 border-red-200 dark:border-red-800 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20 dark:bg-slate-900/50">
              <CardContent className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {adminCapabilities.map((cap, idx) => (
                    <Link key={cap.label} to={cap.href}>
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.2, delay: 0.35 + idx * 0.05 }}
                        className="group">
                        <div className="flex flex-col items-center gap-3 p-4 rounded-xl hover:bg-white dark:hover:bg-slate-800 transition-all cursor-pointer border-2 border-transparent hover:border-red-200 dark:hover:border-red-700">
                          <div className={`w-12 h-12 rounded-xl ${cap.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                            <cap.icon className="w-6 h-6" />
                          </div>
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 text-center group-hover:text-gray-900 dark:group-hover:text-gray-100">
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
        )}

        {/* Recent Projects */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mb-12">

          <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Projects</h2>
          {isLoading ?
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) =>
            <Skeletons.ProjectCard key={i} />
            )}
            </div> :
          projects.length === 0 ?
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
            </Card> :

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project, index) =>
            <ProjectCard key={project.id} project={project} index={index} />
            )}
            </div>
          }
        </motion.div>

        {/* Quantum Computing - For Authenticated Users */}
        {isAuthenticated &&
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}>

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
                  loading={isLoadingCircuits} />

                  
                  {/* Quantum Circuit Visualizer */}
                  <QuantumCircuitVisualizer
                  initialQubits={3}
                  onCircuitChange={(circuit) => {
                    console.log('Circuit updated:', circuit);
                  }} />

                </div>

                {/* Quantum Education Section */}
                <QuantumCircuitEducation />
              </CardContent>
            </Card>
          </motion.div>
        }
      </div>
    </div>);

}