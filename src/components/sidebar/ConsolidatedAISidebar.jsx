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
  ChevronDown,
  ChevronRight,
  FolderKanban,
  ShieldCheck,
  Activity,
  Sparkles,
  Zap,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';
import {
  Tooltip as RadixTooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import AIModelRouter from './AIModelRouter';

export default function ConsolidatedAISidebar({ currentProject, collapsed, onToggle, user }) {
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

  const NavIcon = ({ icon: Icon, label, href, isActive: active }) => (
    <TooltipProvider>
      <RadixTooltip>
        <TooltipTrigger asChild>
          <Link
            to={href}
            className={cn(
              'relative flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-200',
              active
                ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            )}
          >
            <Icon className="w-5 h-5" />
            {active && (
              <motion.div
                layoutId="sidebarIndicator"
                className="absolute left-0 w-1 h-6 bg-indigo-600 dark:bg-indigo-400 rounded-r-full"
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
          </Link>
        </TooltipTrigger>
        <TooltipContent side={collapsed ? 'right' : 'bottom'} className="text-xs">
          {label}
        </TooltipContent>
      </RadixTooltip>
    </TooltipProvider>
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

  if (collapsed) {
    return (
      <motion.div
        initial={{ width: 80 }}
        animate={{ width: 80 }}
        className="bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 h-screen flex flex-col p-4 gap-6"
      >
        {/* Logo/Collapse Button */}
        <div className="flex justify-center">
          <TooltipProvider>
            <RadixTooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onToggle}
                  className="w-10 h-10"
                >
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Expand sidebar</TooltipContent>
            </RadixTooltip>
          </TooltipProvider>
        </div>

        {/* Main Navigation */}
        <div className="flex flex-col gap-2">
          {mainItems.map((item) => (
            <NavIcon
              key={item.href}
              icon={item.icon}
              label={item.label}
              href={item.href}
              isActive={isActive(item.href)}
            />
          ))}
        </div>

        {/* AI & Settings */}
        <div className="flex flex-col gap-2">
          {aiItems.slice(0, 2).map((item) => (
            <NavIcon
              key={item.href}
              icon={item.icon}
              label={item.label}
              href={item.href}
              isActive={isActive(item.href)}
            />
          ))}
        </div>

        {/* Build */}
        <div className="flex flex-col gap-2">
          {buildItems.slice(0, 2).map((item) => (
            <NavIcon
              key={item.href}
              icon={item.icon}
              label={item.label}
              href={item.href}
              isActive={isActive(item.href)}
            />
          ))}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Expand Button */}
        <div className="flex justify-center pt-4 border-t border-gray-200 dark:border-gray-800">
          <TooltipProvider>
            <RadixTooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onToggle}
                  className="w-10 h-10"
                >
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Expand</TooltipContent>
            </RadixTooltip>
          </TooltipProvider>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ width: 280 }}
      animate={{ width: 280 }}
      className="bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 h-screen flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="px-6 py-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-800">
        <h2 className="text-sm font-bold text-gray-900 dark:text-white tracking-wide">APPFORGE</h2>
        <TooltipProvider>
          <RadixTooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggle}
                className="h-8 w-8"
              >
                <ChevronDown className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Collapse sidebar</TooltipContent>
          </RadixTooltip>
        </TooltipProvider>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <Accordion type="multiple" value={expandedGroups} onValueChange={setExpandedGroups}>
          {/* Main Navigation */}
          <AccordionItem value="main" className="border-none">
            <AccordionTrigger className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hover:no-underline">
              Core
            </AccordionTrigger>
            <AccordionContent className="pb-3 pt-1">
              <div className="flex flex-col gap-1">
                {mainItems.map((item) => (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all duration-200',
                      isActive(item.href)
                        ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 font-medium'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                    )}
                  >
                    <item.icon className="w-4 h-4 flex-shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* AI & Model Router */}
          <AccordionItem value="ai" className="border-none">
            <AccordionTrigger className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hover:no-underline">
              AI & Models
            </AccordionTrigger>
            <AccordionContent className="pb-3 pt-1">
              {/* AI Model Router - Consolidated */}
              <div className="mb-3">
                <AIModelRouter />
              </div>

              {/* AI Features */}
              <div className="flex flex-col gap-1">
                {aiItems.map((item) => (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all duration-200',
                      isActive(item.href)
                        ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 font-medium'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                    )}
                  >
                    <item.icon className="w-4 h-4 flex-shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Build Section */}
          <AccordionItem value="build" className="border-none">
            <AccordionTrigger className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hover:no-underline">
              Build
            </AccordionTrigger>
            <AccordionContent className="pb-3 pt-1">
              <div className="flex flex-col gap-1">
                {buildItems.map((item) => (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all duration-200',
                      isActive(item.href)
                        ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 font-medium'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                    )}
                  >
                    <item.icon className="w-4 h-4 flex-shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Templates */}
          <AccordionItem value="templates" className="border-none">
            <AccordionTrigger className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hover:no-underline">
              Templates
            </AccordionTrigger>
            <AccordionContent className="pb-3 pt-1">
              <div className="flex flex-col gap-1">
                {templateItems.map((item) => (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all duration-200',
                      isActive(item.href)
                        ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 font-medium'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                    )}
                  >
                    <item.icon className="w-4 h-4 flex-shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Enterprise */}
          <AccordionItem value="enterprise" className="border-none">
            <AccordionTrigger className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hover:no-underline">
              Enterprise
            </AccordionTrigger>
            <AccordionContent className="pb-3 pt-1">
              <div className="flex flex-col gap-1">
                {enterpriseItems.map((item) => (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all duration-200',
                      isActive(item.href)
                        ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 font-medium'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                    )}
                  >
                    <item.icon className="w-4 h-4 flex-shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Web3 */}
          <AccordionItem value="web3" className="border-none">
            <AccordionTrigger className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hover:no-underline">
              Web3
            </AccordionTrigger>
            <AccordionContent className="pb-3 pt-1">
              <div className="flex flex-col gap-1">
                {web3Items.map((item) => (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all duration-200',
                      isActive(item.href)
                        ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 font-medium'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                    )}
                  >
                    <item.icon className="w-4 h-4 flex-shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      {/* Footer */}
      <div className="px-3 py-3 border-t border-gray-200 dark:border-gray-800">
        <TooltipProvider>
          <RadixTooltip>
            <TooltipTrigger asChild>
              <Link
                to={createPageUrl('LLMSettings')}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all duration-200',
                  isActive(createPageUrl('LLMSettings'))
                    ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                )}
              >
                <Settings className="w-4 h-4 flex-shrink-0" />
                <span>Settings</span>
              </Link>
            </TooltipTrigger>
            <TooltipContent>LLM Settings & Configuration</TooltipContent>
          </RadixTooltip>
        </TooltipProvider>
      </div>
    </motion.div>
  );
}
