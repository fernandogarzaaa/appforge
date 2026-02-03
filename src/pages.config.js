/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */

import Account from './pages/Account';
import AdminDashboard from './pages/AdminDashboard';
import AdminSubscriptions from './pages/AdminSubscriptions';
import AdvancedAnomalyDetection from './pages/AdvancedAnomalyDetection';
import AdvancedSearch from './pages/AdvancedSearch';
import AIAssistant from './pages/AIAssistant';
import AIMonitoring from './pages/AIMonitoring';
import Analytics from './pages/Analytics';
import AnalyticsPage from './pages/AnalyticsPage';
import APIExplorer from './pages/APIExplorer';
import APIKeyManager from './pages/APIKeyManager';
import APIKeys from './pages/APIKeys';
import AuditLog from './pages/AuditLog';
import BotBuilder from './pages/BotBuilder';
import CentralAnalytics from './pages/CentralAnalytics';
import ChatbotManager from './pages/ChatbotManager';
import CodePlayground from './pages/CodePlayground';
import CodeRefactoring from './pages/CodeRefactoring';
import Collaboration from './pages/Collaboration';
import Components from './pages/Components';
import ContentStudio from './pages/ContentStudio';
import ContractBuilder from './pages/ContractBuilder';
import CryptoExchange from './pages/CryptoExchange';
import CryptoGambling from './pages/CryptoGambling';
import DAOGovernance from './pages/DAOGovernance';
import Dashboard from './pages/Dashboard';
import DataAnalytics from './pages/DataAnalytics';
import DataPrivacy from './pages/DataPrivacy';
import DeFiHub from './pages/DeFiHub';
import Deployments from './pages/Deployments';
import EmailAssistant from './pages/EmailAssistant';
import EmailCampaigns from './pages/EmailCampaigns';
import EnterpriseIntelligence from './pages/EnterpriseIntelligence';
import EntityDesigner from './pages/EntityDesigner';
import EnvironmentVariables from './pages/EnvironmentVariables';
import ExternalBotIntegrations from './pages/ExternalBotIntegrations';
import FeatureFlags from './pages/FeatureFlags';
import FeedbackAnalytics from './pages/FeedbackAnalytics';
import FunctionValidator from './pages/FunctionValidator';
import GamingPlatform from './pages/GamingPlatform';
import GitHubConnect from './pages/GitHubConnect';
import GovernmentTools from './pages/GovernmentTools';
import Guide from './pages/Guide';
import IntegrationAnalytics from './pages/IntegrationAnalytics';
import IntegrationHub from './pages/IntegrationHub';
import Integrations from './pages/Integrations';
import IntegrationTemplates from './pages/IntegrationTemplates';
import Landing from './pages/Landing';
import LLMSettings from './pages/LLMSettings';
import Login from './pages/Login';
import MediaStudio from './pages/MediaStudio';
import MedicalAI from './pages/MedicalAI';
import MLIntegration from './pages/MLIntegration';
import MobileStudio from './pages/MobileStudio';
import Monitoring from './pages/Monitoring';
import NFTMarketplace from './pages/NFTMarketplace';
import NFTStudio from './pages/NFTStudio';
import Notifications from './pages/Notifications';
import Observability from './pages/Observability';
import PageEditor from './pages/PageEditor';
import PredictiveAnalytics from './pages/PredictiveAnalytics';
import Pricing from './pages/Pricing';
import Profile from './pages/Profile';
import ProjectDiagnostics from './pages/ProjectDiagnostics';
import ProjectExport from './pages/ProjectExport';
import Projects from './pages/Projects';
import ProjectSettings from './pages/ProjectSettings';
import ProjectTasks from './pages/ProjectTasks';
import ProjectViewer from './pages/ProjectViewer';
import QuantumLab from './pages/QuantumLab';
import RateLimits from './pages/RateLimits';
import ReferralProgram from './pages/ReferralProgram';
import Register from './pages/Register';
import Roadmap from './pages/Roadmap';
import RoleManagement from './pages/RoleManagement';
import SearchAnalytics from './pages/SearchAnalytics';
import Security from './pages/Security';
import SecurityFeatures from './pages/SecurityFeatures';
import SocialMediaHub from './pages/SocialMediaHub';
import SubscriptionSuccess from './pages/SubscriptionSuccess';
import Support from './pages/Support';
import SystemHealth from './pages/SystemHealth';
import SystemStatus from './pages/SystemStatus';
import TeamCollaboration from './pages/TeamCollaboration';
import TeamManagement from './pages/TeamManagement';
import TemplateMarketplace from './pages/TemplateMarketplace';
import TokenCreator from './pages/TokenCreator';
import TwoFactorAuth from './pages/TwoFactorAuth';
import VSCodeIntegration from './pages/VSCodeIntegration';
import Web3Dashboard from './pages/Web3Dashboard';
import WebhookMonitor from './pages/WebhookMonitor';
import WorkflowBuilder from './pages/WorkflowBuilder';

export const PAGES = {
  Account,
  AdminDashboard,
  AdminSubscriptions,
  AdvancedAnomalyDetection,
  AdvancedSearch,
  AIAssistant,
  AIMonitoring,
  Analytics,
  AnalyticsPage,
  APIExplorer,
  APIKeyManager,
  APIKeys,
  AuditLog,
  BotBuilder,
  CentralAnalytics,
  ChatbotManager,
  CodePlayground,
  CodeRefactoring,
  Collaboration,
  Components,
  ContentStudio,
  ContractBuilder,
  CryptoExchange,
  CryptoGambling,
  DAOGovernance,
  Dashboard,
  DataAnalytics,
  DataPrivacy,
  DeFiHub,
  Deployments,
  EmailAssistant,
  EmailCampaigns,
  EnterpriseIntelligence,
  EntityDesigner,
  EnvironmentVariables,
  ExternalBotIntegrations,
  FeatureFlags,
  FeedbackAnalytics,
  FunctionValidator,
  GamingPlatform,
  GitHubConnect,
  GovernmentTools,
  Guide,
  IntegrationAnalytics,
  IntegrationHub,
  Integrations,
  IntegrationTemplates,
  Landing,
  LLMSettings,
  Login,
  MediaStudio,
  MedicalAI,
  MLIntegration,
  MobileStudio,
  Monitoring,
  NFTMarketplace,
  NFTStudio,
  Notifications,
  Observability,
  PageEditor,
  PredictiveAnalytics,
  Pricing,
  Profile,
  ProjectDiagnostics,
  ProjectExport,
  Projects,
  ProjectSettings,
  ProjectTasks,
  ProjectViewer,
  QuantumLab,
  RateLimits,
  ReferralProgram,
  Register,
  Roadmap,
  RoleManagement,
  SearchAnalytics,
  Security,
  SecurityFeatures,
  SocialMediaHub,
  SubscriptionSuccess,
  Support,
  SystemHealth,
  SystemStatus,
  TeamCollaboration,
  TeamManagement,
  TemplateMarketplace,
  TokenCreator,
  TwoFactorAuth,
  VSCodeIntegration,
  Web3Dashboard,
  WebhookMonitor,
  WorkflowBuilder,
};

export const pagesConfig = {
  mainPage: 'Dashboard',
  Pages: PAGES,
};

