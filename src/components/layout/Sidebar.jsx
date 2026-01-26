import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  LayoutDashboard, 
  FolderKanban, 
  Database, 
  FileCode, 
  Component, 
  Settings,
  Sparkles,
  ChevronLeft,
  Plus,
  Wallet,
  Coins,
  Image,
  Code,
  CreditCard,
  TrendingUp,
  Users,
  Bot,
  Search,
  Github,
  Share2,
  BookOpen,
  FileText,
  Mail,
  BarChart3,
  Package,
  Gamepad2,
  Dices,
  HelpCircle,
  Activity,
  Webhook
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const navItems = [
  { name: 'Home', icon: LayoutDashboard, page: 'Landing' },
  { name: 'Dashboard', icon: LayoutDashboard, page: 'Dashboard' },
  { name: 'Projects', icon: FolderKanban, page: 'Projects' },
  { name: 'Workflow Builder', icon: Share2, page: 'WorkflowBuilder' },
  { name: 'Bot Integrations', icon: Webhook, page: 'ExternalBotIntegrations' },
  { name: 'Integration Templates', icon: Package, page: 'IntegrationTemplates' },
  { name: 'Webhook Monitor', icon: Activity, page: 'WebhookMonitor' },
  { name: 'Integration Analytics', icon: BarChart3, page: 'IntegrationAnalytics' },
  { name: 'Central Analytics', icon: TrendingUp, page: 'CentralAnalytics' },
  { name: 'API Keys', icon: Key, page: 'APIKeyManager' },
  { name: 'AI Monitoring', icon: Share2, page: 'AIMonitoring' },
  { name: 'Predictive Analytics', icon: TrendingUp, page: 'PredictiveAnalytics' },
  { name: 'Feedback Analytics', icon: Share2, page: 'FeedbackAnalytics' },
  { name: 'Email Assistant', icon: Share2, page: 'EmailAssistant' },
  { name: 'Integrations', icon: Share2, page: 'Integrations' },
  { name: 'Templates', icon: Package, page: 'TemplateMarketplace' },
  { name: 'Diagnostics', icon: Activity, page: 'ProjectDiagnostics' },
  { name: 'Guide', icon: BookOpen, page: 'Guide' },
  { name: 'Support', icon: HelpCircle, page: 'Support' },
  { name: 'Pricing', icon: CreditCard, page: 'Pricing' },
];

const projectNavItems = [
  { name: 'Entities', icon: Database, page: 'EntityDesigner' },
  { name: 'Pages', icon: FileCode, page: 'PageEditor' },
  { name: 'Components', icon: Component, page: 'Components' },
  { name: 'Tasks', icon: LayoutDashboard, page: 'ProjectTasks' },
  { name: 'AI Assistant', icon: Sparkles, page: 'AIAssistant' },
  { name: 'Content Studio', icon: FileText, page: 'ContentStudio' },
  { name: 'Media Studio', icon: Image, page: 'MediaStudio' },
  { name: 'Bot Builder', icon: Bot, page: 'BotBuilder' },
  { name: 'API Explorer', icon: Search, page: 'APIExplorer' },
  { name: 'Social Media', icon: Share2, page: 'SocialMediaHub' },
  { name: 'Email Campaigns', icon: Mail, page: 'EmailCampaigns' },
  { name: 'Analytics', icon: BarChart3, page: 'Analytics' },
  { name: 'VS Code', icon: Code, page: 'VSCodeIntegration' },
  { name: 'GitHub', icon: Github, page: 'GitHubConnect' },
  { name: 'Settings', icon: Settings, page: 'ProjectSettings' },
];

const web3NavItems = [
  { name: 'Web3 Studio', icon: Wallet, page: 'Web3Dashboard' },
  { name: 'Tokens', icon: Coins, page: 'TokenCreator' },
  { name: 'NFT Collections', icon: Image, page: 'NFTStudio' },
  { name: 'NFT Marketplace', icon: TrendingUp, page: 'NFTMarketplace' },
  { name: 'Crypto Exchange', icon: BarChart3, page: 'CryptoExchange' },
  { name: 'Gaming Platform', icon: Gamepad2, page: 'GamingPlatform' },
  { name: 'Crypto Casino', icon: Dices, page: 'CryptoGambling' },
  { name: 'Contracts', icon: Code, page: 'ContractBuilder' },
  { name: 'DeFi Hub', icon: TrendingUp, page: 'DeFiHub' },
  { name: 'DAO Governance', icon: Users, page: 'DAOGovernance' },
];

export default function Sidebar({ currentProject, collapsed, onToggle }) {
  const location = useLocation();
  
  const isActive = (page) => {
    return location.pathname.includes(page.toLowerCase());
  };

  return (
    <aside className={cn(
      "h-screen bg-white/60 backdrop-blur-xl border-r border-gray-200/50 flex flex-col transition-all duration-300 ease-out",
      collapsed ? "w-16" : "w-60"
    )}>
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-3 border-b border-gray-200/50">
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-gray-900 to-gray-700 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-semibold text-gray-900 text-base tracking-tight">AppForge</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="h-7 w-7 text-gray-400 hover:text-gray-700 hover:bg-gray-100/50"
        >
          <ChevronLeft className={cn("h-3.5 w-3.5 transition-transform", collapsed && "rotate-180")} />
        </Button>
      </div>

      {/* Main Nav */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => (
          <Link
            key={item.page}
            to={createPageUrl(item.page)}
            className={cn(
              "flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-all duration-200",
              isActive(item.page)
                ? "bg-gray-900 text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-100/70 hover:text-gray-900"
            )}
          >
            <item.icon className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span>{item.name}</span>}
          </Link>
        ))}

        {currentProject && (
          <>
            <div className={cn("pt-4 pb-1.5", collapsed ? "px-2" : "px-2.5")}>
              {!collapsed && (
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-0.5">
                  Project
                </p>
              )}
            </div>
            
            {!collapsed && (
              <div className="mx-2 mb-2 p-2.5 bg-white/60 border border-gray-200/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-base">{currentProject.icon || '📁'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate text-[13px]">
                      {currentProject.name}
                    </p>
                    <p className="text-[10px] text-gray-500 capitalize">
                      {currentProject.status}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {projectNavItems.map((item) => (
              <Link
                key={item.page}
                to={createPageUrl(item.page) + `?projectId=${currentProject.id}`}
                className={cn(
                  "flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-all duration-200",
                  isActive(item.page)
                    ? "bg-gray-900 text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-100/70 hover:text-gray-900"
                )}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                {!collapsed && <span>{item.name}</span>}
              </Link>
            ))}

            {/* Web3 Section */}
            <div className={cn("pt-3 pb-1.5", collapsed ? "px-2" : "px-2.5")}>
              {!collapsed && (
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-0.5">
                  Web3
                </p>
              )}
            </div>

            {web3NavItems.map((item) => (
              <Link
                key={item.page}
                to={createPageUrl(item.page) + `?projectId=${currentProject.id}`}
                className={cn(
                  "flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-all duration-200",
                  isActive(item.page)
                    ? "bg-gray-900 text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-100/70 hover:text-gray-900"
                )}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                {!collapsed && <span>{item.name}</span>}
              </Link>
            ))}
          </>
        )}
      </nav>

      {/* Create Button */}
      {!collapsed && (
        <div className="p-3 border-t border-gray-200/50">
          <Link to={createPageUrl('Projects') + '?new=true'}>
            <Button className="w-full bg-gray-900 hover:bg-gray-800 text-white rounded-lg h-9 text-[13px] font-medium shadow-sm">
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              New Project
            </Button>
          </Link>
        </div>
      )}
    </aside>
  );
}