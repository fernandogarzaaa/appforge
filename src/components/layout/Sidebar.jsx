import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Menu, X, FolderKanban, Sparkles, Zap, Code, ShieldCheck, Activity, Brain, Wrench, BarChart3, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function Sidebar({ currentProject, collapsed, onToggle }) {
  const [expandedGroup, setExpandedGroup] = useState('projects');

  const menuItems = [
    { label: 'Dashboard', icon: Sparkles, href: createPageUrl('Dashboard') },
    { label: 'Projects', icon: FolderKanban, href: createPageUrl('Projects') },
    { label: 'AI Assistant', icon: Zap, href: createPageUrl('AIAssistant') },
    { label: 'Bot Builder', icon: Code, href: createPageUrl('BotBuilder') },
    { label: 'Data Privacy', icon: ShieldCheck, href: createPageUrl('DataPrivacy') },
    { label: 'Observability', icon: Activity, href: createPageUrl('Observability') },
    { label: 'ML Integration', icon: Brain, href: createPageUrl('MLIntegration') },
    { label: 'Code Refactoring', icon: Wrench, href: createPageUrl('CodeRefactoring') },
    { label: 'Search Analytics', icon: BarChart3, href: createPageUrl('SearchAnalytics') },
    { label: 'Team Collaboration', icon: Users, href: createPageUrl('TeamCollaboration') },
    { label: 'Security', icon: ShieldCheck, href: createPageUrl('Security') },
  ];

  return (
    <motion.div
      initial={{ width: collapsed ? 64 : 256 }}
      animate={{ width: collapsed ? 64 : 256 }}
      className="bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col h-screen"
    >
      <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
        {!collapsed && <h2 className="font-bold text-gray-900 dark:text-white">Base44</h2>}
        <button onClick={onToggle} className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
          {collapsed ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
        </button>
      </div>

      <nav className="flex-1 p-2 space-y-1">
        {menuItems.map((item) => (
          <Link
            key={item.label}
            to={item.href}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800',
              collapsed && 'justify-center'
            )}
            title={collapsed ? item.label : undefined}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
          </Link>
        ))}
      </nav>

      {currentProject && !collapsed && (
        <div className="p-4 border-t border-gray-100 dark:border-gray-800">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase mb-2">Project</p>
          <p className="font-medium text-gray-900 dark:text-white text-sm">{currentProject.name}</p>
        </div>
      )}
    </motion.div>
  );
}