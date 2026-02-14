import { lazy, Suspense } from 'react';
import PageLoader from './components/common/PageLoader';
import __Layout from './Layout.jsx';

// Core pages - loaded eagerly (small, frequently used)
import Dashboard from './pages/DashboardNew';
import Projects from './pages/ProjectsNew';
import Login from './pages/Login';
import Register from './pages/Register';

// Lazy load all other pages for code splitting
const AdvancedSearch = lazy(() => import('./pages/AdvancedSearch'));
const AGIStudio = lazy(() => import('./pages/AGIStudio'));
const AIAssistant = lazy(() => import('./pages/AIAssistant'));
const AIAgentControl = lazy(() => import('./pages/AIAgentControl'));
const AIDeployment = lazy(() => import('./pages/AIDeployment'));
const AIMonitoring = lazy(() => import('./pages/AIMonitoring'));
const AITemplates = lazy(() => import('./pages/AITemplates'));
const APIExplorer = lazy(() => import('./pages/APIExplorer'));
const APIKeyManager = lazy(() => import('./pages/APIKeyManager'));
const APIManagement = lazy(() => import('./pages/APIManagement'));
const Account = lazy(() => import('./pages/Account'));
const AuditLog = lazy(() => import('./pages/AuditLog'));
const AdminAPIKeys = lazy(() => import('./pages/AdminAPIKeys'));
const AdminAIControl = lazy(() => import('./pages/AdminAIControl'));
const AdminAgentControl = lazy(() => import('./pages/AdminAgentControl'));
const AdminAgents = lazy(() => import('./pages/AdminAgents'));
const AdminAnalytics = lazy(() => import('./pages/AdminAnalytics'));
const AdminCoaching = lazy(() => import('./pages/AdminCoaching'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AdminDeployments = lazy(() => import('./pages/AdminDeployments'));
const AdminQuantumBackends = lazy(() => import('./pages/AdminQuantumBackends'));
const AdminMonitoring = lazy(() => import('./pages/AdminMonitoring'));
const AdminSecrets = lazy(() => import('./pages/AdminSecrets'));
const AdminSubscriptions = lazy(() => import('./pages/AdminSubscriptions'));
const AdminSystemConfig = lazy(() => import('./pages/AdminSystemConfig'));
const AdminTemplates = lazy(() => import('./pages/AdminTemplates'));
const AdminUserManagement = lazy(() => import('./pages/AdminUserManagement'));
const AdvancedAnomalyDetection = lazy(() => import('./pages/AdvancedAnomalyDetection'));
const Analytics = lazy(() => import('./pages/Analytics'));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'));
const BotBuilder = lazy(() => import('./pages/BotBuilder'));
const CodeGenerator = lazy(() => import('./pages/CodeGenerator'));
const CentralAnalytics = lazy(() => import('./pages/CentralAnalytics'));
const ChatbotManager = lazy(() => import('./pages/ChatbotManager'));
const ComponentBuilder = lazy(() => import('./pages/ComponentBuilder'));
const CodeRefactoring = lazy(() => import('./pages/CodeRefactoring'));
const CodeReview = lazy(() => import('./pages/CodeReview'));
const CodePlayground = lazy(() => import('./pages/CodePlayground'));
const Collaboration = lazy(() => import('./pages/Collaboration'));
const CollaborationHub = lazy(() => import('./pages/CollaborationHub'));
const Components = lazy(() => import('./pages/Components'));
const ContentStudio = lazy(() => import('./pages/ContentStudio'));
const ContractBuilder = lazy(() => import('./pages/ContractBuilder'));
const CryptoExchange = lazy(() => import('./pages/CryptoExchange'));
const CryptoGambling = lazy(() => import('./pages/CryptoGambling'));
const CustomAgentStudio = lazy(() => import('./pages/CustomAgentStudio'));
const DAOGovernance = lazy(() => import('./pages/DAOGovernance'));
const DataAnalytics = lazy(() => import('./pages/DataAnalytics'));
const DataPipeline = lazy(() => import('./pages/DataPipeline'));
const DataPrivacy = lazy(() => import('./pages/DataPrivacy'));
const DeFiHub = lazy(() => import('./pages/DeFiHub'));
const DesignSystem = lazy(() => import('./pages/DesignSystem'));
const Deployments = lazy(() => import('./pages/Deployments'));
const DeveloperExperience = lazy(() => import('./pages/DeveloperExperience'));
const EmailAssistant = lazy(() => import('./pages/EmailAssistant'));
const EmailCampaigns = lazy(() => import('./pages/EmailCampaigns'));
const EnterpriseIntelligence = lazy(() => import('./pages/EnterpriseIntelligence'));
const EnterpriseSecurity = lazy(() => import('./pages/EnterpriseSecurity'));
const EnterpriseValuation = lazy(() => import('./pages/EnterpriseValuation'));
const EntityDesigner = lazy(() => import('./pages/EntityDesigner'));
const EnvironmentVariables = lazy(() => import('./pages/EnvironmentVariables'));
const ExternalBotIntegrations = lazy(() => import('./pages/ExternalBotIntegrations'));
const FeatureFlags = lazy(() => import('./pages/FeatureFlags'));
const FeedbackAnalytics = lazy(() => import('./pages/FeedbackAnalytics'));
const FunctionBuilder = lazy(() => import('./pages/FunctionBuilder'));
const FunctionValidator = lazy(() => import('./pages/FunctionValidator'));
const GamingPlatform = lazy(() => import('./pages/GamingPlatform'));
const GitHubConnect = lazy(() => import('./pages/GitHubConnect'));
const GovernmentTools = lazy(() => import('./pages/GovernmentTools'));
const Guide = lazy(() => import('./pages/Guide'));
const IntelligentAutomation = lazy(() => import('./pages/IntelligentAutomation'));
const IntelligentInterface = lazy(() => import('./pages/IntelligentInterface'));
const IncidentIntelligence = lazy(() => import('./pages/IncidentIntelligence'));
const IntegrationAnalytics = lazy(() => import('./pages/IntegrationAnalytics'));
const IntegrationHub = lazy(() => import('./pages/IntegrationHub'));
const IntegrationTemplates = lazy(() => import('./pages/IntegrationTemplates'));
const IntegrationEcosystem = lazy(() => import('./pages/IntegrationEcosystem'));
const Integrations = lazy(() => import('./pages/Integrations'));
const LandingNew = lazy(() => import('./pages/LandingNew'));
const LLMSettings = lazy(() => import('./pages/LLMSettings'));
const MediaStudio = lazy(() => import('./pages/MediaStudio'));
const MarketplaceExtensions = lazy(() => import('./pages/MarketplaceExtensions'));
const MedicalAI = lazy(() => import('./pages/MedicalAI'));
const MobileStudio = lazy(() => import('./pages/MobileStudio'));
const Monetization = lazy(() => import('./pages/Monetization'));
const MLIntegration = lazy(() => import('./pages/MLIntegration'));
const NFTMarketplace = lazy(() => import('./pages/NFTMarketplace'));
const NFTStudio = lazy(() => import('./pages/NFTStudio'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Observability = lazy(() => import('./pages/Observability'));
const PerformanceScalability = lazy(() => import('./pages/PerformanceScalability'));
const PageEditor = lazy(() => import('./pages/PageEditor'));
const PredictiveAnalytics = lazy(() => import('./pages/PredictiveAnalytics'));
const ProjectViewer = lazy(() => import('./pages/ProjectViewer'));
const ProjectExport = lazy(() => import('./pages/ProjectExport'));
const Pricing = lazy(() => import('./pages/Pricing'));
const ProductAnalytics = lazy(() => import('./pages/ProductAnalytics'));
const Profile = lazy(() => import('./pages/Profile'));
const ProjectDiagnostics = lazy(() => import('./pages/ProjectDiagnostics'));
const ProjectScaffolder = lazy(() => import('./pages/ProjectScaffolder'));
const ProjectSettings = lazy(() => import('./pages/ProjectSettings'));
const RateLimits = lazy(() => import('./pages/RateLimits'));
const QuantumLab = lazy(() => import('./pages/QuantumLab'));
const ProjectTasks = lazy(() => import('./pages/ProjectTasks'));
const RbacTenancy = lazy(() => import('./pages/RbacTenancy'));
const RealtimeCollaboration = lazy(() => import('./pages/RealtimeCollaboration'));
const ReferralProgram = lazy(() => import('./pages/ReferralProgram'));
const ReportingAnalytics = lazy(() => import('./pages/ReportingAnalytics'));
const Roadmap = lazy(() => import('./pages/Roadmap'));
const RoleManagement = lazy(() => import('./pages/RoleManagement'));
const SecurityFeatures = lazy(() => import('./pages/SecurityFeatures'));
const SecurityCenter = lazy(() => import('./pages/SecurityCenter'));
const Security = lazy(() => import('./pages/Security'));
const SearchAnalytics = lazy(() => import('./pages/SearchAnalytics'));
const SocialMediaHub = lazy(() => import('./pages/SocialMediaHub'));
const Settings = lazy(() => import('./pages/Settings'));
const SubscriptionSuccess = lazy(() => import('./pages/SubscriptionSuccess'));
const SuperIntelligenceDashboard = lazy(() => import('./pages/SuperIntelligenceDashboard'));
const Support = lazy(() => import('./pages/Support'));
const SmartDeployment = lazy(() => import('./pages/SmartDeployment'));
const SuperiorAIStudio = lazy(() => import('./pages/SuperiorAIStudio'));
const SystemHealth = lazy(() => import('./pages/SystemHealth'));
const SystemStatus = lazy(() => import('./pages/SystemStatus'));
const TeamCollaboration = lazy(() => import('./pages/TeamCollaboration'));
const TeamManagement = lazy(() => import('./pages/TeamManagement'));
const TemplateMarketplace = lazy(() => import('./pages/TemplateMarketplace'));
const TokenCreator = lazy(() => import('./pages/TokenCreator'));
const TwoFactorAuth = lazy(() => import('./pages/TwoFactorAuth'));
const VSCodeIntegration = lazy(() => import('./pages/VSCodeIntegration'));
const VisualizationStudio = lazy(() => import('./pages/VisualizationStudio'));
const Web3Dashboard = lazy(() => import('./pages/Web3Dashboard'));
const WebhookMonitor = lazy(() => import('./pages/WebhookMonitor'));
const WorkflowBuilder = lazy(() => import('./pages/WorkflowBuilder'));
const CommandCenter = lazy(() => import('./pages/CommandCenter'));

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
  "AGIStudio": withSuspense(AGIStudio),
  "AIAssistant": withSuspense(AIAssistant),
  "AIAgentControl": withSuspense(AIAgentControl),
  "AIDeployment": withSuspense(AIDeployment),
  "AIMonitoring": withSuspense(AIMonitoring),
  "AITemplates": withSuspense(AITemplates),
  "APIExplorer": withSuspense(APIExplorer),
  "APIKeyManager": withSuspense(APIKeyManager),
  "APIManagement": withSuspense(APIManagement),
  "Account": withSuspense(Account),
  "AdminAPIKeys": withSuspense(AdminAPIKeys),
  "AdminAIControl": withSuspense(AdminAIControl),
  "AdminAgentControl": withSuspense(AdminAgentControl),
  "AdminAgents": withSuspense(AdminAgents),
  "AdminAnalytics": withSuspense(AdminAnalytics),
  "AdminCoaching": withSuspense(AdminCoaching),
  "AdminDashboard": withSuspense(AdminDashboard),
  "AdminDeployments": withSuspense(AdminDeployments),
  "AdminQuantumBackends": withSuspense(AdminQuantumBackends),
  "AdminMonitoring": withSuspense(AdminMonitoring),
  "AdminSecrets": withSuspense(AdminSecrets),
  "AdminSubscriptions": withSuspense(AdminSubscriptions),
  "AdminSystemConfig": withSuspense(AdminSystemConfig),
  "AdminTemplates": withSuspense(AdminTemplates),
  "AdminUserManagement": withSuspense(AdminUserManagement),
  "AdvancedAnomalyDetection": withSuspense(AdvancedAnomalyDetection),
  "AuditLog": withSuspense(AuditLog),
  "Analytics": withSuspense(Analytics),
  "AnalyticsPage": withSuspense(AnalyticsPage),
  "BotBuilder": withSuspense(BotBuilder),
  "CodeGenerator": withSuspense(CodeGenerator),
  "CentralAnalytics": withSuspense(CentralAnalytics),
  "Collaboration": withSuspense(Collaboration),
  "CollaborationHub": withSuspense(CollaborationHub),
  "ChatbotManager": withSuspense(ChatbotManager),
  "ComponentBuilder": withSuspense(ComponentBuilder),
  "CodeRefactoring": withSuspense(CodeRefactoring),
  "CodeReview": withSuspense(CodeReview),
  "CodePlayground": withSuspense(CodePlayground),
  "Components": withSuspense(Components),
  "ContentStudio": withSuspense(ContentStudio),
  "ContractBuilder": withSuspense(ContractBuilder),
  "CryptoExchange": withSuspense(CryptoExchange),
  "CryptoGambling": withSuspense(CryptoGambling),
  "CustomAgentStudio": withSuspense(CustomAgentStudio),
  "DAOGovernance": withSuspense(DAOGovernance),
  "Dashboard": Dashboard, // Core - eager load
  "DataAnalytics": withSuspense(DataAnalytics),
  "DataPipeline": withSuspense(DataPipeline),
  "DataPrivacy": withSuspense(DataPrivacy),
  "DeFiHub": withSuspense(DeFiHub),
  "DesignSystem": withSuspense(DesignSystem),
  "Deployments": withSuspense(Deployments),
  "DeveloperExperience": withSuspense(DeveloperExperience),
  "EmailAssistant": withSuspense(EmailAssistant),
  "EmailCampaigns": withSuspense(EmailCampaigns),
  "EnterpriseIntelligence": withSuspense(EnterpriseIntelligence),
  "EnterpriseSecurity": withSuspense(EnterpriseSecurity),
  "EnterpriseValuation": withSuspense(EnterpriseValuation),
  "EntityDesigner": withSuspense(EntityDesigner),
  "EnvironmentVariables": withSuspense(EnvironmentVariables),
  "ExternalBotIntegrations": withSuspense(ExternalBotIntegrations),
  "FeatureFlags": withSuspense(FeatureFlags),
  "FeedbackAnalytics": withSuspense(FeedbackAnalytics),
  "FunctionBuilder": withSuspense(FunctionBuilder),
  "FunctionValidator": withSuspense(FunctionValidator),
  "GamingPlatform": withSuspense(GamingPlatform),
  "GitHubConnect": withSuspense(GitHubConnect),
  "GovernmentTools": withSuspense(GovernmentTools),
  "Guide": withSuspense(Guide),
  "IntelligentAutomation": withSuspense(IntelligentAutomation),
  "IntelligentInterface": withSuspense(IntelligentInterface),
  "IncidentIntelligence": withSuspense(IncidentIntelligence),
  "IntegrationAnalytics": withSuspense(IntegrationAnalytics),
  "IntegrationHub": withSuspense(IntegrationHub),
  "IntegrationTemplates": withSuspense(IntegrationTemplates),
  "IntegrationEcosystem": withSuspense(IntegrationEcosystem),
  "Integrations": withSuspense(Integrations),
  "LLMSettings": withSuspense(LLMSettings),
  "Landing": withSuspense(LandingNew),
  "LandingNew": withSuspense(LandingNew),
  "Login": Login, // Auth - eager load
  "Register": Register, // Auth - eager load
  "MediaStudio": withSuspense(MediaStudio),
  "MarketplaceExtensions": withSuspense(MarketplaceExtensions),
  "MedicalAI": withSuspense(MedicalAI),
  "MobileStudio": withSuspense(MobileStudio),
  "Monetization": withSuspense(Monetization),
  "MLIntegration": withSuspense(MLIntegration),
  "NFTMarketplace": withSuspense(NFTMarketplace),
  "NFTStudio": withSuspense(NFTStudio),
  "Notifications": withSuspense(Notifications),
  "Observability": withSuspense(Observability),
  "PerformanceScalability": withSuspense(PerformanceScalability),
  "PageEditor": withSuspense(PageEditor),
  "PredictiveAnalytics": withSuspense(PredictiveAnalytics),
  "Pricing": withSuspense(Pricing),
  "ProductAnalytics": withSuspense(ProductAnalytics),
  "Profile": withSuspense(Profile),
  "ProjectDiagnostics": withSuspense(ProjectDiagnostics),
  "ProjectScaffolder": withSuspense(ProjectScaffolder),
  "ProjectExport": withSuspense(ProjectExport),
  "ProjectSettings": withSuspense(ProjectSettings),
  "ProjectTasks": withSuspense(ProjectTasks),
  "QuantumLab": withSuspense(QuantumLab),
  "RbacTenancy": withSuspense(RbacTenancy),
  "RealtimeCollaboration": withSuspense(RealtimeCollaboration),
  "Projects": Projects, // Core - eager load
  "projects/:id": withSuspense(ProjectViewer),
  "ReferralProgram": withSuspense(ReferralProgram),
  "ReportingAnalytics": withSuspense(ReportingAnalytics),
  "Roadmap": withSuspense(Roadmap),
  "RoleManagement": withSuspense(RoleManagement),
  "SecurityFeatures": withSuspense(SecurityFeatures),
  "SecurityCenter": withSuspense(SecurityCenter),
  "Security": withSuspense(Security),
  "SearchAnalytics": withSuspense(SearchAnalytics),
  "SocialMediaHub": withSuspense(SocialMediaHub),
  "Settings": withSuspense(Settings),
  "SubscriptionSuccess": withSuspense(SubscriptionSuccess),
  "SuperIntelligenceDashboard": withSuspense(SuperIntelligenceDashboard),
  "Support": withSuspense(Support),
  "SmartDeployment": withSuspense(SmartDeployment),
  "SuperiorAIStudio": withSuspense(SuperiorAIStudio),
  "SystemHealth": withSuspense(SystemHealth),
  "SystemStatus": withSuspense(SystemStatus),
  "TeamCollaboration": withSuspense(TeamCollaboration),
  "TeamManagement": withSuspense(TeamManagement),
  "TemplateMarketplace": withSuspense(TemplateMarketplace),
  "TokenCreator": withSuspense(TokenCreator),
  "TwoFactorAuth": withSuspense(TwoFactorAuth),
  "VSCodeIntegration": withSuspense(VSCodeIntegration),
  "VisualizationStudio": withSuspense(VisualizationStudio),
  "Web3Dashboard": withSuspense(Web3Dashboard),
  "WebhookMonitor": withSuspense(WebhookMonitor),
  "WorkflowBuilder": withSuspense(WorkflowBuilder),
  "CommandCenter": withSuspense(CommandCenter),
}

export const pagesConfig = {
  mainPage: "Dashboard",
  Pages: PAGES,
  Layout: __Layout,
  publicPages: ['LandingNew', 'Login', 'Register', 'Pricing', 'Guide']
};
