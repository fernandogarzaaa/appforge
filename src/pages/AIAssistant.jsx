import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles, Send, Plus, Trash2, MessageSquare,
  Loader2, Copy, Check, Code, FileCode, Database,
  Globe, Brain, Zap, MessageCircle, ArrowLeft, BarChart3, ChevronDown,
  Rocket, Wand2
} from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { generateEnhancedEntities } from '@/utils/enhancedEntityGeneration';
import { generateBusinessContent } from '@/utils/intelligentContentGenerator';
import { AIAgent } from '@/utils/aiAgentCore';
import { extractDomainContext, generateDomainSpecificPlan } from '@/utils/domainContextExtractor';
import { QuantumEngine } from '@/utils/QuantumEngine';
import { detectLanguage, generateLocalizedContent } from '@/utils/multiLanguageSupport';
import { useLLM } from '@/contexts/LLMContext';
import ModelSelector from '@/components/ai/ModelSelector';
// Lazy load tool panels
const AIUsagePanel = React.lazy(() => import('@/components/ai/AIUsagePanel'));
const APIDiscoveryPanel = React.lazy(() => import('@/components/ai/APIDiscoveryPanel'));
const PredictiveModels = React.lazy(() => import('@/components/ai/PredictiveModels'));
const GitHubIntegration = React.lazy(() => import('@/components/ai/GitHubIntegration'));
const AdvancedAIFunctions = React.lazy(() => import('@/components/ai/AdvancedAIFunctions'));
const AutomationBuilder = React.lazy(() => import('@/components/ai/AutomationBuilder'));
const DocumentUpload = React.lazy(() => import('@/components/ai/DocumentUpload'));
const CodeReview = React.lazy(() => import('@/components/ai/CodeReview'));
const ProactiveSuggestions = React.lazy(() => import('@/components/ai/ProactiveSuggestions'));
const MobileAppBuilder = React.lazy(() => import('@/components/ai/MobileAppBuilder'));
const PersonalizationEngine = React.lazy(() => import('@/components/ai/PersonalizationEngine'));
const VoiceInput = React.lazy(() => import('@/components/ai/VoiceInput'));
// Lazy load heavy AI tool components
const CommandPalette = React.lazy(() => import('@/components/ai/CommandPalette'));
const SystemDiagnostics = React.lazy(() => import('@/components/diagnostics/SystemDiagnostics'));
const CodeSnippetLibrary = React.lazy(() => import('@/components/ai/CodeSnippetLibrary'));
const DeploymentChecklist = React.lazy(() => import('@/components/deployment/DeploymentChecklist'));
const AgentDeploymentPanel = React.lazy(() => import('@/components/ai/AgentDeploymentPanel'));
const AdvancedAITools = React.lazy(() => import('@/components/ai/AdvancedAITools'));
const ProjectAuditorEnhanced = React.lazy(() => import('@/components/ai/ProjectAuditorEnhanced'));
const ProactiveBugDetection = React.lazy(() => import('@/components/ai/ProactiveBugDetection'));
const CodeReviewPanel = React.lazy(() => import('@/components/ai/CodeReviewPanel'));
const ResourceMonitoringPanel = React.lazy(() => import('@/components/ai/ResourceMonitoringPanel'));
const ProjectWizard = React.lazy(() => import('@/components/ProjectWizard'));
const AIComponentGenerator = React.lazy(() => import('@/components/ai/AIComponentGenerator'));
const AITestingDebugger = React.lazy(() => import('@/components/ai/AITestingDebugger'));
const AIUXSuggestions = React.lazy(() => import('@/components/ai/AIUXSuggestions'));
const DocumentationGenerator = React.lazy(() => import('@/components/ai/DocumentationGenerator'));
const CodeReviewSuggestions = React.lazy(() => import('@/components/ai/CodeReviewSuggestions'));
const OptimizationSuggestions = React.lazy(() => import('@/components/ai/OptimizationSuggestions'));
// Quantum AI enhancements
const QuantumQueryAnalyzer = React.lazy(() => import('@/components/ai/QuantumQueryAnalyzer'));
const ProactiveQuantumSuggestions = React.lazy(() => import('@/components/ai/ProactiveQuantumSuggestions'));
const QuantumReportGenerator = React.lazy(() => import('@/components/ai/QuantumReportGenerator'));
const QuantumLearningEngine = React.lazy(() => import('@/components/ai/QuantumLearningEngine'));
const AutoAgentDeployer = React.lazy(() => import('@/components/ai/AutoAgentDeployer'));
const SuperIntelligenceDashboard = React.lazy(() => import('@/components/ai/SuperIntelligenceDashboard'));
const ProactiveAnticipationEngine = React.lazy(() => import('@/components/ai/ProactiveAnticipationEngine'));
const CustomAgentBuilder = React.lazy(() => import('@/components/ai/CustomAgentBuilder'));
const AgentCollaborationBuilder = React.lazy(() => import('@/components/ai/AgentCollaborationBuilder'));
const AgentCollaborationDashboard = React.lazy(() => import('@/components/ai/AgentCollaborationDashboard'));
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const quickActions = [
  { label: 'Generate Project', icon: Rocket, prompt: 'WIZARD_MODE', isWizard: true },
  { label: 'Quantum Queries', icon: Zap, panel: 'quantum_analyzer', desc: 'NLP-powered quantum simulations' },
  { label: 'Create Entity', icon: Database, prompt: 'Create a new entity called ' },
  { label: 'Build Page', icon: FileCode, prompt: 'Build a page that displays ' },
  { label: 'Generate Component', icon: Code, prompt: 'component', panel: 'component_generator' },
  { label: 'Find API', icon: Globe, prompt: 'Find a free API for ' },
  { label: 'Test & Debug', icon: Code, panel: 'testing_debugger' },
  { label: 'UX Suggestions', icon: Brain, panel: 'ux_suggestions' },
  { label: 'Generate Docs', icon: FileCode, panel: 'documentation', desc: 'Auto-generate documentation' },
  { label: 'Code Review', icon: Code, panel: 'code_review_ai', desc: 'AI-powered code suggestions' },
  { label: 'Optimize App', icon: Zap, panel: 'optimizations', desc: 'Performance & architecture tips' },
];

export default function AIAssistant() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [activePanel, setActivePanel] = useState(null);
  const [integratedAPIs, setIntegratedAPIs] = useState([]);
  const [user, setUser] = useState(null);
  const [suggestedTools, setSuggestedTools] = useState([]);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [aiAgent, setAiAgent] = useState(null);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [executionProgress, setExecutionProgress] = useState(null);
  const [agentMode, setAgentMode] = useState(false); // Toggle between chat and agent mode
  const [selectedProject, setSelectedProject] = useState(null);
  const [availableProjects, setAvailableProjects] = useState([]);
  const [showProjectSelector, setShowProjectSelector] = useState(false);
  const [showProjectWizard, setShowProjectWizard] = useState(false);
  const [quantumAnalysis, setQuantumAnalysis] = useState(null);
  const [userActivity, setUserActivity] = useState({});

  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  // LLM Context for model selection and usage tracking
  const { query: llmQuery, selectedModel, getModelInfo } = useLLM();

  // Initialize AI Agent
  useEffect(() => {
    const agent = new AIAgent(base44);
    setAiAgent(agent);
  }, []);

  const urlParams = new URLSearchParams(window.location.search);
  const urlProjectId = urlParams.get('projectId');
  const autoStart = urlParams.get('auto_start');
  const initialIdea = urlParams.get('idea');
  const queryClient = useQueryClient();
  const projectId = selectedProject?.id || urlProjectId;

  useEffect(() => {
    loadUser();
    loadProjects();

    // Set project from URL if provided
    if (urlProjectId && !selectedProject) {
      // Will be set once projects are loaded
    }

    // Command Palette keyboard shortcut - only trigger on Cmd+K or Ctrl+K
    const handleKeyDown = (e) => {
      // Don't intercept if user is typing in an input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Separate effect for auto-start to avoid dependency issues
  useEffect(() => {
    if (autoStart === 'true' && initialIdea && messages.length === 0) {
      const timer = setTimeout(() => {
        startAIAgentConversation(initialIdea);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [autoStart, initialIdea, messages.length]);

  const loadProjects = async () => {
    try {
      const projects = await base44.entities.Project.list();
      setAvailableProjects(projects || []);

      // Set project from URL if available
      if (urlProjectId && projects) {
        const matchedProject = projects.find(p => p.id === urlProjectId);
        if (matchedProject) {
          setSelectedProject(matchedProject);
        }
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
      toast.error('Failed to load projects');
    }
  };

  const loadUser = async () => {
    const userData = await base44.auth.me();
    setUser(userData);
  };

  const startAIAgentConversation = async (idea) => {
    // 🧠 QUANTUM-ENHANCED PROMPT PROCESSING
    // Step 1: Detect language and localization
    const languageInfo = detectLanguage(idea);
    const localizedContent = generateLocalizedContent({ name: 'Project' }, languageInfo);

    // Step 2: Use quantum AI to analyze the prompt with superposition (parallel exploration)
    const quantumAI = new QuantumInspiredAI();

    // Step 3: Extract domain context with AI
    const domainContext = extractDomainContext(idea);

    // Step 4: Use quantum decision making for ambiguous prompts
    let enhancedIdea = idea;
    let confidenceBoost = '';

    if (domainContext.domain) {
      const confidence = Math.round(domainContext.contextConfidence * 100);
      confidenceBoost = `\n\n🎯 **AI Analysis**: Detected **${domainContext.domainName}** business (${confidence}% confidence)\n💡 **Key Features**: ${domainContext.matchedKeywords.slice(0, 3).join(', ')}`;

      // Use quantum decision making to optimize feature selection
      try {
        const options = domainContext.specifications?.features?.map(f => ({
          name: f.name,
          criteria: {
            relevance: domainContext.matchedKeywords.some(k => f.name.toLowerCase().includes(k.toLowerCase())) ? 0.9 : 0.5,
            complexity: 0.6,
            value: f.priority === 'high' ? 0.9 : f.priority === 'medium' ? 0.7 : 0.5
          }
        })) || [];

        if (options.length > 0) {
          const optimalFeatures = quantumAI.quantumDecisionMaker(options, {
            relevance: 0.5,
            complexity: 0.2,
            value: 0.3
          });

          if (optimalFeatures && optimalFeatures.length > 0) {
            confidenceBoost += `\n🚀 **Recommended Features**: ${optimalFeatures.slice(0, 3).map(f => f.name).join(', ')}`;
          }
        }
      } catch (quantumError) {
        console.warn('Quantum optimization skipped:', quantumError);
      }
    }

    // Step 5: Add language and SEO information
    let languageBoost = '';
    if (languageInfo.detected && languageInfo.code !== 'en') {
      languageBoost = `\n🌍 **Language**: ${languageInfo.name} (${languageInfo.code.toUpperCase()})\n💱 **Currency**: ${localizedContent.currency.symbol} ${localizedContent.currency.name}`;
    }

    // Create initial welcome message from AI
    const welcomeMessage = {
      role: 'assistant',
      content: `🎉 Awesome! I'm building: **"${idea}"**${confidenceBoost}${languageBoost}\n\n✨ Let me ask a few quick questions to make it perfect:\n\n1. Who will use this? (e.g., customers, team members, personal)\n2. What's the #1 thing it should do?\n3. Any must-have features?\n\n💡 **Meanwhile, I'm already:**\n- 🧠 Analyzing with Quantum AI (Neural Network + Genetic Algorithm)
- 🌍 Multi-language support (${Object.keys(localizedContent.phrases).length}+ languages)
- 🎯 Domain-specific optimization
- 📈 Auto-SEO generation
- 🏗️ Creating your project
- 📊 Setting up the database
- 🎨 Building the pages\n\nJust answer when ready, or type "go" and I'll use smart defaults!`,
      timestamp: new Date().toISOString()
    };

    setMessages([welcomeMessage]);
    setIsLoading(true);

    try {
      // Smart project name extraction
      const extractProjectName = (text) => {
        // Remove common command words and extract meaningful name
        let cleaned = text
          .replace(/^(create|build|make|develop|generate|design)\s+/i, '')
          .replace(/\s+(landing\s+page|website|web\s+app|app|page|site|for\s+me)$/i, '')
          .replace(/\s+for\s+/i, ' - ')
          .trim();

        // Capitalize first letter of each word
        cleaned = cleaned.split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');

        return cleaned.substring(0, 50) || 'My Project';
      };

      const projectName = extractProjectName(idea);

      // Use domain-specific plan if available (high confidence)
      let detectedFeatures = {};
      let enhancedEntities = [];

      if (domainContext.domain && domainContext.contextConfidence > 0.7) {
        // Generate domain-specific plan with quantum optimization
        const domainPlan = generateDomainSpecificPlan(idea, domainContext);

        if (domainPlan && domainPlan.entities) {
          enhancedEntities = domainPlan.entities;
          detectedFeatures = domainPlan.metadata?.features || {};

          console.log('📋 Using domain-specific plan:', domainPlan.name);
          console.log('✨ Features:', Object.keys(detectedFeatures).filter(k => detectedFeatures[k]));
        }
      } else {
        // Fallback to traditional entity generation
        const entityGeneration = generateEnhancedEntities(idea);
        enhancedEntities = entityGeneration.entities;
        detectedFeatures = entityGeneration.features;
      }

      const newProject = await base44.entities.Project.create({
        name: projectName,
        description: idea,
        icon: '✨',
        color: '#8b5cf6',
        status: 'active',
        metadata: {
          ai_generated: true,
          quantum_enhanced: true,
          domain_context: domainContext.domain ? {
            type: domainContext.domainName,
            confidence: domainContext.contextConfidence,
            keywords: domainContext.matchedKeywords
          } : null,
          features: detectedFeatures,
          enhanced_schema: true,
          creation_timestamp: new Date().toISOString()
        }
      });

      // Show building progress
      setTimeout(async () => {
        const progressMessage = {
          role: 'assistant',
          content: `✅ **Project Created!**\n\n🏗️ **Building your website now:**\n\n⏳ Setting up database...\n⏳ Creating pages...\n⏳ Designing UI...`,
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, progressMessage]);

        // Actually create entities and pages based on the idea
        try {
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: `🔧 **Detected Features**: ${Object.entries(detectedFeatures).filter(([_, v]) => v).map(([k]) => k).join(', ') || 'basic website'}\n📦 **Creating ${enhancedEntities.length} entities** with advanced schemas, validations, and API endpoints...`
          }]);

          // Generate intelligent content based on business context
          let businessContent = null;
          try {
            businessContent = await generateBusinessContent(idea, base44);

            if (businessContent.context.businessName) {
              setMessages(prev => [...prev, {
                role: 'assistant',
                content: `🎯 **Understood!** Building website for **${businessContent.context.businessName}**\n✨ Generating realistic content for your ${businessContent.context.businessType}...`
              }]);
            }
          } catch (contentError) {
            console.error('Content generation error:', contentError);
            toast.warning('Content generation partially failed, proceeding with defaults');
          }

          // Create all enhanced entities with proper relationships and validations
          const createdEntities = [];
          for (const entityData of enhancedEntities) {
            const entity = await base44.entities.Entity.create({
              project_id: newProject.id,
              name: entityData.name,
              schema: entityData.schema,
              metadata: {
                indexes: entityData.indexes || [],
                relationships: entityData.relationships || [],
                api_endpoints: entityData.api_endpoints || {},
                features: detectedFeatures
              }
            });
            createdEntities.push(entity);
          }

          // Populate sample data if available (using entity map for intelligent routing)
          if (businessContent && businessContent.entityMap) {
            const totalItems = Object.values(businessContent.entityMap).reduce((sum, items) => sum + items.length, 0);
            const entityTypes = Object.keys(businessContent.entityMap);

            setMessages(prev => [...prev, {
              role: 'assistant',
              content: `📝 **Adding sample data**: ${totalItems} items across ${entityTypes.length} ${entityTypes.length === 1 ? 'entity' : 'entities'} (${businessContent.context.currency})...`
            }]);

            // Populate each entity type
            for (const [entityName, items] of Object.entries(businessContent.entityMap)) {
              const entity = createdEntities.find(e => e.name === entityName);
              if (entity && items && items.length > 0) {
                for (const item of items) {
                  try {
                    // Generate slug if not present
                    const itemData = {
                      ...item,
                      slug: item.slug || (item.name || item.title || 'item').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
                    };

                    await base44.entities[entity.name].create(itemData);
                  } catch (itemError) {
                    console.error(`Failed to create ${entityName} item:`, itemError);
                  }
                }
              }
            }
          }

          // Create a main page with intelligent content
          const pageContent = businessContent?.pageContent || {
            hero_headline: 'Welcome',
            hero_subheadline: 'Your business description',
            about_section: idea
          };

          await base44.entities.Page.create({
            project_id: newProject.id,
            name: 'Home',
            path: '/',
            content: {
              type: 'generated',
              businessContext: businessContent?.context,
              heroHeadline: pageContent.hero_headline,
              heroSubheadline: pageContent.hero_subheadline,
              aboutSection: pageContent.about_section,
              uniqueSellingPoints: pageContent.unique_selling_points,
              callToAction: pageContent.call_to_action,
              metaDescription: pageContent.meta_description,
              entities: enhancedEntities.map(e => e.name)
            }
          });

          // Show completion
          setTimeout(() => {
            const totalItems = businessContent?.entityMap
              ? Object.values(businessContent.entityMap).reduce((sum, items) => sum + items.length, 0)
              : 0;
            const businessName = businessContent?.context?.businessName || 'your website';
            const businessType = businessContent?.context?.businessType || 'website';

            const completeMessage = {
              role: 'assistant',
              content: `🎉 **${businessName} is LIVE!**\n\n✅ Database structure created\n${totalItems > 0 ? `✅ ${totalItems} sample items added\n` : ''}✅ Professional content generated\n✅ Ready to customize\n\n🔗 [**View Your ${businessType.charAt(0).toUpperCase() + businessType.slice(1)} →**](/projects/${newProject.id})\n\n💬 What would you like to customize? (colors, add more items, change layout, etc.)`,
              timestamp: new Date().toISOString()
            };
            setMessages(prev => [...prev, completeMessage]);
            setIsLoading(false);
          }, 300);

        } catch (buildError) {
          console.error('Build error:', buildError);
          toast.error('Project build failed. Please try again.');
          setIsLoading(false);
        }

      }, 500);

    } catch (error) {
      console.error('Failed to start AI agent:', error);
      const errorMessage = {
        role: 'assistant',
        content: '❌ Oops! Something went wrong. Let me try again or describe your idea differently.',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
      setIsLoading(false);
    }
  };

  // Use 'general' as workspace ID when no project is selected
  const workspaceId = projectId || 'general';

  const { data: documents = [], isLoading: isLoadingDocs } = useQuery({
    queryKey: ['documents', projectId],
    queryFn: () => projectId ? base44.entities.ProjectDocument.filter({ project_id: projectId }) : Promise.resolve([]),
    enabled: !!projectId
  });

  const { data: conversations = [], isLoading: isLoadingConvos } = useQuery({
    queryKey: ['conversations', workspaceId],
    queryFn: () => {
      if (projectId) {
        return base44.entities.Conversation.filter({ project_id: projectId }, '-updated_date');
      } else {
        // For general workspace, try to fetch from localStorage or create new
        const stored = localStorage.getItem(`conversations_${workspaceId}`);
        return stored ? JSON.parse(stored) : [];
      }
    },
  });

  const [activeConversation, setActiveConversation] = useState(null);

  const createConversationMutation = useMutation({
    mutationFn: (data) => {
      if (projectId) {
        return base44.entities.Conversation.create(data);
      } else {
        // Store in localStorage for general workspace
        const conv = { id: Date.now().toString(), ...data, created_date: new Date().toISOString() };
        const stored = localStorage.getItem(`conversations_${workspaceId}`);
        const conversations = stored ? JSON.parse(stored) : [];
        conversations.push(conv);
        localStorage.setItem(`conversations_${workspaceId}`, JSON.stringify(conversations));
        return Promise.resolve(conv);
      }
    },
    onSuccess: (newConv) => {
      queryClient.invalidateQueries({ queryKey: ['conversations', workspaceId] });
      setActiveConversation(newConv);
      setMessages([]);
    },
  });

  const updateConversationMutation = useMutation({
    mutationFn: ({ id, data }) => {
      if (projectId) {
        return base44.entities.Conversation.update(id, data);
      } else {
        // Update in localStorage for general workspace
        const stored = localStorage.getItem(`conversations_${workspaceId}`);
        const conversations = stored ? JSON.parse(stored) : [];
        const index = conversations.findIndex(c => c.id === id);
        if (index >= 0) {
          conversations[index] = { ...conversations[index], ...data, updated_date: new Date().toISOString() };
          localStorage.setItem(`conversations_${workspaceId}`, JSON.stringify(conversations));
        }
        return Promise.resolve(conversations[index]);
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['conversations', workspaceId] }),
  });

  const deleteConversationMutation = useMutation({
    mutationFn: (id) => {
      if (projectId) {
        return base44.entities.Conversation.delete(id);
      } else {
        // Delete from localStorage for general workspace
        const stored = localStorage.getItem(`conversations_${workspaceId}`);
        const conversations = stored ? JSON.parse(stored) : [];
        const filtered = conversations.filter(c => c.id !== id);
        localStorage.setItem(`conversations_${workspaceId}`, JSON.stringify(filtered));
        return Promise.resolve();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations', workspaceId] });
      setActiveConversation(null);
      setMessages([]);
    },
  });

  useEffect(() => {
    if (activeConversation?.messages) {
      setMessages(activeConversation.messages);
    }
  }, [activeConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user', content: input, timestamp: new Date().toISOString() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    const currentInput = input;
    setInput('');
    setIsLoading(true);

    try {
      // Check if agent mode is enabled and user wants autonomous execution
      const shouldUseAgent = agentMode || /\b(build|create|make|generate|implement|setup|configure)\b/i.test(currentInput);

      if (shouldUseAgent && aiAgent && projectId) {
        // Use AI Agent for autonomous multi-step execution
        const { plan, context } = await aiAgent.processRequest(currentInput, projectId);
        setCurrentPlan(plan);

        // Show the plan to user
        const planMessage = {
          role: 'assistant',
          content: `🤖 **I've created a plan to accomplish this:**\n\n**Goal:** ${plan.goal}\n\n**Steps:**\n${plan.steps.map((s, i) => `${i + 1}. ${s.description} _(${s.reasoning})_`).join('\n')}\n\n**Estimated time:** ${plan.estimated_duration}\n**Complexity:** ${plan.complexity}\n\n✨ Executing now...`,
          timestamp: new Date().toISOString(),
          metadata: { isPlan: true, plan }
        };

        setMessages(prev => [...prev, planMessage]);

        // Execute each step
        for (let i = 0; i < plan.steps.length; i++) {
          const step = plan.steps[i];
          const progress = aiAgent.getProgress();
          setExecutionProgress(progress);

          const stepStartMsg = {
            role: 'assistant',
            content: `⏳ **Step ${step.step}:** ${step.description}...`,
            timestamp: new Date().toISOString(),
            metadata: { isStepUpdate: true }
          };
          setMessages(prev => [...prev, stepStartMsg]);

          const result = await aiAgent.executeStep(step, projectId);

          if (result.success) {
            const stepDoneMsg = {
              role: 'assistant',
              content: `✅ **Step ${step.step} completed:** ${step.description}`,
              timestamp: new Date().toISOString(),
              metadata: { isStepUpdate: true, success: true }
            };
            setMessages(prev => [...prev, stepDoneMsg]);
          } else {
            const stepErrorMsg = {
              role: 'assistant',
              content: `⚠️ **Step ${step.step} failed:** ${result.error}\n\n🔧 **Self-correction:** ${result.correction?.correction || 'Trying alternative approach...'}`,
              timestamp: new Date().toISOString(),
              metadata: { isStepUpdate: true, success: false, error: result.error }
            };
            setMessages(prev => [...prev, stepErrorMsg]);
          }
        }

        // Final completion
        const finalProgress = aiAgent.getProgress();
        const completionMsg = {
          role: 'assistant',
          content: `🎉 **Plan completed!**\n\n✅ ${finalProgress.completed}/${finalProgress.total} steps successful (${finalProgress.percentage}%)\n\nWhat would you like to do next?`,
          timestamp: new Date().toISOString(),
          metadata: { isCompletion: true, progress: finalProgress }
        };
        setMessages(prev => [...prev, completionMsg]);

        setIsLoading(false);
        setExecutionProgress(null);
        return;
      }

      // Regular chat mode (existing logic)
      // Suggest relevant tools based on input (using LLM context)
      const toolResult = await llmQuery(`Analyze this request and suggest which tools would be most helpful: "${currentInput}"

Available tools:
- api: API Discovery - Find and integrate public APIs
- models: Predictive Analytics - Forecasting, sentiment analysis, classification
- functions: AI Functions - Image generation, translation, SEO
- github: GitHub Integration - Sync code with repository
- automations: Workflow Builder - Create automated workflows
- review: Code Review - Get AI feedback on code quality
- docs: Documents - Upload project specifications
- mobile: Mobile Apps - Generate React Native/Flutter apps
- agents: Deploy AI Agents - Create autonomous assistants
- advanced: Advanced Tools - Refactoring, testing, performance
- auditor: Project Auditor - Error detection and fixes

Return JSON: {"suggested_tools": ["tool1", "tool2"], "reasoning": "why these tools"}`, {
        jsonSchema: {
          type: "object",
          properties: {
            suggested_tools: { type: "array", items: { type: "string" } },
            reasoning: { type: "string" }
          }
        }
      });

      if (toolResult.parsedResponse?.suggested_tools?.length > 0) {
        setSuggestedTools(toolResult.parsedResponse.suggested_tools);
      }

      const documentContext = documents.length > 0
        ? `\n\nProject Documents Available: ${documents.map(d => d.name).join(', ')}`
        : '';

      // Get model info for response attribution
      const modelInfo = getModelInfo(selectedModel);

      // Main response using LLM context
      const result = await llmQuery(`You are an advanced AI assistant helping to build web applications with AI capabilities.
${integratedAPIs.length > 0 ? `\nIntegrated APIs: ${integratedAPIs.map(a => a.name).join(', ')}` : ''}${documentContext}

User request: ${currentInput}

Provide helpful, actionable responses with code examples when relevant. Be concise and practical.`);

      const responseText = result.response || 'I apologize, but I was unable to generate a response. Please try again.';
      const usedModel = result.model || 'base44';
      const usedModelInfo = getModelInfo(usedModel);

      const assistantMessage = {
        role: 'assistant',
        content: responseText,
        model: usedModel,
        modelName: usedModelInfo?.name || 'AI',
        timestamp: new Date().toISOString()
      };

      const updatedMessages = [...newMessages, assistantMessage];
      setMessages(updatedMessages);

      // Capture learning from this interaction
      if (user) {
        try {
          const category = detectCategory(currentInput);
          await base44.entities.Learning.create({
            user_id: user.email,
            prompt: currentInput,
            response: responseText,
            feedback_score: 0.7,
            category,
            extracted_patterns: extractUserPatterns(currentInput),
          });

          // Auto-deploy agents for this interaction
          autoDeployAgents(currentInput);
        } catch (learningError) {
          console.log('Learning capture skipped:', learningError);
        }
      }

      if (activeConversation) {
        updateConversationMutation.mutate({
          id: activeConversation.id,
          data: { messages: updatedMessages },
        });
      } else {
        createConversationMutation.mutate({
          project_id: projectId,
          title: currentInput.slice(0, 50) + (currentInput.length > 50 ? '...' : ''),
          messages: updatedMessages,
        });
      }
    } catch (error) {
      console.error('AI response error:', error);
      toast.error('Failed to get AI response. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleNewChat = () => {
    setActiveConversation(null);
    setMessages([]);
    setActivePanel(null);
    setSuggestedTools([]);
  };

  // Helper functions for learning
  const detectCategory = (input) => {
    const lowerInput = input.toLowerCase();
    if (/quantum|multiverse|circuit|gate|qubit|entangle/.test(lowerInput)) return 'quantum';
    if (/component|ui|design|visual/.test(lowerInput)) return 'component';
    if (/api|rest|endpoint|fetch/.test(lowerInput)) return 'api';
    if (/workflow|automation|trigger/.test(lowerInput)) return 'workflow';
    if (/entity|database|model|schema/.test(lowerInput)) return 'project';
    return 'general';
  };

  const extractUserPatterns = (input) => {
    const patterns = [];
    const keywords = input.match(/\b[a-z]{4,}\b/gi) || [];
    const uniqueKeywords = [...new Set(keywords)].slice(0, 5);
    return uniqueKeywords.map((kw) => kw.toLowerCase());
  };

  // Auto-deploy agents based on prompt
  const autoDeployAgents = async (input) => {
    try {
      const response = await base44.functions.invoke('autoDeployAgents', {
        prompt: input,
        category: detectCategory(input),
        context: { projectId, selectedProject },
      });

      if (response.data?.deployedCount > 0) {
        setSuggestedTools((prev) => [...prev, 'agents']);
      }
    } catch (error) {
      console.log('Auto-deploy skipped:', error);
    }
  };

  // AI Assistant can now work with or without a project

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Conversations Sidebar */}
      <div className="w-72 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800/50 flex flex-col">
        <div className="p-4 border-b border-gray-50 dark:border-gray-800/50 space-y-3">
          {/* Project Selector */}
          <div className="relative">
            <button
              onClick={() => setShowProjectSelector(!showProjectSelector)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 text-sm dark:text-gray-300"
            >
              <div className="flex items-center gap-2 flex-1 text-left">
                <Database className="w-4 h-4 text-gray-600" />
                <span className="text-gray-700 font-medium truncate">
                  {selectedProject?.name || 'General Workspace'}
                </span>
              </div>
              <ChevronDown className={cn("w-4 h-4 text-gray-600 transition-transform", showProjectSelector && "rotate-180")} />
            </button>

            {/* Project Dropdown */}
            {showProjectSelector && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                {/* General Workspace Option */}
                <button
                  onClick={() => {
                    setSelectedProject(null);
                    setShowProjectSelector(false);
                    setActiveConversation(null);
                    setMessages([]);
                  }}
                  className={cn(
                    "w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-100 text-sm",
                    !selectedProject && "bg-indigo-50 text-indigo-700 font-medium"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    General Workspace
                  </div>
                  <p className="text-xs opacity-75 ml-6">Conversations not tied to a project</p>
                </button>

                {/* Project Options */}
                {availableProjects.map((project) => (
                  <button
                    key={project.id}
                    onClick={() => {
                      setSelectedProject(project);
                      setShowProjectSelector(false);
                      setActiveConversation(null);
                      setMessages([]);
                    }}
                    className={cn(
                      "w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-100 text-sm",
                      selectedProject?.id === project.id && "bg-indigo-50 text-indigo-700 font-medium"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Database className="w-4 h-4" />
                      {project.name}
                    </div>
                    {project.description && <p className="text-xs opacity-75 ml-6">{project.description}</p>}
                  </button>
                ))}
              </div>
            )}
          </div>

          <Button
            onClick={handleNewChat}
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl h-11"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Chat
          </Button>
          <div className="mt-3 p-3 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">🤖 Agent Mode</span>
              <button
                onClick={() => setAgentMode(!agentMode)}
                className={cn(
                  "relative w-11 h-6 rounded-full transition-colors",
                  agentMode ? "bg-indigo-600" : "bg-gray-300"
                )}
              >
                <span className={cn(
                  "absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform",
                  agentMode ? "translate-x-5" : "translate-x-0"
                )} />
              </button>
            </div>
            <p className="text-xs text-gray-600">
              {agentMode ? "Autonomous multi-step execution" : "Interactive chat mode"}
            </p>
          </div>        </div>

        <ScrollArea className="flex-1">
          <div className="p-2">
            {conversations.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                No conversations yet
              </div>
            ) : (
              conversations.map((conv) => (
                <div
                  key={conv.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setActiveConversation(conv)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setActiveConversation(conv);
                    }
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all mb-1 group cursor-pointer",
                    activeConversation?.id === conv.id
                      ? "bg-indigo-50 border border-indigo-200"
                      : "hover:bg-gray-50"
                  )}
                >
                  <MessageSquare className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <p className="text-sm text-gray-700 truncate flex-1">{conv.title || 'New conversation'}</p>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteConversationMutation.mutate(conv.id);
                    }}
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Main Area */}
      <div className="flex-1 flex flex-col bg-gradient-to-br from-gray-50 dark:from-gray-950 to-blue-50/30 dark:to-gray-900/50">
        {/* Hero Section */}
        {!activePanel && messages.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center p-8">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-6 shadow-lg">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">What do you want to build?</h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl text-center mb-8">
              Describe your idea and I'll help you create it with AI-powered tools
            </p>

            {/* Input Box */}
            <div className="max-w-3xl w-full mb-12">
              <div className="relative">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Type your idea here... (e.g., 'Create a task management app' or 'Build a weather dashboard')"
                  className="min-h-[120px] rounded-2xl text-base px-6 py-4 pr-20 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-900/50 resize-none shadow-sm dark:text-white dark:placeholder-gray-400"
                  rows={4}
                />
                <Button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="absolute right-4 bottom-4 h-12 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl shadow-lg"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-5 h-5 mr-2" />
                      Create
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-4xl w-full mb-12">
              {quickActions.map((action) => (
                <button
                  key={action.label}
                  onClick={() => {
                    if (action.isWizard) {
                      setShowProjectWizard(true);
                    } else if (action.panel) {
                      setActivePanel(action.panel);
                    } else {
                      setInput(action.prompt);
                    }
                  }}
                  aria-label={action.label}
                  className={cn(
                    "p-6 bg-white dark:bg-gray-800 rounded-xl border-2 transition-all group",
                    action.isWizard
                      ? "border-indigo-200 dark:border-indigo-800 hover:border-indigo-500 dark:hover:border-indigo-500 hover:shadow-xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 md:col-span-3"
                      : "border-gray-100 dark:border-gray-700 hover:border-indigo-500 dark:hover:border-indigo-600 hover:shadow-lg"
                  )}
                >
                  {action.isWizard ? (
                    <div className="flex items-center justify-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                        <Rocket className="w-7 h-7 text-white" />
                      </div>
                      <div className="text-left">
                        <div className="font-bold text-lg text-gray-900 dark:text-white">Generate Full Project</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">Create entities, workflows, and pages from a description</div>
                      </div>
                      <Wand2 className="w-6 h-6 text-indigo-500 ml-4" />
                    </div>
                  ) : (
                    <>
                      <action.icon className="w-8 h-8 mb-3 text-gray-400 group-hover:text-indigo-600 transition-colors mx-auto" />
                      <div className="font-medium text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">{action.label}</div>
                      {action.desc && <div className="text-xs text-gray-500 mt-1">{action.desc}</div>}
                    </>
                  )}
                </button>
              ))}
            </div>

            {/* Features Overview */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 max-w-4xl w-full">
              <h3 className="font-semibold mb-4 text-gray-900 dark:text-white">Quick Tools</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                <button onClick={() => setActivePanel('diagnostics')} className="flex items-center gap-2 text-gray-600 hover:text-purple-600">
                  <Zap className="w-4 h-4 text-purple-600" />
                  System Diagnostics
                </button>
                <button onClick={() => setActivePanel('snippets')} className="flex items-center gap-2 text-gray-600 hover:text-orange-600">
                  <Code className="w-4 h-4 text-orange-600" />
                  Code Snippets
                </button>
                <button onClick={() => setActivePanel('deployment')} className="flex items-center gap-2 text-gray-600 hover:text-green-600">
                  <Zap className="w-4 h-4 text-green-600" />
                  Deployment Check
                </button>
                <a
                  href={base44.agents.getWhatsAppConnectURL('project_integrity_monitor')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-gray-600 hover:text-green-600"
                >
                  <MessageCircle className="w-4 h-4 text-green-600" />
                  Integrity Monitor (WhatsApp)
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Active Tool Panel Header */}
        {activePanel && (
          <div className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700/50 px-6 py-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {activePanel === 'api' && 'API Discovery'}
              {activePanel === 'models' && 'Predictive Models'}
              {activePanel === 'functions' && 'AI Functions'}
              {activePanel === 'github' && 'GitHub Integration'}
              {activePanel === 'automations' && 'Workflow Automations'}
              {activePanel === 'review' && 'Code Review'}
              {activePanel === 'docs' && 'Project Documents'}
              {activePanel === 'mobile' && 'Mobile App Builder'}
              {activePanel === 'personalization' && 'Personalization Engine'}
              {activePanel === 'agents' && 'Deploy Agents'}
              {activePanel === 'advanced' && 'Advanced Tools'}
              {activePanel === 'auditor' && 'Project Auditor'}
              {activePanel === 'bugs' && 'Bug Detection'}
              {activePanel === 'codereview' && 'Code Review'}
              {activePanel === 'resources' && 'Resource Monitor'}
              {activePanel === 'diagnostics' && 'System Diagnostics'}
              {activePanel === 'snippets' && 'Code Snippet Library'}
              {activePanel === 'deployment' && 'Deployment Readiness'}
              {activePanel === 'component_generator' && 'Component Generator'}
              {activePanel === 'testing_debugger' && 'Testing & Debugging'}
              {activePanel === 'ux_suggestions' && 'UX Suggestions'}
              {activePanel === 'quantum_analyzer' && 'Quantum AI Assistant'}
              {activePanel === 'documentation' && 'Documentation Generator'}
              {activePanel === 'code_review_ai' && 'AI Code Review'}
              {activePanel === 'optimizations' && 'Optimization Suggestions'}
            </h2>
            <Button variant="ghost" size="sm" onClick={() => setActivePanel(null)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>
        )}

        {/* Suggested Tools */}
        {suggestedTools.length > 0 && !activePanel && messages.length > 0 && (
          <div className="bg-blue-50 border-b border-blue-200 px-6 py-3">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm font-medium text-blue-900">Recommended tools:</span>
              {suggestedTools.map(tool => (
                <Button
                  key={tool}
                  size="sm"
                  variant="outline"
                  onClick={() => setActivePanel(tool)}
                  className="bg-white hover:bg-blue-100 border-blue-300"
                >
                  {tool.charAt(0).toUpperCase() + tool.slice(1)}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Tool Panels */}
        {activePanel === 'api' && (
          <div className="flex-1 p-6 overflow-auto">
            <React.Suspense fallback={<div className="text-center py-8">Loading...</div>}>
              <APIDiscoveryPanel onIntegrate={(api) => setIntegratedAPIs([...integratedAPIs, api])} />
            </React.Suspense>
          </div>
        )}

        {activePanel === 'models' && (
          <div className="flex-1 p-6 overflow-auto">
            <PredictiveModels projectId={projectId} />
          </div>
        )}

        {activePanel === 'functions' && (
          <div className="flex-1 p-6 overflow-auto">
            <AdvancedAIFunctions />
          </div>
        )}

        {activePanel === 'github' && (
          <div className="flex-1 p-6 overflow-auto">
            <GitHubIntegration projectId={projectId} />
          </div>
        )}

        {activePanel === 'automations' && (
          <div className="flex-1 p-6 overflow-auto">
            <AutomationBuilder projectId={projectId} />
          </div>
        )}

        {activePanel === 'review' && (
          <div className="flex-1 p-6 overflow-auto">
            <CodeReview projectId={projectId} />
          </div>
        )}

        {activePanel === 'docs' && (
          <div className="flex-1 p-6 overflow-auto">
            <DocumentUpload projectId={projectId} />
          </div>
        )}

        {activePanel === 'mobile' && (
          <div className="flex-1 p-6 overflow-auto">
            <MobileAppBuilder projectId={projectId} />
          </div>
        )}

        {activePanel === 'personalization' && (
          <div className="flex-1 p-6 overflow-auto">
            <PersonalizationEngine user={user} />
          </div>
        )}

        {activePanel === 'agents' && (
          <div className="flex-1 p-6 overflow-auto">
            <AgentDeploymentPanel />
          </div>
        )}

        {activePanel === 'advanced' && (
          <div className="flex-1 p-6 overflow-auto">
            <AdvancedAITools />
          </div>
        )}

        {activePanel === 'auditor' && (
          <div className="flex-1 p-6 overflow-auto">
            <ProjectAuditorEnhanced />
          </div>
        )}

        {activePanel === 'bugs' && (
          <div className="flex-1 p-6 overflow-auto">
            <ProactiveBugDetection />
          </div>
        )}

        {activePanel === 'codereview' && (
          <div className="flex-1 p-6 overflow-auto">
            <CodeReviewPanel />
          </div>
        )}

        {activePanel === 'resources' && (
          <div className="flex-1 p-6 overflow-auto">
            <ResourceMonitoringPanel />
          </div>
        )}

        {activePanel === 'diagnostics' && (
          <div className="flex-1 p-6 overflow-auto">
            <div className="max-w-6xl mx-auto">
              <SystemDiagnostics />
            </div>
          </div>
        )}

        {activePanel === 'snippets' && (
          <div className="flex-1 p-6 overflow-auto">
            <div className="max-w-6xl mx-auto">
              <CodeSnippetLibrary
                projectId={projectId}
                contextCode={messages[messages.length - 1]?.role === 'assistant' ? messages[messages.length - 1]?.content : null}
              />
            </div>
          </div>
        )}

        {activePanel === 'deployment' && (
          <div className="flex-1 p-6 overflow-auto">
            <div className="max-w-4xl mx-auto">
              <DeploymentChecklist />
            </div>
          </div>
        )}

        {activePanel === 'component_generator' && (
          <div className="flex-1 p-6 overflow-auto">
            <div className="max-w-4xl mx-auto">
              <AIComponentGenerator projectId={projectId} />
            </div>
          </div>
        )}

        {activePanel === 'testing_debugger' && (
          <div className="flex-1 p-6 overflow-auto">
            <div className="max-w-4xl mx-auto">
              <AITestingDebugger projectId={projectId} />
            </div>
          </div>
        )}

        {activePanel === 'ux_suggestions' && (
          <div className="flex-1 p-6 overflow-auto">
            <div className="max-w-4xl mx-auto">
              <AIUXSuggestions projectId={projectId} projectDescription={selectedProject?.description || ''} />
            </div>
          </div>
        )}

        {activePanel === 'quantum_analyzer' && (
          <div className="flex-1 p-6 overflow-auto">
            <div className="max-w-4xl mx-auto space-y-6">
              <React.Suspense fallback={<div className="text-center py-8">Loading...</div>}>
                <QuantumQueryAnalyzer
                  onAnalysisComplete={(analysis) => {
                    setQuantumAnalysis(analysis);
                    setUserActivity(prev => ({ ...prev, lastQuery: analysis }));
                  }}
                />
              </React.Suspense>

              {quantumAnalysis && (
                <>
                  <React.Suspense fallback={<div className="text-center py-8">Loading...</div>}>
                    <ProactiveQuantumSuggestions userActivity={userActivity} />
                  </React.Suspense>

                  <React.Suspense fallback={<div className="text-center py-8">Loading...</div>}>
                    <QuantumReportGenerator simulationData={{ ...quantumAnalysis, ...simulationData }} />
                  </React.Suspense>
                </>
              )}
            </div>
          </div>
        )}

        {activePanel === 'documentation' && (
          <div className="flex-1 p-6 overflow-auto">
            <div className="max-w-4xl mx-auto">
              <React.Suspense fallback={<div className="text-center py-8">Loading...</div>}>
                <DocumentationGenerator projectId={projectId} />
              </React.Suspense>
            </div>
          </div>
        )}

        {activePanel === 'code_review_ai' && (
          <div className="flex-1 p-6 overflow-auto">
            <div className="max-w-4xl mx-auto">
              <React.Suspense fallback={<div className="text-center py-8">Loading...</div>}>
                <CodeReviewSuggestions projectId={projectId} />
              </React.Suspense>
            </div>
          </div>
        )}

        {activePanel === 'optimizations' && (
          <div className="flex-1 p-6 overflow-auto">
            <div className="max-w-4xl mx-auto">
              <React.Suspense fallback={<div className="text-center py-8">Loading...</div>}>
                <OptimizationSuggestions projectId={projectId} />
              </React.Suspense>
            </div>
          </div>
        )}

        {/* Chat Panel */}
        {!activePanel && messages.length > 0 && (
          <ScrollArea className="flex-1 p-6">
            <div className="max-w-3xl mx-auto space-y-6">
              <AnimatePresence>
                {messages.map((message, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "flex gap-4",
                      message.role === 'user' ? "justify-end" : "justify-start"
                    )}
                  >
                    {message.role === 'assistant' && (
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                        <Sparkles className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <div
                      className={cn(
                        "max-w-[80%] rounded-2xl p-4",
                        message.role === 'user'
                          ? "bg-indigo-600 text-white"
                          : "bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm"
                      )}
                    >
                      {message.role === 'user' ? (
                        <p className="text-sm">{message.content}</p>
                      ) : (
                        <div className="prose prose-sm max-w-none dark:prose-invert">
                          {/* Show model used */}
                          {message.modelName && (
                            <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500 mb-2 pb-2 border-b border-gray-100 dark:border-gray-700">
                              <span className="font-medium">{message.modelName}</span>
                            </div>
                          )}
                          <ReactMarkdown
                            components={{
                              code: ({ inline, className, children, ...props }) => {
                                const match = /language-(\w+)/.exec(className || '');
                                return !inline ? (
                                  <div className="relative group">
                                    <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto my-3">
                                      <code className={className} {...props}>{children}</code>
                                    </pre>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      onClick={() => handleCopy(String(children), index)}
                                      className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 bg-gray-800 hover:bg-gray-700"
                                    >
                                      {copiedIndex === index ? (
                                        <Check className="w-4 h-4 text-green-400" />
                                      ) : (
                                        <Copy className="w-4 h-4 text-gray-400" />
                                      )}
                                    </Button>
                                  </div>
                                ) : (
                                  <code className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-sm">{children}</code>
                                );
                              },
                            }}
                          >
                            {message.content}
                          </ReactMarkdown>
                        </div>
                      )}
                    </div>
                    {message.role === 'user' && (
                      <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">U</span>
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>

              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex gap-4"
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-white border border-gray-100 rounded-2xl px-5 py-4 shadow-sm max-w-2xl">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                        <div className="absolute inset-0 w-5 h-5 border-2 border-indigo-200 rounded-full animate-pulse" />
                      </div>
                      <div className="space-y-1">
                        <span className="text-sm font-medium text-gray-700">
                          {selectedModel ? getModelInfo(selectedModel)?.name : 'AI'} is thinking...
                        </span>
                        <div className="flex gap-1">
                          <motion.div
                            animate={{ opacity: [0.4, 1, 0.4] }}
                            transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
                            className="w-1.5 h-1.5 rounded-full bg-indigo-400"
                          />
                          <motion.div
                            animate={{ opacity: [0.4, 1, 0.4] }}
                            transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                            className="w-1.5 h-1.5 rounded-full bg-indigo-400"
                          />
                          <motion.div
                            animate={{ opacity: [0.4, 1, 0.4] }}
                            transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
                            className="w-1.5 h-1.5 rounded-full bg-indigo-400"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
        )}

        {/* Universal Chat Bar - Always visible */}
        <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-lg">
          <div className="max-w-4xl mx-auto">
            {/* Model Selector Row */}
            <div className="flex items-center justify-between mb-3">
              <ModelSelector compact className="flex-shrink-0" />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActivePanel('usage')}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Usage
              </Button>
            </div>

            <div className="flex gap-3 items-end">
              <div className="flex-1 relative">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Describe what you want to build... (e.g., 'Create a mobile app for tracking fitness goals' or 'Build an API integration for weather data')"
                  className="min-h-[60px] max-h-[120px] rounded-xl text-sm pr-24 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 resize-none dark:text-white dark:placeholder-gray-400"
                  rows={2}
                />
                <div className="absolute right-3 bottom-3 flex items-center gap-2">
                  <VoiceInput
                    onTranscript={(text) => setInput(input + (input ? ' ' : '') + text)}
                    disabled={isLoading}
                  />
                  <a
                    href={base44.agents.getWhatsAppConnectURL('ai_assistant')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-600 hover:text-green-700"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </a>
                  <span className="text-[10px] text-gray-400 font-medium">⏎ Send</span>
                </div>
              </div>
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="h-[60px] px-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl shadow-lg"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <div className="flex items-center gap-2">
                    <Send className="w-5 h-5" />
                    <span className="font-medium">Send</span>
                  </div>
                )}
              </Button>
            </div>
            {messages.length > 0 && !activePanel && (
              <div className="mt-3 space-y-3">
                <React.Suspense fallback={null}>
                  <AgentCollaborationBuilder
                    userEmail={user?.email}
                    onWorkflowCreated={() => {
                      setInput('Agent collaboration workflow created! Execute it to see agents working together.');
                    }}
                  />
                </React.Suspense>
                <React.Suspense fallback={null}>
                  <AgentCollaborationDashboard userEmail={user?.email} />
                </React.Suspense>
                <React.Suspense fallback={null}>
                  <CustomAgentBuilder
                    userEmail={user?.email}
                    onAgentCreated={() => {
                      setInput('Custom agent created! You can now train it with examples.');
                    }}
                  />
                </React.Suspense>
                <React.Suspense fallback={null}>
                  <ProactiveAnticipationEngine
                    userEmail={user?.email}
                    onSuggestionSelect={(suggestion) => {
                      if (suggestion.action) {
                        setInput(suggestion.action);
                      }
                    }}
                  />
                </React.Suspense>
                <React.Suspense fallback={null}>
                  <SuperIntelligenceDashboard userEmail={user?.email} />
                </React.Suspense>
                <React.Suspense fallback={null}>
                  <AutoAgentDeployer
                    userEmail={user?.email}
                    onAgentsDeployed={(agents) => {
                      setUserActivity(prev => ({ ...prev, lastAgentDeploy: agents }));
                    }}
                  />
                </React.Suspense>
                <React.Suspense fallback={null}>
                  <QuantumLearningEngine
                    userEmail={user?.email}
                    onLearningsUpdate={(data) => {
                      setUserActivity(prev => ({ ...prev, lastLearning: data }));
                    }}
                  />
                </React.Suspense>
                <ProactiveSuggestions
                  projectId={projectId}
                  onApplySuggestion={(suggestion) => setInput(suggestion.action)}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI Usage Panel Modal */}
      {activePanel === 'usage' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-auto">
            <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
              <h2 className="text-lg font-semibold dark:text-white">AI Usage Analytics</h2>
              <Button variant="ghost" size="sm" onClick={() => setActivePanel(null)}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Close
              </Button>
            </div>
            <div className="p-4">
              <React.Suspense fallback={<div className="text-center py-8">Loading...</div>}>
                <AIUsagePanel showHistory />
              </React.Suspense>
            </div>
          </div>
        </div>
      )}

      {/* Project Wizard Modal */}
      {showProjectWizard && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-auto"
          >
            <div className="sticky top-0 bg-white dark:bg-gray-900 border-b dark:border-gray-800 px-6 py-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <Rocket className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">Project Generator</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Create a complete project from a description</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowProjectWizard(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Close
              </Button>
            </div>
            <React.Suspense fallback={<div className="text-center py-8">Loading...</div>}>
              <ProjectWizard
                onComplete={(result) => {
                  setShowProjectWizard(false);
                  toast.success(`Project "${result.project.name}" created successfully!`);
                  // Navigate to the new project
                  navigate(`/projects/${result.project.id}`);
                }}
                onCancel={() => setShowProjectWizard(false)}
                initialDescription={input}
              />
            </React.Suspense>
          </motion.div>
        </div>
      )}

      {/* Command Palette */}
      <React.Suspense fallback={null}>
        <CommandPalette
          isOpen={showCommandPalette}
          onClose={() => setShowCommandPalette(false)}
          onSelectPanel={(panel) => setActivePanel(panel)}
        />
      </React.Suspense>
    </div>
  );
}
