import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Sparkles, Send, Plus, Trash2, MessageSquare,
  Loader2, Copy, Check, Code, FileCode, Database,
  Globe, Brain, Zap, MessageCircle, ArrowLeft, BarChart3
} from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { generateEnhancedEntities } from '@/utils/enhancedEntityGeneration';
import { useLLM } from '@/contexts/LLMContext';
import ModelSelector from '@/components/ai/ModelSelector';
import AIUsagePanel from '@/components/ai/AIUsagePanel';
import APIDiscoveryPanel from '@/components/ai/APIDiscoveryPanel';
import PredictiveModels from '@/components/ai/PredictiveModels';
import GitHubIntegration from '@/components/ai/GitHubIntegration';
import AdvancedAIFunctions from '@/components/ai/AdvancedAIFunctions';
import AutomationBuilder from '@/components/ai/AutomationBuilder';
import DocumentUpload from '@/components/ai/DocumentUpload';
import CodeReview from '@/components/ai/CodeReview';
import ProactiveSuggestions from '@/components/ai/ProactiveSuggestions';
import MobileAppBuilder from '@/components/ai/MobileAppBuilder';
import PersonalizationEngine from '@/components/ai/PersonalizationEngine';
import VoiceInput from '@/components/ai/VoiceInput';
import CommandPalette from '@/components/ai/CommandPalette';
import SystemDiagnostics from '@/components/diagnostics/SystemDiagnostics';
import CodeSnippetLibrary from '@/components/ai/CodeSnippetLibrary';
import DeploymentChecklist from '@/components/deployment/DeploymentChecklist';
import AgentDeploymentPanel from '@/components/ai/AgentDeploymentPanel';
import AdvancedAITools from '@/components/ai/AdvancedAITools';
import ProjectAuditorEnhanced from '@/components/ai/ProjectAuditorEnhanced';
import ProactiveBugDetection from '@/components/ai/ProactiveBugDetection';
import CodeReviewPanel from '@/components/ai/CodeReviewPanel';
import ResourceMonitoringPanel from '@/components/ai/ResourceMonitoringPanel';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import EmptyState from '@/components/common/EmptyState';

const quickActions = [
  { label: 'Create Entity', icon: Database, prompt: 'Create a new entity called ' },
  { label: 'Build Page', icon: FileCode, prompt: 'Build a page that displays ' },
  { label: 'Generate Component', icon: Code, prompt: 'Generate a React component for ' },
  { label: 'Find API', icon: Globe, prompt: 'Find a free API for ' },
  { label: 'Predict Data', icon: Brain, prompt: 'Analyze and predict trends for ' },
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
  const messagesEndRef = useRef(null);
  
  // LLM Context for model selection and usage tracking
  const { query: llmQuery, selectedModel, getModelInfo } = useLLM();

  const urlParams = new URLSearchParams(window.location.search);
  const projectId = urlParams.get('projectId');
  const autoStart = urlParams.get('auto_start');
  const initialIdea = urlParams.get('idea');
  const queryClient = useQueryClient();

  useEffect(() => {
    loadUser();

    // Auto-start AI agent if coming from Dashboard
    if (autoStart === 'true' && initialIdea && !messages.length) {
      // Start AI agent conversation automatically
      startAIAgentConversation(initialIdea);
    }

    // Command Palette keyboard shortcut
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [autoStart, initialIdea]);

  const loadUser = async () => {
    const userData = await base44.auth.me();
    setUser(userData);
  };

  const startAIAgentConversation = async (idea) => {
    // Create initial welcome message from AI
    const welcomeMessage = {
      role: 'assistant',
      content: `🎉 Awesome! I'm building: **"${idea}"**\n\n✨ Let me ask a few quick questions to make it perfect:\n\n1. Who will use this? (e.g., customers, team members, personal)\n2. What's the #1 thing it should do?\n3. Any must-have features?\n\n💡 **Meanwhile, I'm already:**\n- Creating your project\n- Setting up the database\n- Building the pages\n\nJust answer when ready, or type "go" and I'll use smart defaults!`,
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
      
      // Pre-detect features for metadata
      const { features: detectedFeatures } = generateEnhancedEntities(idea);
      
      const newProject = await base44.entities.Project.create({
        name: projectName,
        description: idea,
        icon: '✨',
        color: '#8b5cf6',
        status: 'active',
        metadata: {
          ai_generated: true,
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
          // Use enhanced entity generation with advanced schemas, validations, and APIs
          const { entities: enhancedEntities, features } = generateEnhancedEntities(idea);
          
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: `🔧 **Detected Features**: ${Object.entries(features).filter(([_, v]) => v).map(([k]) => k).join(', ') || 'basic website'}\n📦 **Creating ${enhancedEntities.length} entities** with advanced schemas, validations, and API endpoints...`
          }]);

          // Create all enhanced entities with proper relationships and validations
          for (const entityData of enhancedEntities) {
            await base44.entities.Entity.create({
              project_id: newProject.id,
              name: entityData.name,
              schema: entityData.schema,
              metadata: {
                indexes: entityData.indexes || [],
                relationships: entityData.relationships || [],
                api_endpoints: entityData.api_endpoints || {},
                features: features
              }
            });
          }

          // Create a main page
          await base44.entities.Page.create({
            project_id: newProject.id,
            name: 'Home',
            path: '/',
            content: {
              type: 'generated',
              description: idea,
              entities: enhancedEntities.map(e => e.name)
            }
          });

          // Show completion
          setTimeout(() => {
            const completeMessage = {
              role: 'assistant',
              content: `🎉 **Your website is LIVE!**\n\n✅ Database created\n✅ Pages built\n✅ Ready to use\n\n🔗 [**View Your Website →**](/projects/${newProject.id})\n\n💬 Want to customize it? Just tell me what to change!`,
              timestamp: new Date().toISOString()
            };
            setMessages(prev => [...prev, completeMessage]);
            setIsLoading(false);
          }, 300);

        } catch (buildError) {
          console.error('Build error:', buildError);
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

  const { data: documents = [] } = useQuery({
    queryKey: ['documents', projectId],
    queryFn: () => base44.entities.ProjectDocument.filter({ project_id: projectId }),
    enabled: !!projectId
  });

  const { data: conversations = [] } = useQuery({
    queryKey: ['conversations', projectId],
    queryFn: () => base44.entities.Conversation.filter({ project_id: projectId }, '-updated_date'),
    enabled: !!projectId,
  });

  const [activeConversation, setActiveConversation] = useState(null);

  const createConversationMutation = useMutation({
    mutationFn: (data) => base44.entities.Conversation.create(data),
    onSuccess: (newConv) => {
      queryClient.invalidateQueries({ queryKey: ['conversations', projectId] });
      setActiveConversation(newConv);
      setMessages([]);
    },
  });

  const updateConversationMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Conversation.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['conversations', projectId] }),
  });

  const deleteConversationMutation = useMutation({
    mutationFn: (id) => base44.entities.Conversation.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations', projectId] });
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

  // Allow AI Assistant to work without project when auto-starting
  if (!projectId && autoStart !== 'true') {
    return (
      <div className="flex items-center justify-center h-full">
        <EmptyState
          icon={Sparkles}
          title="No Project Selected"
          description="Please select a project to use the AI Assistant."
        />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Conversations Sidebar */}
      <div className="w-72 bg-white border-r border-gray-100 flex flex-col">
        <div className="p-4 border-b border-gray-50">
          <Button
            onClick={handleNewChat}
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl h-11"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Chat
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2">
            {conversations.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                No conversations yet
              </div>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setActiveConversation(conv)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all mb-1 group",
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
                </button>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Main Area */}
      <div className="flex-1 flex flex-col bg-gradient-to-br from-gray-50 to-blue-50/30">
        {/* Hero Section */}
        {!activePanel && messages.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center p-8">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-6 shadow-lg">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-3">What do you want to build?</h1>
            <p className="text-lg text-gray-600 max-w-2xl text-center mb-8">
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
                  className="min-h-[120px] rounded-2xl text-base px-6 py-4 pr-20 bg-white border-2 border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 resize-none shadow-sm"
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl w-full mb-12">
              {quickActions.map((action) => (
                <button
                  key={action.label}
                  onClick={() => setInput(action.prompt)}
                  className="p-6 bg-white rounded-xl border-2 border-gray-100 hover:border-indigo-500 hover:shadow-lg transition-all group"
                >
                  <action.icon className="w-8 h-8 mb-3 text-gray-400 group-hover:text-indigo-600 transition-colors mx-auto" />
                  <div className="font-medium text-sm text-gray-700 group-hover:text-gray-900">{action.label}</div>
                </button>
              ))}
            </div>

            {/* Features Overview */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-4xl w-full">
              <h3 className="font-semibold mb-4 text-gray-900">Quick Tools</h3>
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
          <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
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
            <APIDiscoveryPanel onIntegrate={(api) => setIntegratedAPIs([...integratedAPIs, api])} />
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
              <div className="mt-3">
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
              <AIUsagePanel showHistory />
            </div>
          </div>
        </div>
      )}

      {/* Command Palette */}
      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        onSelectPanel={(panel) => setActivePanel(panel)}
      />
    </div>
  );
}