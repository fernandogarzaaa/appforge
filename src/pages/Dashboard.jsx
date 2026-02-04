import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { quantumService } from '@/api/appforge';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  FolderKanban, Database, FileCode, Component, Sparkles, Plus, Zap, 
  ShieldCheck, Rocket, Users, Globe, Smartphone, Brain, LayoutTemplate,
  Code
} from 'lucide-react';
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
      gradient: 'from-green-500 to-emerald-500',
    },
  ];

  const capabilities = [
    { icon: Code, label: 'Bot Builder', href: createPageUrl('BotBuilder'), color: 'text-blue-600 bg-blue-50' },
    { icon: Rocket, label: 'Workflows', href: createPageUrl('WorkflowBuilder'), color: 'text-purple-600 bg-purple-50' },
    { icon: Brain, label: 'AI/ML', href: createPageUrl('MLIntegration'), color: 'text-pink-600 bg-pink-50' },
    { icon: Globe, label: 'DeFi Hub', href: createPageUrl('DeFiHub'), color: 'text-green-600 bg-green-50' },
    { icon: ShieldCheck, label: 'Security', href: createPageUrl('Security'), color: 'text-red-600 bg-red-50' },
    { icon: Code, label: 'Observability', href: createPageUrl('Observability'), color: 'text-orange-600 bg-orange-50' },
  ];

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
    },
  ];

  const HeroSection = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold text-cyan-700 bg-cyan-100/50 backdrop-blur-sm border border-cyan-200/50">
            ✨ Spectrum Journey · Beginner → Quantum
          </div>
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 bg-clip-text text-transparent leading-tight">
            Build apps at warp speed
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl">
            From zero to quantum. One prompt away from production.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to={createPageUrl('Projects') + '?new=true'}>
              <Button className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white shadow-xl shadow-cyan-500/30 rounded-xl px-6 h-11">
                <Plus className="w-4 h-4 mr-2" />
                New Project
              </Button>
            </Link>
            <Link to={createPageUrl('AIAssistant')}>
              <Button variant="outline" className="border-white/30 backdrop-blur-sm hover:bg-white/10 hover:border-white/50 rounded-xl px-6 h-11">
                <Sparkles className="w-4 h-4 mr-2" />
                Try AI Builder
              </Button>
            </Link>
          </div>
        </div>
        <div className="rounded-2xl backdrop-blur-md bg-white/30 dark:bg-slate-900/30 border border-white/30 dark:border-white/10 p-6 shadow-2xl shadow-blue-500/10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">Capability Ladder</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Unlock as you grow</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 backdrop-blur-sm border border-cyan-200/30 dark:border-cyan-500/30">Starter</span>
            <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-700 dark:text-blue-300 backdrop-blur-sm border border-blue-200/30 dark:border-blue-500/30">Pro</span>
            <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-700 dark:text-purple-300 backdrop-blur-sm border border-purple-200/30 dark:border-purple-500/30">Quantum</span>
          </div>
        </div>
      </div>

      <div className="backdrop-blur-md bg-white/40 dark:bg-slate-900/40 border border-white/30 dark:border-white/10 rounded-2xl p-6 shadow-2xl shadow-blue-500/5">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Describe your idea</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">AI will craft your app in minutes</p>
          </div>
        </div>
        <div className="space-y-3">
          <Textarea
            value={ideaInput}
            onChange={(e) => setIdeaInput(e.target.value)}
            placeholder="e.g., 'Build a CRM for real estate with lead tracking' or 'Create a fitness app with workout plans'"
            className="min-h-[100px] rounded-xl text-base px-5 py-4 border border-white/30 dark:border-white/10 backdrop-blur-sm bg-white/50 dark:bg-slate-900/50 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30 resize-none shadow-sm placeholder:text-gray-500 dark:placeholder:text-gray-400"
            rows={4}
          />
          <div className="flex justify-end">
            <Button
              onClick={() => {
                if (ideaInput.trim()) {
                  window.location.href = createPageUrl('AIAssistant') + '?auto_start=true&idea=' + encodeURIComponent(ideaInput);
                }
              }}
              disabled={!ideaInput.trim()}
              className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white rounded-xl shadow-lg shadow-cyan-500/30 disabled:opacity-50 font-medium px-6 h-11"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Generate App
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );

  const SmartRecommendations = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Quick Start Paths</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300">Launch your next project in minutes</p>
        </div>
        <Badge className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white border-0 backdrop-blur-sm">
          AI-Powered
        </Badge>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
         {quickActions.map((action, idx) => (
           <motion.div
             key={action.title}
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.3, delay: 0.1 + idx * 0.05 }}
           >
             <Link to={action.href}>
               <div className="h-full backdrop-blur-md bg-white/40 dark:bg-slate-900/40 border border-white/30 dark:border-white/10 hover:border-white/50 dark:hover:border-white/20 rounded-2xl hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer group p-6 space-y-4">
                 <div className="flex items-start justify-between">
                   <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                     <action.icon className="w-6 h-6 text-white" />
                   </div>
                   {action.badge && (
                     <Badge className="bg-cyan-500/40 text-cyan-700 dark:text-cyan-300 border border-cyan-300/50 backdrop-blur-sm text-xs">
                       {action.badge}
                     </Badge>
                   )}
                 </div>
                 <div>
                   <h3 className="font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                     {action.title}
                   </h3>
                   <p className="text-sm text-gray-600 dark:text-gray-300">
                     {action.description}
                   </p>
                 </div>
               </div>
             </Link>
           </motion.div>
         ))}
       </div>
    </motion.div>
  );

  const CapabilityDiscovery = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Explore Capabilities</h2>
        <p className="text-sm text-gray-600 dark:text-gray-300">AI, Workflows, Security, and more</p>
      </div>
      <div className="backdrop-blur-md bg-white/40 dark:bg-slate-900/40 border border-white/30 dark:border-white/10 rounded-2xl p-6 shadow-xl shadow-blue-500/5">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {capabilities.map((cap, idx) => (
            <Link key={cap.label} to={cap.href}>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2, delay: 0.3 + idx * 0.05 }}
                className="group"
              >
                <div className="flex flex-col items-center gap-3 p-4 rounded-xl hover:bg-white/20 dark:hover:bg-slate-800/30 transition-all cursor-pointer backdrop-blur-sm">
                  <div className={`w-12 h-12 rounded-xl ${cap.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <cap.icon className="w-6 h-6" />
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 text-center group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                    {cap.label}
                  </span>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      </div>
    </motion.div>
  );

  const OnboardingTour = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Get Started</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300">Three steps to launch in 15 minutes</p>
        </div>
        <Badge className="bg-cyan-500/40 text-cyan-700 dark:text-cyan-300 border border-cyan-300/50 backdrop-blur-sm">15 min</Badge>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
         {onboardingSteps.map((step, idx) => (
           <Link key={step.title} to={step.href}>
             <div className="h-full backdrop-blur-md bg-white/40 dark:bg-slate-900/40 border border-white/30 dark:border-white/10 hover:border-white/50 dark:hover:border-white/20 rounded-2xl p-6 space-y-3 hover:shadow-lg transition">
               <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/30 to-blue-500/30 text-cyan-700 dark:text-cyan-300 flex items-center justify-center">
                 <step.icon className="w-6 h-6" />
               </div>
               <div>
                 <div className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 mb-1">Step {idx + 1}</div>
                 <h3 className="font-semibold text-gray-900 dark:text-white">{step.title}</h3>
                 <p className="text-sm text-gray-600 dark:text-gray-300">{step.description}</p>
               </div>
               <Button variant="ghost" className="px-0 text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300">
                 Start →
               </Button>
             </div>
           </Link>
         ))}
       </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 dark:from-slate-950 via-white dark:via-slate-900 to-cyan-50/30 dark:to-cyan-950/10">
      <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-12">
        <HeroSection />
        <SmartRecommendations />
        <OnboardingTour />

        {/* Stats Overview */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-12"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Your Workspace</h2>
            <Link to={createPageUrl('Projects') + '?new=true'}>
              <Button className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white shadow-lg shadow-cyan-500/30 rounded-xl px-6 h-11">
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

        <CapabilityDiscovery />

        {/* Recent Projects */}
         <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.5, delay: 0.4 }}
           className="mb-12"
         >
           <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Recent Projects</h2>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Skeletons.ProjectCard key={i} />
              ))}
            </div>
          ) : projects.length === 0 ? (
            <div className="backdrop-blur-md bg-white/40 dark:bg-slate-900/40 border-2 border-dashed border-white/40 dark:border-white/10 rounded-2xl p-12 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-500/30 to-blue-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FolderKanban className="w-8 h-8 text-cyan-600 dark:text-cyan-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No projects yet</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-md mx-auto">
                Create your first project with our powerful AI builder
              </p>
              <Link to={createPageUrl('Projects') + '?new=true'}>
                <Button className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white shadow-lg shadow-cyan-500/30 rounded-xl px-6 h-11">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Project
                </Button>
              </Link>
            </div>
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
            <div className="backdrop-blur-md bg-white/40 dark:bg-slate-900/40 border border-white/30 dark:border-white/10 rounded-2xl shadow-2xl shadow-cyan-500/10 overflow-hidden">
              <div className="bg-gradient-to-r from-cyan-600 to-blue-600 p-6 text-white">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                    <Zap className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Quantum Computing</h2>
                    <p className="text-cyan-100 text-sm">
                      Harness quantum power for your applications
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-6">
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