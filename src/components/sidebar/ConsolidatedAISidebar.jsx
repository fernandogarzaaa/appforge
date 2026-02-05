import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useAnalytics } from '@/hooks/useAnalytics';
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

// Custom comparison function to prevent unnecessary re-renders
function propsAreEqual(prevProps, nextProps) {
  return (
    prevProps.collapsed === nextProps.collapsed &&
    prevProps.user?.email === nextProps.user?.email &&
    prevProps.currentProject?.id === nextProps.currentProject?.id &&
    prevProps.onToggle === nextProps.onToggle
  );
}

function ConsolidatedAISidebar({ currentProject, collapsed, onToggle, user }) {
  const location = useLocation();
  const { trackSectionCollapsed, trackSectionExpanded } = useAnalytics();
  const isAdminUser = user?.email?.toLowerCase() === 'fernandogarzaaa@gmail.com';
  const [expandedGroups, setExpandedGroups] = useState(['ai', 'build', 'main']);

  const toggleGroup = (group) => {
    setExpandedGroups((prev) => {
      const isExpanding = !prev.includes(group);
      if (isExpanding) {
        trackSectionExpanded(group);
      } else {
        trackSectionCollapsed(group);
      }
      return isExpanding ? [...prev, group] : prev.filter((g) => g !== group);
    });
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
    { label: 'AI Templates', icon: Sparkles, href: createPageUrl('AITemplates') },
    { label: 'Superior AI Studio', icon: Brain, href: createPageUrl('SuperiorAIStudio') },
    { label: 'Code Review', icon: ShieldCheck, href: createPageUrl('CodeReview') },
    { label: 'AI Deployment', icon: Rocket, href: createPageUrl('AIDeployment') },
    { label: 'Custom Agents', icon: Brain, href: createPageUrl('CustomAgentStudio') },
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

  const operationsItems = [
    { label: 'Incident Intelligence', icon: Activity, href: createPageUrl('IncidentIntelligence') },
    { label: 'Visualization Studio', icon: Blocks, href: createPageUrl('VisualizationStudio') },
    { label: 'Reporting & Analytics', icon: BarChart3, href: createPageUrl('ReportingAnalytics') },
    { label: 'Product Analytics', icon: BarChart3, href: createPageUrl('ProductAnalytics') },
    { label: 'Intelligent Automation', icon: Zap, href: createPageUrl('IntelligentAutomation') },
    { label: 'Realtime Collaboration', icon: Users, href: createPageUrl('RealtimeCollaboration') },
  ];

  const platformItems = [
    { label: 'Integration Ecosystem', icon: Blocks, href: createPageUrl('IntegrationEcosystem') },
    { label: 'Data Pipeline', icon: Activity, href: createPageUrl('DataPipeline') },
    { label: 'Performance & Scalability', icon: Activity, href: createPageUrl('PerformanceScalability') },
    { label: 'RBAC & Tenancy', icon: ShieldCheck, href: createPageUrl('RbacTenancy') },
    { label: 'Enterprise Security', icon: ShieldCheck, href: createPageUrl('EnterpriseSecurity') },
    { label: 'Developer Experience', icon: Code, href: createPageUrl('DeveloperExperience') },
    { label: 'Intelligent Interface', icon: Sparkles, href: createPageUrl('IntelligentInterface') },
  ];

  const growthItems = [
    { label: 'Monetization', icon: Coins, href: createPageUrl('Monetization') },
    { label: 'Marketplace Extensions', icon: LayoutTemplate, href: createPageUrl('MarketplaceExtensions') },
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
        className="bg-white dark:bg-gray-900 h-screen flex flex-col p-3 gap-8 shadow-sm"
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
                  aria-label="Expand sidebar"
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
                  aria-label="Expand"
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
      className="bg-white dark:bg-gray-900 h-screen flex flex-col overflow-hidden shadow-sm"
    >
      {/* Header */}
      <div className="px-6 py-5 flex items-center justify-between border-b border-gray-100 dark:border-gray-800/50">
        <h2 className="text-xs font-semibold text-gray-600 dark:text-gray-400 tracking-wider">APPFORGE</h2>
        <TooltipProvider>
          <RadixTooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggle}
                className="h-7 w-7 hover:bg-gray-100 dark:hover:bg-gray-800/50"
                aria-label="Collapse sidebar"
              >
                <ChevronDown className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Collapse sidebar</TooltipContent>
          </RadixTooltip>
        </TooltipProvider>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-8">
        <Accordion type="multiple" value={expandedGroups} onValueChange={setExpandedGroups}>
          {/* Main Navigation */}
          <AccordionItem value="main" className="border-none">
            <AccordionTrigger className="px-0 py-3 text-xs font-medium text-gray-500 dark:text-gray-500 uppercase tracking-wider hover:no-underline hover:text-gray-600 dark:hover:text-gray-400">
              Core
            </AccordionTrigger>
            <AccordionContent className="pb-4 pt-2 space-y-2">
              <div className="flex flex-col gap-2">
                {mainItems.map((item) => (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all duration-200 group',
                      isActive(item.href)
                        ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 font-medium'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/30 hover:text-gray-700 dark:hover:text-gray-300'
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
            <AccordionTrigger className="px-0 py-3 text-xs font-medium text-gray-500 dark:text-gray-500 uppercase tracking-wider hover:no-underline hover:text-gray-600 dark:hover:text-gray-400">
              AI & Models
            </AccordionTrigger>
            <AccordionContent className="pb-4 pt-2 space-y-3">
              {/* AI Model Router - Consolidated */}
              <div className="mb-3 -mx-1">
                <AIModelRouter />
              </div>

              {/* Divider */}
              <div className="h-px bg-gray-100 dark:bg-gray-800/50" />

              {/* AI Features */}
              <div className="flex flex-col gap-2 pt-1">
                {aiItems.map((item) => (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all duration-200',
                      isActive(item.href)
                        ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 font-medium'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/30 hover:text-gray-700 dark:hover:text-gray-300'
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
            <AccordionTrigger className="px-0 py-3 text-xs font-medium text-gray-500 dark:text-gray-500 uppercase tracking-wider hover:no-underline hover:text-gray-600 dark:hover:text-gray-400">
              Build
            </AccordionTrigger>
            <AccordionContent className="pb-4 pt-2 space-y-2">
              <div className="flex flex-col gap-2">
                {buildItems.map((item) => (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all duration-200',
                      isActive(item.href)
                        ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 font-medium'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/30 hover:text-gray-700 dark:hover:text-gray-300'
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
            <AccordionTrigger className="px-0 py-3 text-xs font-medium text-gray-500 dark:text-gray-500 uppercase tracking-wider hover:no-underline hover:text-gray-600 dark:hover:text-gray-400">
              Templates
            </AccordionTrigger>
            <AccordionContent className="pb-4 pt-2 space-y-2">
              <div className="flex flex-col gap-2">
                {templateItems.map((item) => (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all duration-200',
                      isActive(item.href)
                        ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 font-medium'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/30 hover:text-gray-700 dark:hover:text-gray-300'
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
            <AccordionTrigger className="px-0 py-3 text-xs font-medium text-gray-500 dark:text-gray-500 uppercase tracking-wider hover:no-underline hover:text-gray-600 dark:hover:text-gray-400">
              Enterprise
            </AccordionTrigger>
            <AccordionContent className="pb-4 pt-2 space-y-2">
              <div className="flex flex-col gap-2">
                {enterpriseItems.map((item) => (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all duration-200',
                      isActive(item.href)
                        ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 font-medium'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/30 hover:text-gray-700 dark:hover:text-gray-300'
                    )}
                  >
                    <item.icon className="w-4 h-4 flex-shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Operations */}
          <AccordionItem value="operations" className="border-none">
            <AccordionTrigger className="px-0 py-3 text-xs font-medium text-gray-500 dark:text-gray-500 uppercase tracking-wider hover:no-underline hover:text-gray-600 dark:hover:text-gray-400">
              Operations
            </AccordionTrigger>
            <AccordionContent className="pb-4 pt-2 space-y-2">
              <div className="flex flex-col gap-2">
                {operationsItems.map((item) => (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all duration-200',
                      isActive(item.href)
                        ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 font-medium'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/30 hover:text-gray-700 dark:hover:text-gray-300'
                    )}
                  >
                    <item.icon className="w-4 h-4 flex-shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Platform */}
          <AccordionItem value="platform" className="border-none">
            <AccordionTrigger className="px-0 py-3 text-xs font-medium text-gray-500 dark:text-gray-500 uppercase tracking-wider hover:no-underline hover:text-gray-600 dark:hover:text-gray-400">
              Platform
            </AccordionTrigger>
            <AccordionContent className="pb-4 pt-2 space-y-2">
              <div className="flex flex-col gap-2">
                {platformItems.map((item) => (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all duration-200',
                      isActive(item.href)
                        ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 font-medium'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/30 hover:text-gray-700 dark:hover:text-gray-300'
                    )}
                  >
                    <item.icon className="w-4 h-4 flex-shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Growth */}
          <AccordionItem value="growth" className="border-none">
            <AccordionTrigger className="px-0 py-3 text-xs font-medium text-gray-500 dark:text-gray-500 uppercase tracking-wider hover:no-underline hover:text-gray-600 dark:hover:text-gray-400">
              Growth
            </AccordionTrigger>
            <AccordionContent className="pb-4 pt-2 space-y-2">
              <div className="flex flex-col gap-2">
                {growthItems.map((item) => (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all duration-200',
                      isActive(item.href)
                        ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 font-medium'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/30 hover:text-gray-700 dark:hover:text-gray-300'
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
            <AccordionTrigger className="px-0 py-3 text-xs font-medium text-gray-500 dark:text-gray-500 uppercase tracking-wider hover:no-underline hover:text-gray-600 dark:hover:text-gray-400">
              Web3
            </AccordionTrigger>
            <AccordionContent className="pb-4 pt-2 space-y-2">
              <div className="flex flex-col gap-2">
                {web3Items.map((item) => (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all duration-200',
                      isActive(item.href)
                        ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 font-medium'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/30 hover:text-gray-700 dark:hover:text-gray-300'
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
      <div className="px-4 py-6 border-t border-gray-100 dark:border-gray-800/50">
        <TooltipProvider>
          <RadixTooltip>
            <TooltipTrigger asChild>
              <Link
                to={createPageUrl('LLMSettings')}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all duration-200',
                  isActive(createPageUrl('LLMSettings'))
                    ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/30 hover:text-gray-700 dark:hover:text-gray-300'
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

export default React.memo(ConsolidatedAISidebar, propsAreEqual);