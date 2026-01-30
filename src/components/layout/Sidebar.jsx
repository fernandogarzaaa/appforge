import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  Menu, X, FolderKanban, Sparkles, Zap, Code, ShieldCheck, Activity, 
  Brain, Wrench, BarChart3, Users, LayoutTemplate, ChevronDown, ChevronRight,
  Blocks, Rocket, Globe, Smartphone, Coins
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function Sidebar({ currentProject, collapsed, onToggle }) {
  const [expandedGroups, setExpandedGroups] = useState(['main', 'templates']);
  const location = useLocation();

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

  const menuGroups = [
    {
      id: 'main',
      label: 'Main',
      items: [
        { label: 'Dashboard', icon: Sparkles, href: createPageUrl('Dashboard') },
        { label: 'Projects', icon: FolderKanban, href: createPageUrl('Projects') },
        { label: 'AI Assistant', icon: Zap, href: createPageUrl('AIAssistant') },
      ]
    },
    {
      id: 'templates',
      label: 'Templates',
      items: [
        { label: 'Template Marketplace', icon: LayoutTemplate, href: createPageUrl('TemplateMarketplace') },
        { label: 'Integration Templates', icon: Blocks, href: createPageUrl('IntegrationTemplates') },
      ]
    },
    {
      id: 'build',
      label: 'Build',
      items: [
        { label: 'Bot Builder', icon: Code, href: createPageUrl('BotBuilder') },
        { label: 'Workflow Builder', icon: Rocket, href: createPageUrl('WorkflowBuilder') },
        { label: 'Mobile Studio', icon: Smartphone, href: createPageUrl('MobileStudio') },
      ]
    },
    {
      id: 'web3',
      label: 'Web3',
      items: [
        { label: 'NFT Studio', icon: Coins, href: createPageUrl('NFTStudio') },
        { label: 'DeFi Hub', icon: Globe, href: createPageUrl('DeFiHub') },
      ]
    },
    {
      id: 'enterprise',
      label: 'Enterprise',
      items: [
        { label: 'Data Privacy', icon: ShieldCheck, href: createPageUrl('DataPrivacy') },
        { label: 'Observability', icon: Activity, href: createPageUrl('Observability') },
        { label: 'ML Integration', icon: Brain, href: createPageUrl('MLIntegration') },
        { label: 'Code Refactoring', icon: Wrench, href: createPageUrl('CodeRefactoring') },
        { label: 'Search Analytics', icon: BarChart3, href: createPageUrl('SearchAnalytics') },
        { label: 'Team Collaboration', icon: Users, href: createPageUrl('TeamCollaboration') },
        { label: 'Security', icon: ShieldCheck, href: createPageUrl('Security') },
      ]
    }
  ];

  return (
    <motion.div
      initial={{ width: collapsed ? 64 : 256 }}
      animate={{ width: collapsed ? 64 : 256 }}
      className="bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col h-screen overflow-hidden"
    >
      <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <h2 className="font-bold text-gray-900 dark:text-white">AppForge</h2>
          </div>
        )}
        <button onClick={onToggle} className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
          {collapsed ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto p-2 space-y-1">
        {menuGroups.map((group) => (
          <div key={group.id} className="mb-2">
            {!collapsed && (
              <button
                onClick={() => toggleGroup(group.id)}
                className="flex items-center gap-2 px-3 py-1.5 w-full text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hover:text-gray-700 dark:hover:text-gray-300"
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
                  className="space-y-0.5"
                >
                  {group.items.map((item) => (
                    <Link
                      key={item.label}
                      to={item.href}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200',
                        collapsed && 'justify-center',
                        isActive(item.href)
                          ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-medium'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800'
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
      </nav>

      {currentProject && !collapsed && (
        <div className="p-4 border-t border-gray-100 dark:border-gray-800">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase mb-2">Current Project</p>
          <p className="font-medium text-gray-900 dark:text-white text-sm truncate">{currentProject.name}</p>
        </div>
      )}
    </motion.div>
  );
}