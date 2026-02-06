import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  Menu,
  X,
  FolderKanban,
  Sparkles,
  Zap,
  Code,
  ShieldCheck,
  Activity,
  LayoutTemplate,
  ChevronDown,
  ChevronRight,
  Rocket,
  Smartphone,
  Users,
  Search,
  MoreHorizontal,
  Globe,
  Coins,
  Brain,
  Wrench,
  BarChart3,
  Blocks
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export default function SidebarNew({ currentProject, collapsed, onToggle, user }) {
  const [expandedGroups, setExpandedGroups] = useState(['core']);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const location = useLocation();
  const isAdminUser = user?.role === 'admin' || user?.is_admin === true;

  const toggleGroup = (group) => {
    setExpandedGroups(prev =>
      prev.includes(group)
        ? prev.filter(g => g !== group)
        : [...prev, group]
    );
  };

  const isActive = (href) => {
    return location.pathname === href || location.pathname === href + '/';
  };

  // Simplified core navigation (12 visible items)
  const menuGroups = [
    {
      id: 'core',
      label: 'Core',
      items: [
        { label: 'Dashboard', icon: Sparkles, href: createPageUrl('Dashboard') },
        { label: 'Projects', icon: FolderKanban, href: createPageUrl('Projects') },
        { label: 'AI Assistant', icon: Zap, href: createPageUrl('AIAssistant') },
        { label: 'Templates', icon: LayoutTemplate, href: createPageUrl('TemplateMarketplace') },
        { label: 'Workflows', icon: Rocket, href: createPageUrl('WorkflowBuilder') },
      ]
    },
    {
      id: 'build',
      label: 'Build',
      items: [
        { label: 'Bot Builder', icon: Code, href: createPageUrl('BotBuilder') },
        { label: 'Mobile Studio', icon: Smartphone, href: createPageUrl('MobileStudio') },
        { label: 'Integrations', icon: Blocks, href: createPageUrl('IntegrationEcosystem') },
      ]
    },
    {
      id: 'enterprise',
      label: 'Enterprise',
      items: [
        { label: 'Security', icon: ShieldCheck, href: createPageUrl('Security') },
        { label: 'Observability', icon: Activity, href: createPageUrl('Observability') },
        { label: 'Teams', icon: Users, href: createPageUrl('TeamCollaboration') },
        ...(isAdminUser
          ? [{ label: 'Admin', icon: ShieldCheck, href: createPageUrl('AdminDashboard') }]
          : [])
      ]
    },
  ];

  // All features for search (40+ items)
  const allFeatures = [
    // Core
    { label: 'Dashboard', icon: Sparkles, href: createPageUrl('Dashboard'), category: 'Core' },
    { label: 'Projects', icon: FolderKanban, href: createPageUrl('Projects'), category: 'Core' },
    { label: 'AI Assistant', icon: Zap, href: createPageUrl('AIAssistant'), category: 'Core' },

    // Templates
    { label: 'Template Marketplace', icon: LayoutTemplate, href: createPageUrl('TemplateMarketplace'), category: 'Templates' },
    { label: 'Integration Templates', icon: Blocks, href: createPageUrl('IntegrationTemplates'), category: 'Templates' },

    // Build
    { label: 'Bot Builder', icon: Code, href: createPageUrl('BotBuilder'), category: 'Build' },
    { label: 'Workflow Builder', icon: Rocket, href: createPageUrl('WorkflowBuilder'), category: 'Build' },
    { label: 'Mobile Studio', icon: Smartphone, href: createPageUrl('MobileStudio'), category: 'Build' },

    // Web3
    { label: 'NFT Studio', icon: Coins, href: createPageUrl('NFTStudio'), category: 'Web3' },
    { label: 'DeFi Hub', icon: Globe, href: createPageUrl('DeFiHub'), category: 'Web3' },

    // Enterprise
    { label: 'Data Privacy', icon: ShieldCheck, href: createPageUrl('DataPrivacy'), category: 'Enterprise' },
    { label: 'Observability', icon: Activity, href: createPageUrl('Observability'), category: 'Enterprise' },
    { label: 'ML Integration', icon: Brain, href: createPageUrl('MLIntegration'), category: 'Enterprise' },
    { label: 'Code Refactoring', icon: Wrench, href: createPageUrl('CodeRefactoring'), category: 'Enterprise' },
    { label: 'Search Analytics', icon: BarChart3, href: createPageUrl('SearchAnalytics'), category: 'Enterprise' },
    { label: 'Team Collaboration', icon: Users, href: createPageUrl('TeamCollaboration'), category: 'Enterprise' },
    { label: 'Security', icon: ShieldCheck, href: createPageUrl('Security'), category: 'Enterprise' },

    // Operations
    { label: 'Incident Intelligence', icon: Activity, href: createPageUrl('IncidentIntelligence'), category: 'Operations' },
    { label: 'Visualization Studio', icon: Blocks, href: createPageUrl('VisualizationStudio'), category: 'Operations' },
    { label: 'Reporting & Analytics', icon: BarChart3, href: createPageUrl('ReportingAnalytics'), category: 'Operations' },
    { label: 'Product Analytics', icon: BarChart3, href: createPageUrl('ProductAnalytics'), category: 'Operations' },
    { label: 'Intelligent Automation', icon: Zap, href: createPageUrl('IntelligentAutomation'), category: 'Operations' },
    { label: 'Realtime Collaboration', icon: Users, href: createPageUrl('RealtimeCollaboration'), category: 'Operations' },

    // Platform
    { label: 'Integration Ecosystem', icon: Blocks, href: createPageUrl('IntegrationEcosystem'), category: 'Platform' },
    { label: 'Data Pipeline', icon: Activity, href: createPageUrl('DataPipeline'), category: 'Platform' },
    { label: 'Performance & Scalability', icon: Activity, href: createPageUrl('PerformanceScalability'), category: 'Platform' },
    { label: 'RBAC & Tenancy', icon: ShieldCheck, href: createPageUrl('RbacTenancy'), category: 'Platform' },
    { label: 'Enterprise Security', icon: ShieldCheck, href: createPageUrl('EnterpriseSecurity'), category: 'Platform' },
    { label: 'Developer Experience', icon: Code, href: createPageUrl('DeveloperExperience'), category: 'Platform' },
    { label: 'Intelligent Interface', icon: Sparkles, href: createPageUrl('IntelligentInterface'), category: 'Platform' },

    // Growth
    { label: 'Monetization', icon: Coins, href: createPageUrl('Monetization'), category: 'Growth' },
    { label: 'Marketplace Extensions', icon: LayoutTemplate, href: createPageUrl('MarketplaceExtensions'), category: 'Growth' },
    ...(isAdminUser
      ? [{ label: 'Admin Dashboard', icon: ShieldCheck, href: createPageUrl('AdminDashboard'), category: 'Admin' }]
      : []),
  ];

  const filteredFeatures = searchQuery
    ? allFeatures.filter(feature =>
        feature.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        feature.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allFeatures;

  const handleFeatureClick = (href) => {
    setSearchOpen(false);
    setSearchQuery('');
    window.location.href = href;
  };

  return (
    <>
      <motion.div
        initial={{ width: collapsed ? 64 : 240 }}
        animate={{ width: collapsed ? 64 : 240 }}
        className="bg-white border-r border-gray-200 flex flex-col h-screen overflow-hidden"
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <h2 className="font-bold text-gray-900">AppForge</h2>
            </div>
          )}
          <button
            onClick={onToggle}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            {collapsed ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
          </button>
        </div>

        {/* Search Button */}
        {!collapsed && (
          <div className="p-3 border-b border-gray-200">
            <button
              onClick={() => setSearchOpen(true)}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Search className="w-4 h-4" />
              <span>Search features...</span>
              <kbd className="ml-auto px-1.5 py-0.5 text-xs bg-white border border-gray-200 rounded">
                Ctrl K
              </kbd>
            </button>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {menuGroups.map((group) => (
            <div key={group.id} className="mb-4">
              {!collapsed && (
                <button
                  onClick={() => toggleGroup(group.id)}
                  className="flex items-center gap-2 px-3 py-2 w-full text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-700 transition-colors"
                >
                  {expandedGroups.includes(group.id) ? (
                    <ChevronDown className="w-3 h-3" />
                  ) : (
                    <ChevronRight className="w-3 h-3" />
                  )}
                  {group.label}
                </button>
              )}

              <AnimatePresence>
                {(collapsed || expandedGroups.includes(group.id)) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-1"
                  >
                    {group.items.map((item) => (
                      <Link
                        key={item.label}
                        to={item.href}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-150',
                          collapsed && 'justify-center',
                          isActive(item.href)
                            ? 'bg-blue-50 text-blue-600 font-medium'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        )}
                        title={collapsed ? item.label : undefined}
                      >
                        <item.icon className="w-4 h-4 flex-shrink-0" />
                        {!collapsed && <span className="text-sm">{item.label}</span>}
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}

          {/* More Features Button */}
          {!collapsed && (
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-3 px-3 py-2 w-full text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all duration-150 mt-2"
            >
              <MoreHorizontal className="w-4 h-4" />
              <span className="text-sm">More features...</span>
            </button>
          )}
        </nav>

        {/* Current Project */}
        {currentProject && !collapsed && (
          <div className="p-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 uppercase mb-2">Current Project</p>
            <p className="font-medium text-gray-900 text-sm truncate">{currentProject.name}</p>
          </div>
        )}
      </motion.div>

      {/* Search/Command Palette Dialog */}
      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="sm:max-w-2xl p-0">
          <div className="border-b border-gray-200 p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search all features..."
                className="pl-10 border-0 focus:ring-0 text-lg"
                autoFocus
              />
            </div>
          </div>

          <div className="max-h-[60vh] overflow-y-auto p-2">
            {searchQuery && filteredFeatures.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">No features found</p>
                <p className="text-sm text-gray-400 mt-1">Try a different search term</p>
              </div>
            )}

            {/* Group by category */}
            {Object.entries(
              filteredFeatures.reduce((acc, feature) => {
                if (!acc[feature.category]) acc[feature.category] = [];
                acc[feature.category].push(feature);
                return acc;
              }, {})
            ).map(([category, features]) => (
              <div key={category} className="mb-4">
                <p className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
                  {category}
                </p>
                <div className="space-y-1">
                  {features.map((feature) => (
                    <button
                      key={feature.label}
                      onClick={() => handleFeatureClick(feature.href)}
                      className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <feature.icon className="w-5 h-5 text-gray-400" />
                      <span className="text-sm text-gray-900">{feature.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-200 p-3 bg-gray-50">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded">↑</kbd>
                  <kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded">↓</kbd>
                  <span>Navigate</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded">Enter</kbd>
                  <span>Select</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded">Esc</kbd>
                <span>Close</span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
