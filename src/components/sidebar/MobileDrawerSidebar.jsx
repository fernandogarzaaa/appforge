import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  Settings,
  Code,
  Brain,
  Wrench,
  BarChart3,
  Users,
  LayoutTemplate,
  Blocks,
  Rocket,
  Globe,
  Smartphone,
  Coins,
  X,
  Menu,
  FolderKanban,
  ShieldCheck,
  Activity,
  Sparkles,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import AIModelRouter from './AIModelRouter';

function MobileDrawerSidebar({ currentProject, user, onClose }) {
  const location = useLocation();
  const isAdminUser = user?.email?.toLowerCase() === 'fernandogarzaaa@gmail.com';
  const [expandedGroups, setExpandedGroups] = useState(['ai', 'build', 'main']);

  const toggleGroup = (group) => {
    setExpandedGroups((prev) =>
      prev.includes(group) ? prev.filter((g) => g !== group) : [...prev, group]
    );
  };

  const isActive = (href) => {
    return location.pathname === href || location.pathname === href + '/';
  };

  const NavLink = ({ icon: Icon, label, href }) => (
    <Link
      to={href}
      onClick={onClose}
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all duration-200',
        isActive(href)
          ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 font-medium'
          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/30 hover:text-gray-700 dark:hover:text-gray-300'
      )}
    >
      <Icon className="w-5 h-5 flex-shrink-0" />
      <span>{label}</span>
    </Link>
  );

  const SectionGroup = ({ title, items }) => (
    <div className="space-y-1">
      <h3 className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-500 uppercase tracking-wider">
        {title}
      </h3>
      <div className="space-y-1 px-2">
        {items.map((item) => (
          <NavLink key={item.href} {...item} />
        ))}
      </div>
    </div>
  );

  const mainItems = [
    { label: 'Dashboard', icon: Sparkles, href: createPageUrl('Dashboard') },
    { label: 'Projects', icon: FolderKanban, href: createPageUrl('Projects') },
    ...(isAdminUser ? [{ label: 'Admin', icon: ShieldCheck, href: createPageUrl('AdminDashboard') }] : []),
  ];

  const aiItems = [
    { label: 'AI Assistant', icon: Zap, href: createPageUrl('AIAssistant') },
    { label: 'Code Refactoring', icon: Wrench, href: createPageUrl('CodeRefactoring') },
    { label: 'ML Integration', icon: Brain, href: createPageUrl('MLIntegration') },
  ];

  const buildItems = [
    { label: 'Bot Builder', icon: Code, href: createPageUrl('BotBuilder') },
    { label: 'Workflows', icon: Rocket, href: createPageUrl('WorkflowBuilder') },
    { label: 'Mobile Studio', icon: Smartphone, href: createPageUrl('MobileStudio') },
  ];

  const enterpriseItems = [
    { label: 'Data Privacy', icon: ShieldCheck, href: createPageUrl('DataPrivacy') },
    { label: 'Observability', icon: Activity, href: createPageUrl('Observability') },
    { label: 'Search Analytics', icon: BarChart3, href: createPageUrl('SearchAnalytics') },
    { label: 'Team', icon: Users, href: createPageUrl('TeamCollaboration') },
  ];

  const templateItems = [
    { label: 'Marketplace', icon: LayoutTemplate, href: createPageUrl('TemplateMarketplace') },
    { label: 'Integration', icon: Blocks, href: createPageUrl('IntegrationTemplates') },
  ];

  const web3Items = [
    { label: 'NFT Studio', icon: Coins, href: createPageUrl('NFTStudio') },
    { label: 'DeFi Hub', icon: Globe, href: createPageUrl('DeFiHub') },
  ];

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="w-6 h-6" />
        </Button>
      </DialogTrigger>
      <DialogContent className="w-full max-w-sm rounded-r-2xl p-0 gap-0 border-0 bg-white dark:bg-gray-900 h-screen max-h-screen flex flex-col top-0 left-0 translate-x-0 translate-y-0">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800/50 flex-shrink-0">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white tracking-wider">APPFORGE</h2>
          <DialogClose asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <X className="w-5 h-5" />
            </Button>
          </DialogClose>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-2 py-4 space-y-4">
          {/* AI Model Router */}
          <div className="px-2 pb-3 border-b border-gray-100 dark:border-gray-800/50">
            <AIModelRouter />
          </div>

          <SectionGroup title="Core" items={mainItems} />
          <SectionGroup title="AI & Models" items={aiItems} />
          <SectionGroup title="Build" items={buildItems} />
          <SectionGroup title="Templates" items={templateItems} />
          <SectionGroup title="Enterprise" items={enterpriseItems} />
          <SectionGroup title="Web3" items={web3Items} />
        </div>

        {/* Footer Settings */}
        <div className="px-2 py-4 border-t border-gray-100 dark:border-gray-800/50 flex-shrink-0">
          <Link
            to={createPageUrl('LLMSettings')}
            onClick={onClose}
            className={cn(
              'flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all duration-200',
              isActive(createPageUrl('LLMSettings'))
                ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 font-medium'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/30 hover:text-gray-700 dark:hover:text-gray-300'
            )}
          >
            <Settings className="w-5 h-5 flex-shrink-0" />
            <span>Settings</span>
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default React.memo(MobileDrawerSidebar);
