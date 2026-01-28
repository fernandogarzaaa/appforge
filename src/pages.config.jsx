import { lazy, Suspense } from 'react';
import PageLoader from './components/common/PageLoader';
import __Layout from './Layout.jsx';

// Core pages - loaded eagerly (small, frequently used)
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import Landing from './pages/Landing';

// Lazy load all other pages for code splitting
const AdvancedSearch = lazy(() => import('./pages/AdvancedSearch'));
const AIAssistant = lazy(() => import('./pages/AIAssistant'));
const AIMonitoring = lazy(() => import('./pages/AIMonitoring'));
const APIExplorer = lazy(() => import('./pages/APIExplorer'));
const APIKeyManager = lazy(() => import('./pages/APIKeyManager'));
const Account = lazy(() => import('./pages/Account'));
const AuditLog = lazy(() => import('./pages/AuditLog'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AdminSubscriptions = lazy(() => import('./pages/AdminSubscriptions'));
const AdvancedAnomalyDetection = lazy(() => import('./pages/AdvancedAnomalyDetection'));
const Analytics = lazy(() => import('./pages/Analytics'));
const BotBuilder = lazy(() => import('./pages/BotBuilder'));
const CentralAnalytics = lazy(() => import('./pages/CentralAnalytics'));
const ChatbotManager = lazy(() => import('./pages/ChatbotManager'));
const CodePlayground = lazy(() => import('./pages/CodePlayground'));
const Collaboration = lazy(() => import('./pages/Collaboration'));
const Components = lazy(() => import('./pages/Components'));
const ContentStudio = lazy(() => import('./pages/ContentStudio'));
const ContractBuilder = lazy(() => import('./pages/ContractBuilder'));
const CryptoExchange = lazy(() => import('./pages/CryptoExchange'));
const CryptoGambling = lazy(() => import('./pages/CryptoGambling'));
const DAOGovernance = lazy(() => import('./pages/DAOGovernance'));
const DataAnalytics = lazy(() => import('./pages/DataAnalytics'));
const DeFiHub = lazy(() => import('./pages/DeFiHub'));
const Deployments = lazy(() => import('./pages/Deployments'));
const EmailAssistant = lazy(() => import('./pages/EmailAssistant'));
const EmailCampaigns = lazy(() => import('./pages/EmailCampaigns'));
const EnterpriseIntelligence = lazy(() => import('./pages/EnterpriseIntelligence'));
const EntityDesigner = lazy(() => import('./pages/EntityDesigner'));
const EnvironmentVariables = lazy(() => import('./pages/EnvironmentVariables'));
const ExternalBotIntegrations = lazy(() => import('./pages/ExternalBotIntegrations'));
const FeatureFlags = lazy(() => import('./pages/FeatureFlags'));
const FeedbackAnalytics = lazy(() => import('./pages/FeedbackAnalytics'));
const FunctionValidator = lazy(() => import('./pages/FunctionValidator'));
const GamingPlatform = lazy(() => import('./pages/GamingPlatform'));
const GitHubConnect = lazy(() => import('./pages/GitHubConnect'));
const GovernmentTools = lazy(() => import('./pages/GovernmentTools'));
const Guide = lazy(() => import('./pages/Guide'));
const IntegrationAnalytics = lazy(() => import('./pages/IntegrationAnalytics'));
const IntegrationHub = lazy(() => import('./pages/IntegrationHub'));
const IntegrationTemplates = lazy(() => import('./pages/IntegrationTemplates'));
const Integrations = lazy(() => import('./pages/Integrations'));
const LLMSettings = lazy(() => import('./pages/LLMSettings'));
const MediaStudio = lazy(() => import('./pages/MediaStudio'));
const MedicalAI = lazy(() => import('./pages/MedicalAI'));
const MobileStudio = lazy(() => import('./pages/MobileStudio'));
const NFTMarketplace = lazy(() => import('./pages/NFTMarketplace'));
const NFTStudio = lazy(() => import('./pages/NFTStudio'));
const Notifications = lazy(() => import('./pages/Notifications'));
const PageEditor = lazy(() => import('./pages/PageEditor'));
const SystemStatus = lazy(() => import('./pages/SystemStatus'));
const PredictiveAnalytics = lazy(() => import('./pages/PredictiveAnalytics'));
const ProjectViewer = lazy(() => import('./pages/ProjectViewer'));
const ProjectExport = lazy(() => import('./pages/ProjectExport'));
const Pricing = lazy(() => import('./pages/Pricing'));
const Profile = lazy(() => import('./pages/Profile'));
const ProjectDiagnostics = lazy(() => import('./pages/ProjectDiagnostics'));
const ProjectSettings = lazy(() => import('./pages/ProjectSettings'));
const RateLimits = lazy(() => import('./pages/RateLimits'));
const ProjectTasks = lazy(() => import('./pages/ProjectTasks'));
const ReferralProgram = lazy(() => import('./pages/ReferralProgram'));
const Roadmap = lazy(() => import('./pages/Roadmap'));
const RoleManagement = lazy(() => import('./pages/RoleManagement'));
const SocialMediaHub = lazy(() => import('./pages/SocialMediaHub'));
const SubscriptionSuccess = lazy(() => import('./pages/SubscriptionSuccess'));
const Support = lazy(() => import('./pages/Support'));
const SystemHealth = lazy(() => import('./pages/SystemHealth'));
const TeamManagement = lazy(() => import('./pages/TeamManagement'));
const TemplateMarketplace = lazy(() => import('./pages/TemplateMarketplace'));
const TokenCreator = lazy(() => import('./pages/TokenCreator'));
const TwoFactorAuth = lazy(() => import('./pages/TwoFactorAuth'));
const VSCodeIntegration = lazy(() => import('./pages/VSCodeIntegration'));
const Web3Dashboard = lazy(() => import('./pages/Web3Dashboard'));
const WebhookMonitor = lazy(() => import('./pages/WebhookMonitor'));
const WorkflowBuilder = lazy(() => import('./pages/WorkflowBuilder'));

// Helper to wrap lazy components with Suspense
const withSuspense = (Component) => {
  return function SuspenseWrapper(props) {
    return (
      <Suspense fallback={<PageLoader />}>
        <Component {...props} />
      </Suspense>
    );
  };
};

const PAGES = {
    "AdvancedSearch": withSuspense(AdvancedSearch),
    "AIAssistant": withSuspense(AIAssistant),
    "AIMonitoring": withSuspense(AIMonitoring),
    "APIExplorer": withSuspense(APIExplorer),
    "APIKeyManager": withSuspense(APIKeyManager),
    "Account": withSuspense(Account),
    "AdminDashboard": withSuspense(AdminDashboard),
    "AdminSubscriptions": withSuspense(AdminSubscriptions),
    "AdvancedAnomalyDetection": withSuspense(AdvancedAnomalyDetection),
    "AuditLog": withSuspense(AuditLog),
    "Analytics": withSuspense(Analytics),
    "BotBuilder": withSuspense(BotBuilder),
    "CentralAnalytics": withSuspense(CentralAnalytics),
    "Collaboration": withSuspense(Collaboration),
    "ChatbotManager": withSuspense(ChatbotManager),
    "CodePlayground": withSuspense(CodePlayground),
    "Components": withSuspense(Components),
    "ContentStudio": withSuspense(ContentStudio),
    "ContractBuilder": withSuspense(ContractBuilder),
    "CryptoExchange": withSuspense(CryptoExchange),
    "CryptoGambling": withSuspense(CryptoGambling),
    "DAOGovernance": withSuspense(DAOGovernance),
    "Dashboard": Dashboard, // Core - eager load
    "DataAnalytics": withSuspense(DataAnalytics),
    "DeFiHub": withSuspense(DeFiHub),
    "Deployments": withSuspense(Deployments),
    "EmailAssistant": withSuspense(EmailAssistant),
    "EmailCampaigns": withSuspense(EmailCampaigns),
    "EnterpriseIntelligence": withSuspense(EnterpriseIntelligence),
    "EntityDesigner": withSuspense(EntityDesigner),
    "EnvironmentVariables": withSuspense(EnvironmentVariables),
    "ExternalBotIntegrations": withSuspense(ExternalBotIntegrations),
    "FeatureFlags": withSuspense(FeatureFlags),
    "FeedbackAnalytics": withSuspense(FeedbackAnalytics),
    "FunctionValidator": withSuspense(FunctionValidator),
    "GamingPlatform": withSuspense(GamingPlatform),
    "GitHubConnect": withSuspense(GitHubConnect),
    "GovernmentTools": withSuspense(GovernmentTools),
    "Guide": withSuspense(Guide),
    "IntegrationAnalytics": withSuspense(IntegrationAnalytics),
    "IntegrationHub": withSuspense(IntegrationHub),
    "IntegrationTemplates": withSuspense(IntegrationTemplates),
    "Integrations": withSuspense(Integrations),
    "Landing": Landing, // Core - eager load
    "LLMSettings": withSuspense(LLMSettings),
    "MediaStudio": withSuspense(MediaStudio),
    "MedicalAI": withSuspense(MedicalAI),
    "MobileStudio": withSuspense(MobileStudio),
    "NFTMarketplace": withSuspense(NFTMarketplace),
    "NFTStudio": withSuspense(NFTStudio),
    "Notifications": withSuspense(Notifications),
    "PageEditor": withSuspense(PageEditor),
    "SystemStatus": withSuspense(SystemStatus),
    "PredictiveAnalytics": withSuspense(PredictiveAnalytics),
    "Pricing": withSuspense(Pricing),
    "Profile": withSuspense(Profile),
    "ProjectDiagnostics": withSuspense(ProjectDiagnostics),
    "ProjectExport": withSuspense(ProjectExport),
    "ProjectSettings": withSuspense(ProjectSettings),
    "ProjectTasks": withSuspense(ProjectTasks),
    "Projects": Projects, // Core - eager load
    "projects/:id": withSuspense(ProjectViewer),
    "ReferralProgram": withSuspense(ReferralProgram),
    "Roadmap": withSuspense(Roadmap),
    "RoleManagement": withSuspense(RoleManagement),
    "SocialMediaHub": withSuspense(SocialMediaHub),
    "SubscriptionSuccess": withSuspense(SubscriptionSuccess),
    "Support": withSuspense(Support),
    "SystemHealth": withSuspense(SystemHealth),
    "TeamManagement": withSuspense(TeamManagement),
    "TemplateMarketplace": withSuspense(TemplateMarketplace),
    "TokenCreator": withSuspense(TokenCreator),
    "TwoFactorAuth": withSuspense(TwoFactorAuth),
    "VSCodeIntegration": withSuspense(VSCodeIntegration),
    "Web3Dashboard": withSuspense(Web3Dashboard),
    "WebhookMonitor": withSuspense(WebhookMonitor),
    "WorkflowBuilder": withSuspense(WorkflowBuilder),
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};
