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
import AGIStudio from './pages/AGIStudio';
import AIAssistant from './pages/AIAssistant';
import AIDeployment from './pages/AIDeployment';
import AIMonitoring from './pages/AIMonitoring';
import AITemplates from './pages/AITemplates';
import APIExplorer from './pages/APIExplorer';
import APIKeyManager from './pages/APIKeyManager';
import APIKeys from './pages/APIKeys';
import Account from './pages/Account';
import AdminAIControl from './pages/AdminAIControl';
import AdminAPIKeys from './pages/AdminAPIKeys';
import AdminAgentControl from './pages/AdminAgentControl';
import AdminAnalytics from './pages/AdminAnalytics';
import AdminCoaching from './pages/AdminCoaching';
import AdminDashboard from './pages/AdminDashboard';
import AdminDeployments from './pages/AdminDeployments';
import AdminMonitoring from './pages/AdminMonitoring';
import AdminSecrets from './pages/AdminSecrets';
import AdminSubscriptions from './pages/AdminSubscriptions';
import AdminSystemConfig from './pages/AdminSystemConfig';
import AdminTemplates from './pages/AdminTemplates';
import AdminUserManagement from './pages/AdminUserManagement';
import AdvancedAnomalyDetection from './pages/AdvancedAnomalyDetection';
import AdvancedSearch from './pages/AdvancedSearch';
import Analytics from './pages/Analytics';
import AnalyticsPage from './pages/AnalyticsPage';
import AuditLog from './pages/AuditLog';
import BotBuilder from './pages/BotBuilder';
import CentralAnalytics from './pages/CentralAnalytics';
import ChatbotManager from './pages/ChatbotManager';
import CodeGenerator from './pages/CodeGenerator';
import CodePlayground from './pages/CodePlayground';
import CodeRefactoring from './pages/CodeRefactoring';
import CodeReview from './pages/CodeReview';
import collaborationOld from './pages/Collaboration-old';
import Collaboration from './pages/Collaboration';
import CollaborationHub from './pages/CollaborationHub';
import ComponentBuilder from './pages/ComponentBuilder';
import Components from './pages/Components';
import ContentStudio from './pages/ContentStudio';
import ContractBuilder from './pages/ContractBuilder';
import CryptoExchange from './pages/CryptoExchange';
import CryptoGambling from './pages/CryptoGambling';
import CustomAgentStudio from './pages/CustomAgentStudio';
import DAOGovernance from './pages/DAOGovernance';
import Dashboard from './pages/Dashboard';
import DataAnalytics from './pages/DataAnalytics';
import DataPipeline from './pages/DataPipeline';
import DataPrivacy from './pages/DataPrivacy';
import DeFiHub from './pages/DeFiHub';
import Deployments from './pages/Deployments';
import DeveloperExperience from './pages/DeveloperExperience';
import EmailAssistant from './pages/EmailAssistant';
import EmailCampaigns from './pages/EmailCampaigns';
import EnterpriseIntelligence from './pages/EnterpriseIntelligence';
import EnterpriseSecurity from './pages/EnterpriseSecurity';
import EnterpriseValuation from './pages/EnterpriseValuation';
import EntityDesigner from './pages/EntityDesigner';
import EnvironmentVariables from './pages/EnvironmentVariables';
import ExternalBotIntegrations from './pages/ExternalBotIntegrations';
import FeatureFlags from './pages/FeatureFlags';
import FeedbackAnalytics from './pages/FeedbackAnalytics';
import FunctionBuilder from './pages/FunctionBuilder';
import FunctionValidator from './pages/FunctionValidator';
import GamingPlatform from './pages/GamingPlatform';
import GitHubConnect from './pages/GitHubConnect';
import GovernmentTools from './pages/GovernmentTools';
import Guide from './pages/Guide';
import IncidentIntelligence from './pages/IncidentIntelligence';
import IntegrationAnalytics from './pages/IntegrationAnalytics';
import IntegrationEcosystem from './pages/IntegrationEcosystem';
import IntegrationHub from './pages/IntegrationHub';
import IntegrationTemplates from './pages/IntegrationTemplates';
import Integrations from './pages/Integrations';
import IntelligentAutomation from './pages/IntelligentAutomation';
import IntelligentInterface from './pages/IntelligentInterface';
import LLMSettings from './pages/LLMSettings';
import Landing from './pages/Landing';
import Login from './pages/Login';
import MLIntegration from './pages/MLIntegration';
import Marketplace from './pages/Marketplace';
import MarketplaceExtensions from './pages/MarketplaceExtensions';
import MediaStudio from './pages/MediaStudio';
import MedicalAI from './pages/MedicalAI';
import MobileStudio from './pages/MobileStudio';
import Monetization from './pages/Monetization';
import Monitoring from './pages/Monitoring';
import NFTMarketplace from './pages/NFTMarketplace';
import NFTStudio from './pages/NFTStudio';
import Notifications from './pages/Notifications';
import Observability from './pages/Observability';
import PageEditor from './pages/PageEditor';
import PerformanceScalability from './pages/PerformanceScalability';
import PredictiveAnalytics from './pages/PredictiveAnalytics';
import Pricing from './pages/Pricing';
import ProductAnalytics from './pages/ProductAnalytics';
import Profile from './pages/Profile';
import ProjectDiagnostics from './pages/ProjectDiagnostics';
import ProjectExport from './pages/ProjectExport';
import ProjectScaffolder from './pages/ProjectScaffolder';
import ProjectSettings from './pages/ProjectSettings';
import ProjectTasks from './pages/ProjectTasks';
import ProjectViewer from './pages/ProjectViewer';
import Projects from './pages/Projects';
import QuantumLab from './pages/QuantumLab';
import RateLimits from './pages/RateLimits';
import RbacTenancy from './pages/RbacTenancy';
import RealtimeCollaboration from './pages/RealtimeCollaboration';
import ReferralProgram from './pages/ReferralProgram';
import Register from './pages/Register';
import ReportingAnalytics from './pages/ReportingAnalytics';
import Roadmap from './pages/Roadmap';
import RoleManagement from './pages/RoleManagement';
import SearchAnalytics from './pages/SearchAnalytics';
import Security from './pages/Security';
import SecurityFeatures from './pages/SecurityFeatures';
import SmartDeployment from './pages/SmartDeployment';
import SocialMediaHub from './pages/SocialMediaHub';
import SubscriptionSuccess from './pages/SubscriptionSuccess';
import Subscriptions from './pages/Subscriptions';
import SuperiorAIStudio from './pages/SuperiorAIStudio';
import Support from './pages/Support';
import SystemHealth from './pages/SystemHealth';
import SystemStatus from './pages/SystemStatus';
import TeamCollaboration from './pages/TeamCollaboration';
import TeamManagement from './pages/TeamManagement';
import TemplateMarketplace from './pages/TemplateMarketplace';
import TokenCreator from './pages/TokenCreator';
import TwoFactorAuth from './pages/TwoFactorAuth';
import VSCodeIntegration from './pages/VSCodeIntegration';
import VisualizationStudio from './pages/VisualizationStudio';
import Web3Dashboard from './pages/Web3Dashboard';
import WebhookMonitor from './pages/WebhookMonitor';
import WorkflowBuilder from './pages/WorkflowBuilder';
import SecurityCenter from './pages/SecurityCenter';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AGIStudio": AGIStudio,
    "AIAssistant": AIAssistant,
    "AIDeployment": AIDeployment,
    "AIMonitoring": AIMonitoring,
    "AITemplates": AITemplates,
    "APIExplorer": APIExplorer,
    "APIKeyManager": APIKeyManager,
    "APIKeys": APIKeys,
    "Account": Account,
    "AdminAIControl": AdminAIControl,
    "AdminAPIKeys": AdminAPIKeys,
    "AdminAgentControl": AdminAgentControl,
    "AdminAnalytics": AdminAnalytics,
    "AdminCoaching": AdminCoaching,
    "AdminDashboard": AdminDashboard,
    "AdminDeployments": AdminDeployments,
    "AdminMonitoring": AdminMonitoring,
    "AdminSecrets": AdminSecrets,
    "AdminSubscriptions": AdminSubscriptions,
    "AdminSystemConfig": AdminSystemConfig,
    "AdminTemplates": AdminTemplates,
    "AdminUserManagement": AdminUserManagement,
    "AdvancedAnomalyDetection": AdvancedAnomalyDetection,
    "AdvancedSearch": AdvancedSearch,
    "Analytics": Analytics,
    "AnalyticsPage": AnalyticsPage,
    "AuditLog": AuditLog,
    "BotBuilder": BotBuilder,
    "CentralAnalytics": CentralAnalytics,
    "ChatbotManager": ChatbotManager,
    "CodeGenerator": CodeGenerator,
    "CodePlayground": CodePlayground,
    "CodeRefactoring": CodeRefactoring,
    "CodeReview": CodeReview,
    "Collaboration-old": collaborationOld,
    "Collaboration": Collaboration,
    "CollaborationHub": CollaborationHub,
    "ComponentBuilder": ComponentBuilder,
    "Components": Components,
    "ContentStudio": ContentStudio,
    "ContractBuilder": ContractBuilder,
    "CryptoExchange": CryptoExchange,
    "CryptoGambling": CryptoGambling,
    "CustomAgentStudio": CustomAgentStudio,
    "DAOGovernance": DAOGovernance,
    "Dashboard": Dashboard,
    "DataAnalytics": DataAnalytics,
    "DataPipeline": DataPipeline,
    "DataPrivacy": DataPrivacy,
    "DeFiHub": DeFiHub,
    "Deployments": Deployments,
    "DeveloperExperience": DeveloperExperience,
    "EmailAssistant": EmailAssistant,
    "EmailCampaigns": EmailCampaigns,
    "EnterpriseIntelligence": EnterpriseIntelligence,
    "EnterpriseSecurity": EnterpriseSecurity,
    "EnterpriseValuation": EnterpriseValuation,
    "EntityDesigner": EntityDesigner,
    "EnvironmentVariables": EnvironmentVariables,
    "ExternalBotIntegrations": ExternalBotIntegrations,
    "FeatureFlags": FeatureFlags,
    "FeedbackAnalytics": FeedbackAnalytics,
    "FunctionBuilder": FunctionBuilder,
    "FunctionValidator": FunctionValidator,
    "GamingPlatform": GamingPlatform,
    "GitHubConnect": GitHubConnect,
    "GovernmentTools": GovernmentTools,
    "Guide": Guide,
    "IncidentIntelligence": IncidentIntelligence,
    "IntegrationAnalytics": IntegrationAnalytics,
    "IntegrationEcosystem": IntegrationEcosystem,
    "IntegrationHub": IntegrationHub,
    "IntegrationTemplates": IntegrationTemplates,
    "Integrations": Integrations,
    "IntelligentAutomation": IntelligentAutomation,
    "IntelligentInterface": IntelligentInterface,
    "LLMSettings": LLMSettings,
    "Landing": Landing,
    "Login": Login,
    "MLIntegration": MLIntegration,
    "Marketplace": Marketplace,
    "MarketplaceExtensions": MarketplaceExtensions,
    "MediaStudio": MediaStudio,
    "MedicalAI": MedicalAI,
    "MobileStudio": MobileStudio,
    "Monetization": Monetization,
    "Monitoring": Monitoring,
    "NFTMarketplace": NFTMarketplace,
    "NFTStudio": NFTStudio,
    "Notifications": Notifications,
    "Observability": Observability,
    "PageEditor": PageEditor,
    "PerformanceScalability": PerformanceScalability,
    "PredictiveAnalytics": PredictiveAnalytics,
    "Pricing": Pricing,
    "ProductAnalytics": ProductAnalytics,
    "Profile": Profile,
    "ProjectDiagnostics": ProjectDiagnostics,
    "ProjectExport": ProjectExport,
    "ProjectScaffolder": ProjectScaffolder,
    "ProjectSettings": ProjectSettings,
    "ProjectTasks": ProjectTasks,
    "ProjectViewer": ProjectViewer,
    "Projects": Projects,
    "QuantumLab": QuantumLab,
    "RateLimits": RateLimits,
    "RbacTenancy": RbacTenancy,
    "RealtimeCollaboration": RealtimeCollaboration,
    "ReferralProgram": ReferralProgram,
    "Register": Register,
    "ReportingAnalytics": ReportingAnalytics,
    "Roadmap": Roadmap,
    "RoleManagement": RoleManagement,
    "SearchAnalytics": SearchAnalytics,
    "Security": Security,
    "SecurityFeatures": SecurityFeatures,
    "SmartDeployment": SmartDeployment,
    "SocialMediaHub": SocialMediaHub,
    "SubscriptionSuccess": SubscriptionSuccess,
    "Subscriptions": Subscriptions,
    "SuperiorAIStudio": SuperiorAIStudio,
    "Support": Support,
    "SystemHealth": SystemHealth,
    "SystemStatus": SystemStatus,
    "TeamCollaboration": TeamCollaboration,
    "TeamManagement": TeamManagement,
    "TemplateMarketplace": TemplateMarketplace,
    "TokenCreator": TokenCreator,
    "TwoFactorAuth": TwoFactorAuth,
    "VSCodeIntegration": VSCodeIntegration,
    "VisualizationStudio": VisualizationStudio,
    "Web3Dashboard": Web3Dashboard,
    "WebhookMonitor": WebhookMonitor,
    "WorkflowBuilder": WorkflowBuilder,
    "SecurityCenter": SecurityCenter,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};