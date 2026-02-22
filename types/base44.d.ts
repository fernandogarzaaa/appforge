declare module 'npm:@base44/sdk@0.8.6' {
  export * from '@base44/sdk';
}

declare module 'https://esm.sh/@base44/sdk@0.8.18' {
  export * from '@base44/sdk';
}

declare module 'npm:@base44/sdk@0.8.18' {
  export * from '@base44/sdk';
}

declare module '@base44/sdk' {
  export interface AuthClient {
    me(): Promise<{ id?: string; email?: string; name?: string; role?: string; full_name?: string }>;
    getLoginUrl(redirect?: string): string;
    redirectToLogin(redirect?: string): void;
    logout(): void;
    getCurrentUser(): Promise<any>;
    loginViaEmailPassword(credentials: any): Promise<any>;
  }

  export interface FunctionsModule {
    execute(functionName: string, data?: Record<string, any>): Promise<any>;
    invoke(functionName: string, data?: Record<string, any>): Promise<any>;
    call(functionName: string, data?: Record<string, any>): Promise<any>;
  }

  export interface EntityCRUD<T = any> {
    filter(query: Partial<T>, sort?: string, limit?: number, skip?: number, fields?: string[]): Promise<T[]>;
    list(sort?: string, limit?: number, skip?: number, fields?: string[]): Promise<T[]>;
    get(id: string): Promise<T>;
    create(data: Partial<T>): Promise<T>;
    update(id: string, data: Partial<T>): Promise<T>;
    delete(id: string): Promise<{ success: boolean }>;
    deleteMany(query: Partial<T>): Promise<{ success: boolean; deleted: number }>;
    bulkCreate(data: Partial<T>[]): Promise<T[]>;
    query(options: any): Promise<T[]>;
    insert(data: Partial<T>): Promise<T>;
    subscribe(callback: (event: { type: string; data: T; id: string; timestamp: string }) => void): () => void;
  }

  export interface EntitiesModule {
    [key: string]: EntityCRUD | any;

    Project?: EntityCRUD;
    Entity?: EntityCRUD;
    Page?: EntityCRUD;
    Component?: EntityCRUD;
    Function?: EntityCRUD;
    Workflow?: EntityCRUD;
    Bot?: EntityCRUD;
    Agent?: EntityCRUD;
    UserPermission?: EntityCRUD;
    CoachingSystemConfig?: EntityCRUD;
    CoachingSystemMetrics?: EntityCRUD;
    SolanaTransaction?: EntityCRUD;
    CoachingAuditLog?: EntityCRUD;
    AIAgentConfig?: EntityCRUD;
    ProjectHealthReport?: EntityCRUD;
    GitHubAutomationLog?: EntityCRUD;
    ProjectGitHubIntegration?: EntityCRUD;
    SystemHealthMetric?: EntityCRUD;
    ModelPerformanceMetric?: EntityCRUD;
    AgentCoachingRecommendation?: EntityCRUD;
    CustomAgent?: EntityCRUD;
    AgentCollaboration?: EntityCRUD;
    Automation?: EntityCRUD;
    UserPreference?: EntityCRUD;
    QuantumLLMConfig?: EntityCRUD;
    APIKey?: EntityCRUD;
    Deployment?: EntityCRUD;
    DeploymentLog?: EntityCRUD;
    EnvironmentVariable?: EntityCRUD;
    ProjectFavorite?: EntityCRUD;
    User?: EntityCRUD;
    TeamMember?: EntityCRUD;
    TeamInvite?: EntityCRUD;
    Chatbot?: EntityCRUD;
    BotPipeline?: EntityCRUD;
    IntegrationConnection?: EntityCRUD;
    AlertConfiguration?: EntityCRUD;
    MonitoringRule?: EntityCRUD;
    Task?: EntityCRUD;
    IncidentIntegration?: EntityCRUD;
    ScheduledDowntime?: EntityCRUD;
    AlertPreference?: EntityCRUD;
    AnomalyAlert?: EntityCRUD;
    QuantumBackend?: EntityCRUD;
    AIAgent?: EntityCRUD;
    Learning?: EntityCRUD;
    HyperparameterTuning?: EntityCRUD;
    ProjectDocument?: EntityCRUD;
    GuidedLearningWorkflow?: EntityCRUD;
    CustomAgentConfig?: EntityCRUD;
    AIAgentTask?: EntityCRUD;
    AITask?: EntityCRUD;
    AIInsight?: EntityCRUD;
    WorkflowExecution?: EntityCRUD;
    DataSourceConnector?: EntityCRUD;
    AgentDeployment?: EntityCRUD;
    CodeSnippet?: EntityCRUD;
    ProactiveAIConfig?: EntityCRUD;
    ProactiveAssistance?: EntityCRUD;
    AnomalyTimeline?: EntityCRUD;
    CausalRelationship?: EntityCRUD;
    AnomalyImpactScore?: EntityCRUD;
    MultiDimensionalAnomaly?: EntityCRUD;
    Subscription?: EntityCRUD;
    AuditLog?: EntityCRUD;
    BotWorkflow?: EntityCRUD;
    AutoFixCategory?: EntityCRUD;
    NeuralBridgeConfig?: EntityCRUD;
    RealityGuardMetric?: EntityCRUD;
    SwarmIntelligenceNode?: EntityCRUD;
    KnowledgeGraphEdge?: EntityCRUD;
    ComplianceCheck?: EntityCRUD;
    ExperimentationLog?: EntityCRUD;
    AIEconomyMetric?: EntityCRUD;
    TradingBenchmark?: EntityCRUD;
    AutonomousTrade?: EntityCRUD;
    AuditCollective?: EntityCRUD;
    BotActivityLog?: EntityCRUD;
    PromptTemplate?: EntityCRUD;
    UserInternalPermission?: EntityCRUD;
    Notification?: EntityCRUD;
    ProjectSetting?: EntityCRUD;
    SystemAlert?: EntityCRUD;
    NetworkTopology?: EntityCRUD;
    CloudResource?: EntityCRUD;
    CostMetric?: EntityCRUD;
    PerformanceProfile?: EntityCRUD;
    Securityvulnerability?: EntityCRUD;
    DependencyGraph?: EntityCRUD;
    CIBuild?: EntityCRUD;
    TestResult?: EntityCRUD;
    ReleaseNote?: EntityCRUD;
    InfrastructureTemplate?: EntityCRUD;
    SwarmConfig?: EntityCRUD;
    SwarmMemory?: EntityCRUD;
    AgentRole?: EntityCRUD;
    AgentTool?: EntityCRUD;
    CollectiveInsight?: EntityCRUD;
    RealityCheck?: EntityCRUD;
    DataConnector?: EntityCRUD;
    MetricThreshold?: EntityCRUD;
    Incident?: EntityCRUD;
    Comment?: EntityCRUD;
    Attachment?: EntityCRUD;
    Tag?: EntityCRUD;
    Category?: EntityCRUD;
    Status?: EntityCRUD;
    Priority?: EntityCRUD;
    Severity?: EntityCRUD;
    Impact?: EntityCRUD;
    Risk?: EntityCRUD;
    Recommendation?: EntityCRUD;
    Insight?: EntityCRUD;
    Report?: EntityCRUD;
    Dashboard?: EntityCRUD;
    Widget?: EntityCRUD;
    Chart?: EntityCRUD;
    Visualization?: EntityCRUD;
    DataSource?: EntityCRUD;
    Connector?: EntityCRUD;
    Integration?: EntityCRUD;
    Webhook?: EntityCRUD;
    EmailConfig?: EntityCRUD;
    SlackConfig?: EntityCRUD;
    DiscordConfig?: EntityCRUD;
    TelegramConfig?: EntityCRUD;
    TwilioConfig?: EntityCRUD;
    SendGridConfig?: EntityCRUD;
    GitHubConfig?: EntityCRUD;
    GitLabConfig?: EntityCRUD;
    BitbucketConfig?: EntityCRUD;
    AzureDevOpsConfig?: EntityCRUD;
    AWSConfig?: EntityCRUD;
    GCPConfig?: EntityCRUD;
    AzureConfig?: EntityCRUD;
    DigitalOceanConfig?: EntityCRUD;
    HerokuConfig?: EntityCRUD;
    VercelConfig?: EntityCRUD;
    NetlifyConfig?: EntityCRUD;
    RailwayConfig?: EntityCRUD;
    RenderConfig?: EntityCRUD;
    FlyIoConfig?: EntityCRUD;
    SupabaseConfig?: EntityCRUD;
    FirebaseConfig?: EntityCRUD;
    AppwriteConfig?: EntityCRUD;
    PocketBaseConfig?: EntityCRUD;
    PostgresConfig?: EntityCRUD;
    MySQLConfig?: EntityCRUD;
    MongoDBConfig?: EntityCRUD;
    RedisConfig?: EntityCRUD;
    ElasticsearchConfig?: EntityCRUD;
    PrismaConfig?: EntityCRUD;
    DrizzleConfig?: EntityCRUD;
    MongooseConfig?: EntityCRUD;
    SequelizeConfig?: EntityCRUD;
    TypeORMConfig?: EntityCRUD;
    KnexConfig?: EntityCRUD;
    ZodSchema?: EntityCRUD;
    JoiSchema?: EntityCRUD;
    YupSchema?: EntityCRUD;
    AjvSchema?: EntityCRUD;
  }

  export interface PagesModule {
    list(options?: any): Promise<any[]>;
    get(id: string): Promise<any>;
    create(data: any): Promise<any>;
    update(id: string, data: any): Promise<any>;
    delete(id: string): Promise<{ success: boolean }>;
  }

  export interface ComponentsModule {
    list(options?: any): Promise<any[]>;
    get(id: string): Promise<any>;
    create(data: any): Promise<any>;
    update(id: string, data: any): Promise<any>;
    delete(id: string): Promise<{ success: boolean }>;
  }

  export interface DataModule {
    query(entity: string, options?: any): Promise<any[]>;
    get(entity: string, id: string): Promise<any>;
    create(entity: string, data: any): Promise<any>;
    update(entity: string, id: string, data: any): Promise<any>;
    delete(entity: string, id: string): Promise<{ success: boolean }>;
  }

  export interface StorageModule {
    upload(file: any): Promise<{ url: string }>;
    delete(url: string): Promise<{ success: boolean }>;
  }

  export interface Base44Client {
    auth: AuthClient;
    functions: FunctionsModule;
    entities: EntitiesModule;
    pages: PagesModule;
    components: ComponentsModule;
    data: DataModule;
    storage: StorageModule;
    integrations: any;
    asServiceRole: Base44Client;
    analytics: {
      capture(event: string, properties?: any): Promise<{ skipped: boolean }>;
      flush(): Promise<{ skipped: boolean }>;
    };
    log(message: any, context?: any): void;
    agents: any;
    // Top-level shortcuts sometimes available
    query?: (entity: string, options?: any) => Promise<any[]>;
    create?: (entity: string, data: any) => Promise<any>;
    update?: (entity: string, id: string, data: any) => Promise<any>;
    delete?: (entity: string, id: string) => Promise<{ success: boolean }>;
    queries?: any;
    mutations?: any;
    appLogs?: any;
    cleanup?: () => void;
    setToken?: (token: string) => void;
    getConfig?: () => any;
  }

  export interface CreateClientOptions {
    appId: string;
    token?: string;
    functionsVersion?: string;
    serverUrl?: string;
    requiresAuth?: boolean;
    appBaseUrl?: string;
  }

  export function createClient(options: CreateClientOptions): Base44Client;
  export function createClientFromRequest(req: Request): Base44Client;
}
