import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Sparkles, Send, Plus, Trash2, MessageSquare,
  Loader2, Copy, Check, Code, FileCode, Database,
  Globe, Brain, Zap, Bot, Github, Wand2, Workflow,
  Upload, FileText, Shield, Smartphone, User, MessageCircle, AlertCircle, Bug, CodeIcon, HardDrive, ArrowLeft
} from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
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
import AgentDeploymentPanel from '@/components/ai/AgentDeploymentPanel';
import AdvancedAITools from '@/components/ai/AdvancedAITools';
import ProjectAuditorPanel from '@/components/ai/ProjectAuditorPanel';
import ProjectAuditorEnhanced from '@/components/ai/ProjectAuditorEnhanced';
import ProactiveBugDetection from '@/components/ai/ProactiveBugDetection';
import CodeReviewPanel from '@/components/ai/CodeReviewPanel';
import ResourceMonitoringPanel from '@/components/ai/ResourceMonitoringPanel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
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
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const userData = await base44.auth.me();
    setUser(userData);
  };

  const { data: documents = [] } = useQuery({
    queryKey: ['documents', projectId],
    queryFn: () => base44.entities.ProjectDocument.filter({ project_id: projectId }),
    enabled: !!projectId
  });

  const urlParams = new URLSearchParams(window.location.search);
  const projectId = urlParams.get('projectId');

  const queryClient = useQueryClient();

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

    // Suggest relevant tools based on input
    const toolSuggestions = await base44.integrations.Core.InvokeLLM({
      prompt: `Analyze this request and suggest which tools would be most helpful: "${currentInput}"

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
- accessibility: Accessibility - WCAG compliance checks

Return JSON: {"suggested_tools": ["tool1", "tool2"], "reasoning": "why these tools"}`,
      response_json_schema: {
        type: "object",
        properties: {
          suggested_tools: { type: "array", items: { type: "string" } },
          reasoning: { type: "string" }
        }
      }
    });

    if (toolSuggestions.suggested_tools?.length > 0) {
      setSuggestedTools(toolSuggestions.suggested_tools);
    }

    const documentContext = documents.length > 0 
      ? `\n\nProject Documents Available: ${documents.map(d => d.name).join(', ')}`
      : '';

    const response = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an advanced AI assistant helping to build web applications with AI capabilities.
${integratedAPIs.length > 0 ? `\nIntegrated APIs: ${integratedAPIs.map(a => a.name).join(', ')}` : ''}${documentContext}

User request: ${currentInput}

Provide helpful, actionable responses with code examples when relevant. Be concise and practical.`,
      add_context_from_internet: currentInput.toLowerCase().includes('api') || currentInput.toLowerCase().includes('latest') || currentInput.toLowerCase().includes('current'),
      file_urls: documents.map(d => d.file_url)
    });

    const assistantMessage = { role: 'assistant', content: response, timestamp: new Date().toISOString() };
    const updatedMessages = [...newMessages, assistantMessage];
    setMessages(updatedMessages);
    setIsLoading(false);

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
  };

  if (!projectId) {
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
            <p className="text-lg text-gray-600 max-w-2xl text-center mb-12">
              Describe your idea and I'll help you create it with AI-powered tools
            </p>
            
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
              <h3 className="font-semibold mb-4 text-gray-900">Available Tools & Features</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Globe className="w-4 h-4 text-cyan-600" />
                  API Discovery
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Brain className="w-4 h-4 text-purple-600" />
                  Predictive Models
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Wand2 className="w-4 h-4 text-pink-600" />
                  AI Functions
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Workflow className="w-4 h-4 text-indigo-600" />
                  Automation Builder
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Smartphone className="w-4 h-4 text-blue-600" />
                  Mobile Apps
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Shield className="w-4 h-4 text-green-600" />
                  Code Review
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Active Tool Panel */}
        {activePanel && (
         <div className="bg-white border-b border-gray-100 px-4">
           <div className="flex items-center gap-4 justify-between">
           <div className="flex items-center gap-4">
            <button
              onClick={() => setActivePanel('chat')}
              className={cn(
                "flex items-center gap-2 py-3 border-b-2 transition-colors",
                activePanel === 'chat' 
                  ? "border-indigo-500 text-indigo-600" 
                  : "border-transparent text-gray-500 hover:text-gray-700"
              )}
            >
              <Bot className="w-4 h-4" />
              <span className="font-medium">AI Chat</span>
            </button>
            <button
              onClick={() => setActivePanel('api')}
              className={cn(
                "flex items-center gap-2 py-3 border-b-2 transition-colors",
                activePanel === 'api' 
                  ? "border-cyan-500 text-cyan-600" 
                  : "border-transparent text-gray-500 hover:text-gray-700"
              )}
            >
              <Globe className="w-4 h-4" />
              <span className="font-medium">API Discovery</span>
            </button>
            <button
              onClick={() => setActivePanel('models')}
              className={cn(
                "flex items-center gap-2 py-3 border-b-2 transition-colors",
                activePanel === 'models' 
                  ? "border-purple-500 text-purple-600" 
                  : "border-transparent text-gray-500 hover:text-gray-700"
              )}
            >
              <Brain className="w-4 h-4" />
              <span className="font-medium">Predictive Models</span>
            </button>
            <button
              onClick={() => setActivePanel('functions')}
              className={cn(
                "flex items-center gap-2 py-3 border-b-2 transition-colors",
                activePanel === 'functions' 
                  ? "border-pink-500 text-pink-600" 
                  : "border-transparent text-gray-500 hover:text-gray-700"
              )}
            >
              <Wand2 className="w-4 h-4" />
              <span className="font-medium">AI Functions</span>
            </button>
            <button
              onClick={() => setActivePanel('github')}
              className={cn(
                "flex items-center gap-2 py-3 border-b-2 transition-colors",
                activePanel === 'github' 
                  ? "border-gray-800 text-gray-900" 
                  : "border-transparent text-gray-500 hover:text-gray-700"
              )}
            >
              <Github className="w-4 h-4" />
              <span className="font-medium">GitHub</span>
            </button>
            <button
              onClick={() => setActivePanel('automations')}
              className={cn(
                "flex items-center gap-2 py-3 border-b-2 transition-colors",
                activePanel === 'automations' 
                  ? "border-indigo-500 text-indigo-600" 
                  : "border-transparent text-gray-500 hover:text-gray-700"
              )}
            >
              <Workflow className="w-4 h-4" />
              <span className="font-medium">Automations</span>
            </button>
            <button
              onClick={() => setActivePanel('review')}
              className={cn(
                "flex items-center gap-2 py-3 border-b-2 transition-colors",
                activePanel === 'review' 
                  ? "border-emerald-500 text-emerald-600" 
                  : "border-transparent text-gray-500 hover:text-gray-700"
              )}
            >
              <Shield className="w-4 h-4" />
              <span className="font-medium">Code Review</span>
            </button>
            <button
              onClick={() => setActivePanel('docs')}
              className={cn(
                "flex items-center gap-2 py-3 border-b-2 transition-colors",
                activePanel === 'docs' 
                  ? "border-orange-500 text-orange-600" 
                  : "border-transparent text-gray-500 hover:text-gray-700"
              )}
            >
              <FileText className="w-4 h-4" />
              <span className="font-medium">
                Documents {documents.length > 0 && `(${documents.length})`}
              </span>
            </button>
            <button
              onClick={() => setActivePanel('mobile')}
              className={cn(
                "flex items-center gap-2 py-3 border-b-2 transition-colors",
                activePanel === 'mobile' 
                  ? "border-blue-500 text-blue-600" 
                  : "border-transparent text-gray-500 hover:text-gray-700"
              )}
            >
              <Smartphone className="w-4 h-4" />
              <span className="font-medium">Mobile Apps</span>
            </button>
            <button
              onClick={() => setActivePanel('personalization')}
              className={cn(
                "flex items-center gap-2 py-3 border-b-2 transition-colors",
                activePanel === 'personalization' 
                  ? "border-indigo-500 text-indigo-600" 
                  : "border-transparent text-gray-500 hover:text-gray-700"
              )}
            >
              <User className="w-4 h-4" />
              <span className="font-medium">Personalization</span>
            </button>
            <button
              onClick={() => setActivePanel('agents')}
              className={cn(
                "flex items-center gap-2 py-3 border-b-2 transition-colors",
                activePanel === 'agents' 
                  ? "border-green-500 text-green-600" 
                  : "border-transparent text-gray-500 hover:text-gray-700"
              )}
            >
              <Bot className="w-4 h-4" />
              <span className="font-medium">Deploy Agents</span>
            </button>
            <button
              onClick={() => setActivePanel('advanced')}
              className={cn(
                "flex items-center gap-2 py-3 border-b-2 transition-colors",
                activePanel === 'advanced' 
                  ? "border-amber-500 text-amber-600" 
                  : "border-transparent text-gray-500 hover:text-gray-700"
              )}
            >
              <Wand2 className="w-4 h-4" />
              <span className="font-medium">Advanced Tools</span>
            </button>
            <button
              onClick={() => setActivePanel('auditor')}
              className={cn(
                "flex items-center gap-2 py-3 border-b-2 transition-colors",
                activePanel === 'auditor' 
                  ? "border-red-500 text-red-600" 
                  : "border-transparent text-gray-500 hover:text-gray-700"
              )}
            >
              <Zap className="w-4 h-4" />
              <span className="font-medium">Project Auditor</span>
            </button>
            <button
              onClick={() => setActivePanel('bugs')}
              className={cn(
                "flex items-center gap-2 py-3 border-b-2 transition-colors",
                activePanel === 'bugs' 
                  ? "border-orange-500 text-orange-600" 
                  : "border-transparent text-gray-500 hover:text-gray-700"
              )}
            >
              <AlertCircle className="w-4 h-4" />
              <span className="font-medium">Bug Detection</span>
            </button>
            <button
              onClick={() => setActivePanel('codereview')}
              className={cn(
                "flex items-center gap-2 py-3 border-b-2 transition-colors",
                activePanel === 'codereview' 
                  ? "border-green-500 text-green-600" 
                  : "border-transparent text-gray-500 hover:text-gray-700"
              )}
            >
              <Code className="w-4 h-4" />
              <span className="font-medium">Code Review</span>
            </button>
            <button
              onClick={() => setActivePanel('resources')}
              className={cn(
                "flex items-center gap-2 py-3 border-b-2 transition-colors",
                activePanel === 'resources' 
                  ? "border-purple-500 text-purple-600" 
                  : "border-transparent text-gray-500 hover:text-gray-700"
              )}
            >
              <HardDrive className="w-4 h-4" />
              <span className="font-medium">Resource Monitor</span>
            </button>
            </div>
            <a
              href={base44.agents.getWhatsAppConnectURL('ai_assistant')}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span className="text-sm font-medium">WhatsApp</span>
            </a>
            </div>
            </div>

        {/* API Discovery Panel */}
        {activePanel === 'api' && (
          <div className="flex-1 p-6 overflow-auto">
            <div className="max-w-4xl mx-auto">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-1">API Discovery</h2>
                <p className="text-gray-500">Find and integrate free public APIs into your project</p>
              </div>
              <APIDiscoveryPanel 
                onIntegrate={(api) => setIntegratedAPIs([...integratedAPIs, api])}
              />
            </div>
          </div>
        )}

        {/* Predictive Models Panel */}
        {activePanel === 'models' && (
          <div className="flex-1 p-6 overflow-auto">
            <div className="max-w-4xl mx-auto">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-1">Predictive Models</h2>
                <p className="text-gray-500">Run AI-powered predictions and analysis on your data</p>
              </div>
              <PredictiveModels projectId={projectId} />
            </div>
          </div>
        )}

        {/* AI Functions Panel */}
        {activePanel === 'functions' && (
          <div className="flex-1 p-6 overflow-auto">
            <div className="max-w-4xl mx-auto">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-1">AI Functions</h2>
                <p className="text-gray-500">Image generation, code, translation, SEO, and more</p>
              </div>
              <AdvancedAIFunctions />
            </div>
          </div>
        )}

        {/* GitHub Panel */}
        {activePanel === 'github' && (
          <div className="flex-1 p-6 overflow-auto">
            <div className="max-w-4xl mx-auto">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-1">GitHub Integration</h2>
                <p className="text-gray-500">Connect your repository to edit and sync code</p>
              </div>
              <GitHubIntegration projectId={projectId} />
            </div>
          </div>
        )}

        {/* Automations Panel */}
        {activePanel === 'automations' && (
          <div className="flex-1 p-6 overflow-auto">
            <div className="max-w-6xl mx-auto">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-1">Workflow Automations</h2>
                <p className="text-gray-500">Create n8n-style workflows with triggers, actions, and API integrations</p>
              </div>
              <AutomationBuilder projectId={projectId} />
            </div>
          </div>
        )}

        {/* Code Review Panel */}
        {activePanel === 'review' && (
          <div className="flex-1 p-6 overflow-auto">
            <div className="max-w-4xl mx-auto">
              <CodeReview projectId={projectId} />
            </div>
          </div>
        )}

        {/* Documents Panel */}
        {activePanel === 'docs' && (
          <div className="flex-1 p-6 overflow-auto">
            <div className="max-w-4xl mx-auto">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-1">Project Documents</h2>
                <p className="text-gray-500">Upload specifications and documentation for AI context</p>
              </div>
              <DocumentUpload projectId={projectId} />
            </div>
          </div>
        )}

        {/* Mobile App Builder Panel */}
        {activePanel === 'mobile' && (
          <div className="flex-1 p-6 overflow-auto">
            <div className="max-w-4xl mx-auto">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-1">Mobile App Builder</h2>
                <p className="text-gray-500">Generate React Native mobile apps with AI - iOS & Android</p>
              </div>
              <MobileAppBuilder projectId={projectId} />
            </div>
          </div>
        )}

        {/* Personalization Panel */}
        {activePanel === 'personalization' && (
          <div className="flex-1 p-6 overflow-auto">
            <div className="max-w-5xl mx-auto">
              <PersonalizationEngine user={user} />
            </div>
          </div>
        )}

        {/* Agent Deployment Panel */}
        {activePanel === 'agents' && (
          <div className="flex-1 p-6 overflow-auto">
            <div className="max-w-5xl mx-auto">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-1">Deploy Autonomous Agents</h2>
                <p className="text-gray-500">Suggest and configure AI agents with customizable autonomy levels</p>
              </div>
              <AgentDeploymentPanel />
            </div>
          </div>
        )}

        {/* Advanced AI Tools Panel */}
        {activePanel === 'advanced' && (
          <div className="flex-1 p-6 overflow-auto">
            <div className="max-w-5xl mx-auto">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-1">Advanced AI Tools</h2>
                <p className="text-gray-500">Code refactoring, test generation, performance analysis, and sentiment analysis</p>
              </div>
              <AdvancedAITools />
            </div>
          </div>
        )}

        {/* Project Auditor Panel */}
        {activePanel === 'auditor' && (
          <div className="flex-1 p-6 overflow-auto">
            <div className="max-w-5xl mx-auto">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-1">Advanced Project Auditor</h2>
                <p className="text-gray-500">Real-time error detection, AI suggestions, automatic code fixes, and intelligent recommendations</p>
              </div>
              <ProjectAuditorEnhanced />
            </div>
          </div>
        )}

        {/* Proactive Bug Detection Panel */}
        {activePanel === 'bugs' && (
          <div className="flex-1 p-6 overflow-auto">
            <div className="max-w-5xl mx-auto">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-1">Proactive Bug Detection</h2>
                <p className="text-gray-500">AI analyzes logs, feedback, and crashes to predict bugs and auto-create prioritized tickets</p>
              </div>
              <ProactiveBugDetection />
            </div>
          </div>
        )}

        {/* Code Review Panel */}
        {activePanel === 'codereview' && (
          <div className="flex-1 p-6 overflow-auto">
            <div className="max-w-5xl mx-auto">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-1">AI Code Review</h2>
                <p className="text-gray-500">Get AI-powered feedback on best practices, bugs, performance, and security</p>
              </div>
              <CodeReviewPanel />
            </div>
          </div>
        )}

        {/* Resource Monitoring Panel */}
        {activePanel === 'resources' && (
          <div className="flex-1 p-6 overflow-auto">
            <div className="max-w-5xl mx-auto">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-1">Resource Monitoring & Optimization</h2>
                <p className="text-gray-500">Monitor CPU, memory, and network usage. Get AI predictions for spikes and scaling strategies</p>
              </div>
              <ResourceMonitoringPanel />
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
                          : "bg-white border border-gray-100 shadow-sm"
                      )}
                    >
                      {message.role === 'user' ? (
                        <p className="text-sm">{message.content}</p>
                      ) : (
                        <div className="prose prose-sm max-w-none">
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
                                  <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm">{children}</code>
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
                      <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-medium text-indigo-600">U</span>
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>

              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-4"
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                    <div className="flex items-center gap-2 text-gray-500">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Thinking...</span>
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
        )}

        {/* Universal Chat Bar - Always visible */}
        <div className="p-4 bg-white border-t border-gray-200 shadow-lg">
          <div className="max-w-4xl mx-auto">
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
                  className="min-h-[60px] max-h-[120px] rounded-xl text-sm pr-24 bg-white border-gray-300 focus:ring-2 focus:ring-indigo-500 resize-none"
                  rows={2}
                />
                <div className="absolute right-3 bottom-3 flex items-center gap-2">
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
              <div className="mt-3 flex items-center gap-2">
                <ProactiveSuggestions 
                  projectId={projectId} 
                  onApplySuggestion={(suggestion) => setInput(suggestion.action)}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}