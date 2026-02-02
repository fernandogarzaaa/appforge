import React, { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bot, Plus, Play, Pause, Trash2, Settings, Zap, Clock, Mail, Webhook, Sparkles, RefreshCw, TrendingUp, Database, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import CryptoTradingBotBuilder from '@/components/bots/CryptoTradingBotBuilder';
import VisualWorkflowEditor from '@/components/workflow/VisualWorkflowEditor';
import TriggerConfiguration from '@/components/bots/TriggerConfiguration';
import CollaboratorManager from '@/components/collaboration/CollaboratorManager';
import ActivityLog from '@/components/collaboration/ActivityLog';
import { toast } from 'sonner';

const triggerTypes = [
  { id: 'schedule', name: 'Schedule', icon: Clock, description: 'Run on a schedule' },
  { id: 'webhook', name: 'Webhook', icon: Webhook, description: 'Trigger via HTTP request' },
  { id: 'email', name: 'Email', icon: Mail, description: 'Trigger on email received' },
  { id: 'entity_change', name: 'Entity Change', icon: Zap, description: 'When entity data changes' },
  { id: 'api_endpoint', name: 'API Endpoint', icon: Webhook, description: 'Trigger via external webhook' },
  { id: 'database_change', name: 'Database Change', icon: Database, description: 'When database records change' },
  { id: 'file_upload', name: 'File Upload', icon: Upload, description: 'When files are uploaded' }
];

const botTemplates = [
  { 
    name: 'Email Assistant Bot',
    description: 'Auto-read emails, suggest replies, auto-respond to queries, and schedule appointments',
    trigger: { type: 'email', config: {} },
    icon: Mail,
    category: 'email',
    integrations: ['Gmail', 'Outlook', 'Calendar'],
    workflow: [
      'Monitor incoming emails',
      'Analyze email content with AI',
      'Generate appropriate responses',
      'Auto-reply or suggest manual reply',
      'Extract meeting requests and schedule'
    ]
  },
  {
    name: 'Customer Support Bot',
    description: 'Automatically respond to customer queries and escalate when needed',
    trigger: { type: 'email', config: {} },
    icon: Zap,
    category: 'email',
    integrations: ['Gmail', 'Slack', 'Zendesk'],
    workflow: [
      'Receive customer inquiry',
      'Analyze sentiment and urgency',
      'Search knowledge base',
      'Generate helpful response',
      'Escalate to human if needed'
    ]
  },
  {
    name: 'Meeting Scheduler Bot',
    description: 'Parse meeting requests from emails and automatically schedule appointments',
    trigger: { type: 'email', config: {} },
    icon: Clock,
    category: 'email',
    integrations: ['Gmail', 'Calendar', 'Zoom'],
    workflow: [
      'Detect meeting request in email',
      'Extract preferred times',
      'Check calendar availability',
      'Propose meeting times',
      'Send calendar invite'
    ]
  },
  {
    name: 'Crypto Trading Bot',
    description: 'Grid trading, DCA, arbitrage, momentum trading with risk management',
    trigger: { type: 'schedule', config: {} },
    icon: TrendingUp,
    category: 'trading',
    integrations: ['Binance', 'Coinbase', 'Telegram'],
    workflow: [
      'Monitor cryptocurrency prices',
      'Calculate trading signals',
      'Execute buy/sell orders',
      'Manage positions',
      'Log performance metrics'
    ]
  },
  {
    name: 'Social Media Growth Bot',
    description: 'Plan, schedule, and optimize social posts with engagement tracking',
    trigger: { type: 'schedule', config: {} },
    icon: Mail,
    category: 'social',
    integrations: ['X/Twitter', 'LinkedIn', 'Buffer'],
    workflow: [
      'Analyze content calendar',
      'Generate post variations',
      'Schedule posts across channels',
      'Monitor engagement metrics',
      'Recommend optimizations'
    ]
  },
  {
    name: 'Auto Trader Bot',
    description: 'Execute strategy-based trades with alerts and risk controls',
    trigger: { type: 'schedule', config: {} },
    icon: TrendingUp,
    category: 'trading',
    integrations: ['Binance', 'Coinbase', 'Email'],
    workflow: [
      'Fetch market signals',
      'Evaluate strategy rules',
      'Place trades with safeguards',
      'Track positions and P&L',
      'Send daily trade summary'
    ]
  },
  {
    name: 'Data Aggregator Bot',
    description: 'Collect data from multiple sources and consolidate into your system',
    trigger: { type: 'schedule', config: {} },
    icon: Zap,
    category: 'data_processing',
    integrations: ['Salesforce', 'HubSpot', 'Google Sheets'],
    workflow: [
      'Fetch data from APIs',
      'Transform and validate',
      'Aggregate results',
      'Store in database',
      'Send notifications'
    ]
  },
  {
    name: 'Alert Monitor Bot',
    description: 'Monitor metrics and send alerts when thresholds are exceeded',
    trigger: { type: 'entity_change', config: {} },
    icon: Zap,
    category: 'monitoring',
    integrations: ['Datadog', 'Slack', 'PagerDuty'],
    workflow: [
      'Track metric values',
      'Compare against thresholds',
      'Generate alerts',
      'Notify stakeholders',
      'Log incident'
    ]
  },
  {
    name: 'Social Media Post Bot',
    description: 'Auto-post content to social media channels on schedule',
    trigger: { type: 'schedule', config: {} },
    icon: Mail,
    category: 'social',
    integrations: ['Buffer', 'LinkedIn', 'X/Twitter'],
    workflow: [
      'Fetch content from CMS',
      'Format for each platform',
      'Schedule posts',
      'Publish to social media',
      'Track engagement metrics'
    ]
  },
  {
    name: 'Database Sync Bot',
    description: 'Sync data between multiple databases in real-time',
    trigger: { type: 'entity_change', config: {} },
    icon: Zap,
    category: 'integration',
    integrations: ['Postgres', 'MySQL', 'Snowflake'],
    workflow: [
      'Monitor source database',
      'Detect data changes',
      'Transform data format',
      'Sync to destination database',
      'Log sync status'
    ]
  },
  {
    name: 'Report Generation Bot',
    description: 'Generate and email reports on schedule automatically',
    trigger: { type: 'schedule', config: {} },
    icon: Mail,
    category: 'reporting',
    integrations: ['Google Sheets', 'Looker', 'Email'],
    workflow: [
      'Query data sources',
      'Compile metrics',
      'Generate PDF report',
      'Email stakeholders',
      'Archive report'
    ]
  },
  {
    name: 'Image Processing Bot',
    description: 'Automatically resize, optimize, and organize images',
    trigger: { type: 'entity_change', config: {} },
    icon: Zap,
    category: 'content',
    integrations: ['S3', 'Cloudinary', 'Contentful'],
    workflow: [
      'Detect new images',
      'Apply filters/transformations',
      'Generate thumbnails',
      'Optimize for web',
      'Update image metadata'
    ]
  },
  {
    name: 'Lead Scoring Bot',
    description: 'Score and prioritize sales leads based on engagement',
    trigger: { type: 'entity_change', config: {} },
    icon: Zap,
    category: 'sales',
    integrations: ['HubSpot', 'Salesforce', 'Slack'],
    workflow: [
      'Monitor lead activities',
      'Calculate engagement score',
      'Analyze company size/budget',
      'Assign priority level',
      'Notify sales team'
    ]
  },
  {
    name: 'Backup Automation Bot',
    description: 'Schedule automatic backups of critical data',
    trigger: { type: 'schedule', config: {} },
    icon: Zap,
    category: 'devops',
    integrations: ['S3', 'GCP Storage', 'Azure Blob'],
    workflow: [
      'Trigger backup process',
      'Compress data',
      'Upload to cloud storage',
      'Verify backup integrity',
      'Cleanup old backups'
    ]
  },
  {
    name: 'Content Moderation Bot',
    description: 'Moderate user-generated content and flag violations',
    trigger: { type: 'entity_change', config: {} },
    icon: Zap,
    category: 'content',
    integrations: ['Moderation API', 'Slack', 'Email'],
    workflow: [
      'Scan new content',
      'Check for violations',
      'Flag inappropriate content',
      'Notify moderators',
      'Log moderation actions'
    ]
  },
  {
    name: 'Appointment Reminder Bot',
    description: 'Send reminders before scheduled appointments',
    trigger: { type: 'schedule', config: {} },
    icon: Clock,
    category: 'scheduling',
    integrations: ['Twilio', 'SendGrid', 'Calendar'],
    workflow: [
      'Query upcoming appointments',
      'Calculate reminder time',
      'Send SMS/email reminders',
      'Track confirmation',
      'Update appointment status'
    ]
  }
];

const aiCapabilities = [
  {
    title: 'Workflow Planning',
    description: 'Generate end-to-end bot workflows with clear steps and triggers.'
  },
  {
    title: 'Trigger Selection',
    description: 'Recommend schedule, webhook, email, entity change, or file upload triggers.'
  },
  {
    title: 'Integration Hints',
    description: 'Suggest integrations and channels for each use case.'
  },
  {
    title: 'Action Sequencing',
    description: 'Build structured nodes for visual editing and execution.'
  }
];

const promptSuggestions = [
  'Create a social media bot that schedules posts and reports engagement weekly',
  'Build a trader bot that executes momentum trades with daily summaries',
  'Make a support bot that triages emails and escalates urgent tickets',
  'Design a data aggregator that collects and normalizes CRM data nightly'
];

export default function BotBuilder() {
  const [showDialog, setShowDialog] = useState(false);
  const [selectedBot, setSelectedBot] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [showVisualEditor, setShowVisualEditor] = useState(false);
  const [workflowNodes, setWorkflowNodes] = useState([]);
  const [promptText, setPromptText] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [autoOpenVisualEditor, setAutoOpenVisualEditor] = useState(true);
  const [templateSearch, setTemplateSearch] = useState('');
  const [templateCategory, setTemplateCategory] = useState('all');
  const [dialogTemplateSearch, setDialogTemplateSearch] = useState('');
  const [dialogTemplateCategory, setDialogTemplateCategory] = useState('all');
  const [promptHistory, setPromptHistory] = useState([]);
  const [aiPreferences, setAiPreferences] = useState({
    trigger: '',
    integrations: '',
    output: ''
  });
  const [botProjectId, setBotProjectId] = useState(null);
  const [newBot, setNewBot] = useState({
    name: '',
    description: '',
    trigger: { type: 'schedule', config: {} },
    nodes: [],
    status: 'draft'
  });

  const urlParams = new URLSearchParams(window.location.search);
  const projectId = urlParams.get('projectId');
  const BOT_PROJECT_STORAGE_KEY = 'botBuilderProjectId';
  const BOT_PROMPT_HISTORY_KEY = 'botBuilderPromptHistory';

  const queryClient = useQueryClient();

  useEffect(() => {
    let isMounted = true;

    const ensureBotProject = async () => {
      if (projectId) {
        setBotProjectId(projectId);
        return;
      }

      const storedId = window.localStorage.getItem(BOT_PROJECT_STORAGE_KEY);
      if (storedId) {
        setBotProjectId(storedId);
        return;
      }

      try {
        const existing = await base44.entities.Project.filter({ name: 'Bot Builder' });
        const existingProject = Array.isArray(existing) ? existing[0] : existing?.data?.[0];
        if (existingProject?.id) {
          window.localStorage.setItem(BOT_PROJECT_STORAGE_KEY, existingProject.id);
          if (isMounted) setBotProjectId(existingProject.id);
          return;
        }

        const created = await base44.entities.Project.create({
          name: 'Bot Builder',
          description: 'Standalone project for automation bots',
          icon: '🤖',
          color: '#111827',
          status: 'active',
          metadata: { system_project: 'bot_builder' }
        });

        const createdId = created?.id || created?.data?.id;
        if (createdId) {
          window.localStorage.setItem(BOT_PROJECT_STORAGE_KEY, createdId);
          if (isMounted) setBotProjectId(createdId);
        }
      } catch (error) {
        console.error('Failed to initialize bot project:', error);
      }
    };

    ensureBotProject();

    return () => {
      isMounted = false;
    };
  }, [projectId]);

  useEffect(() => {
    const storedHistory = window.localStorage.getItem(BOT_PROMPT_HISTORY_KEY);
    if (storedHistory) {
      try {
        setPromptHistory(JSON.parse(storedHistory));
      } catch (error) {
        console.error('Failed to parse prompt history:', error);
      }
    }
  }, []);

  const { data: bots = [], isLoading } = useQuery({
    queryKey: ['automations', botProjectId],
    queryFn: async () => {
      try {
        return await base44.entities.Automation.filter({ project_id: botProjectId });
      } catch (error) {
        console.error('Failed to fetch automations:', error);
        return [];
      }
    },
    enabled: !!botProjectId
  });

  const createMutation = useMutation({
    mutationFn: (data) => {
      const enrichedMetadata = {
        ...(data.metadata || {}),
        ai_prompt_history: promptHistory,
        created_at: new Date().toISOString(),
        created_by: currentUser?.email || 'unknown',
        version: '1.0',
        workflow_complexity: analyzeWorkflowComplexity(data.nodes?.map(n => n.name) || []),
        last_modified: new Date().toISOString()
      };

      return base44.entities.Automation.create({
        ...data,
        project_id: botProjectId,
        metadata: enrichedMetadata
      });
    },
    onSuccess: async (result) => {
      queryClient.invalidateQueries({ queryKey: ['automations', botProjectId] });
      await logActivity(result.id, 'created', `Created bot: ${newBot.name}`);
      setShowDialog(false);
      setNewBot({ name: '', description: '', trigger: { type: 'schedule', config: {} }, nodes: [], status: 'draft' });
      toast.success('Bot created successfully');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Automation.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automations', botProjectId] });
      toast.success('Bot updated');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Automation.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automations', botProjectId] });
      toast.success('Bot deleted');
    }
  });

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const toggleStatus = (bot) => {
    const newStatus = bot.status === 'active' ? 'paused' : 'active';
    updateMutation.mutate({ id: bot.id, data: { status: newStatus } });
    logActivity(bot.id, newStatus === 'active' ? 'deployed' : 'paused', `Bot ${newStatus}`);
  };

  const logActivity = async (botId, action, description) => {
    try {
      await base44.entities.BotActivityLog.create({
        bot_id: botId,
        action,
        performed_by: currentUser?.email,
        description
      });
    } catch (error) {
      console.error('Failed to log activity:', error);
    }
  };

  const generateBotWorkflow = async (description) => {
    setIsGenerating(true);
    try {
      const historyEntry = {
        prompt: description,
        preferences: { ...aiPreferences },
        created_at: new Date().toISOString()
      };
      const updatedHistory = [historyEntry, ...promptHistory].slice(0, 20);
      setPromptHistory(updatedHistory);
      window.localStorage.setItem(BOT_PROMPT_HISTORY_KEY, JSON.stringify(updatedHistory));

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an expert automation architect. Create a comprehensive, production-ready automation bot workflow.

**User Request:** ${description}

**User Preferences:**
${aiPreferences.trigger ? `- Preferred Trigger: ${aiPreferences.trigger}` : ''}
${aiPreferences.integrations ? `- Preferred Integrations: ${aiPreferences.integrations}` : ''}
${aiPreferences.output ? `- Desired Output: ${aiPreferences.output}` : ''}

**Requirements:**
1. **name**: Clear, action-oriented name (e.g., "Smart Email Auto-Responder", "Crypto Grid Trading Bot")
2. **description**: Concise 1-2 sentence description of the bot's purpose and value
3. **trigger_type**: Select the MOST appropriate trigger:
   - schedule: For time-based recurring tasks
   - webhook: For external API events
   - email: For email-triggered actions
   - entity_change: For database/entity updates
   - file_upload: For file processing
   - database_change: For data monitoring
   - api_endpoint: For custom API integrations
4. **trigger_config**: Relevant configuration (e.g., {"cron": "0 */6 * * *"} for schedule, {"email_filter": "subject:urgent"} for email)
5. **workflow_steps**: 4-8 detailed, sequential steps that:
   - Start with data collection/trigger validation
   - Include processing/transformation logic
   - Have conditional logic where needed
   - Include error handling
   - End with clear output/action
   Example: ["Validate incoming webhook payload", "Extract customer email and order ID", "Query database for order status", "Check if order is shipped", "Generate personalized response", "Send email via SendGrid", "Log interaction to CRM"]
6. **capabilities**: 4-6 specific capabilities focusing on:
   - What problems it solves
   - Key features and automation benefits
   - Integration capabilities
   - Intelligence/AI features
7. **integrations**: 3-8 specific integration suggestions (e.g., "Gmail", "Slack", "Stripe", "OpenAI", "Airtable")
8. **category**: Auto-assign category (email, social, trading, automation, data_processing, monitoring, support)
9. **complexity**: Estimate complexity (simple, moderate, complex)
10. **estimated_runtime**: Expected runtime (e.g., "< 1 minute", "2-5 minutes", "background process")

**Examples for Context:**
Email Bot: {name: "Smart Customer Support Bot", trigger_type: "email", workflow_steps: ["Parse incoming email", "Extract customer issue", "Search knowledge base", "Generate AI response", "Send reply", "Create ticket if unresolved"]}
Trading Bot: {name: "Crypto Grid Trader", trigger_type: "schedule", workflow_steps: ["Fetch current BTC price", "Calculate grid levels", "Check open positions", "Place buy orders below price", "Place sell orders above price", "Update position tracking"]}

**Output must be practical, tested-concept workflows that can be deployed immediately.**`,
        response_json_schema: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            description: { type: 'string' },
            trigger_type: { type: 'string' },
            trigger_config: { type: 'object' },
            workflow_steps: { type: 'array', items: { type: 'string' } },
            capabilities: { type: 'array', items: { type: 'string' } },
            integrations: { type: 'array', items: { type: 'string' } },
            category: { type: 'string' },
            complexity: { type: 'string' },
            estimated_runtime: { type: 'string' }
          },
          required: ['name', 'description', 'trigger_type', 'workflow_steps', 'capabilities', 'integrations']
        }
      });
      
      // Validate the AI response
      if (!result.name || !result.description || !result.workflow_steps) {
        throw new Error('Incomplete AI response - missing required fields');
      }

      // Auto-detect additional integrations from workflow
      const detectedIntegrations = detectIntegrationsFromWorkflow(
        result.workflow_steps,
        result.description
      );
      const allIntegrations = Array.from(new Set([
        ...(result.integrations || []),
        ...detectedIntegrations
      ]));

      // Auto-categorize if not provided
      const category = result.category || categorizeBot(
        result.name,
        result.description,
        result.workflow_steps
      );

      // Validate workflow
      const validation = validateWorkflow(result.workflow_steps);
      if (!validation.isValid) {
        toast.error(`Workflow validation failed: ${validation.errors.join(', ')}`);
        throw new Error('Invalid workflow');
      }

      if (validation.warnings.length > 0) {
        validation.warnings.forEach(warning => {
          toast.warning(warning, { duration: 4000 });
        });
      }

      const complexity = result.complexity || analyzeWorkflowComplexity(result.workflow_steps);
      
      const enhancedMetadata = {
        ai_generated: true,
        generation_prompt: description,
        capabilities: result.capabilities || [],
        category,
        complexity,
        estimated_runtime: result.estimated_runtime || 'unknown',
        created_at: new Date().toISOString(),
        validation: {
          errors: validation.errors,
          warnings: validation.warnings
        }
      };

      setNewBot({
        ...newBot,
        name: result.name,
        description: result.description,
        trigger: { type: result.trigger_type, config: result.trigger_config || {} },
        integrations: allIntegrations,
        metadata: enhancedMetadata
      });

      if (Array.isArray(result.workflow_steps)) {
        const nodes = result.workflow_steps.map((step, index) => ({
          id: `node-${Date.now()}-${index}`,
          name: step,
          type: 'action',
          metadata: {
            stepNumber: index + 1,
            estimatedDuration: 'auto'
          }
        }));
        setWorkflowNodes(nodes);
        setNewBot((prev) => ({
          ...prev,
          nodes,
          metadata: {
            ...prev.metadata,
            ...enhancedMetadata
          }
        }));
        if (autoOpenVisualEditor) {
          setShowVisualEditor(true);
        }
      }

      const successMessage = `✨ Generated ${complexity} ${category} bot with ${result.workflow_steps.length} steps!`;
      toast.success(successMessage, { duration: 5000 });
      
      // Show integration suggestions
      if (allIntegrations.length > 0) {
        toast.info(`Suggested integrations: ${allIntegrations.slice(0, 3).join(', ')}${allIntegrations.length > 3 ? '...' : ''}`, { duration: 4000 });
      }
    } catch (error) {
      console.error('AI generation error:', error);
      const errorMessage = error.message || 'Failed to generate workflow';
      toast.error(`AI Generation Error: ${errorMessage}`, { duration: 6000 });
    } finally {
      setIsGenerating(false);
    }
  };

  const templateCategories = useMemo(() => {
    const categories = Array.from(new Set(botTemplates.map((template) => template.category)));
    return ['all', ...categories];
  }, []);

  // Enhanced helper functions for intelligent bot analysis
  const analyzeWorkflowComplexity = (workflow) => {
    if (!workflow || workflow.length === 0) return 'simple';
    if (workflow.length <= 3) return 'simple';
    if (workflow.length <= 6) return 'moderate';
    return 'complex';
  };

  const detectIntegrationsFromWorkflow = (workflow, description) => {
    const integrationKeywords = {
      'Gmail': ['email', 'gmail', 'mail', 'inbox'],
      'Slack': ['slack', 'message', 'notification', 'team'],
      'Discord': ['discord', 'server', 'channel'],
      'Telegram': ['telegram', 'bot', 'chat'],
      'Twitter/X': ['twitter', 'tweet', 'x.com', 'social media'],
      'LinkedIn': ['linkedin', 'professional', 'network'],
      'Calendar': ['calendar', 'schedule', 'meeting', 'appointment'],
      'Stripe': ['payment', 'stripe', 'billing', 'subscription'],
      'Binance': ['binance', 'crypto', 'trading', 'cryptocurrency'],
      'Coinbase': ['coinbase', 'bitcoin', 'ethereum'],
      'OpenAI': ['ai', 'gpt', 'openai', 'language model'],
      'GitHub': ['github', 'repository', 'code', 'commit'],
      'Notion': ['notion', 'notes', 'database', 'wiki'],
      'Airtable': ['airtable', 'spreadsheet', 'database'],
      'Zapier': ['zapier', 'automation', 'integration'],
      'Shopify': ['shopify', 'ecommerce', 'store', 'product'],
      'SendGrid': ['sendgrid', 'email marketing', 'newsletter'],
      'Twilio': ['twilio', 'sms', 'phone', 'call']
    };

    const detected = [];
    const text = `${description} ${workflow.join(' ')}`.toLowerCase();

    Object.entries(integrationKeywords).forEach(([integration, keywords]) => {
      if (keywords.some(keyword => text.includes(keyword))) {
        detected.push(integration);
      }
    });

    return detected.slice(0, 6);
  };

  const categorizeBot = (name, description, workflow) => {
    const text = `${name} ${description}`.toLowerCase();
    
    if (text.match(/email|inbox|mail|message/)) return 'email';
    if (text.match(/social|twitter|facebook|instagram|linkedin/)) return 'social';
    if (text.match(/trading|crypto|stock|finance|investment/)) return 'trading';
    if (text.match(/schedule|calendar|reminder|appointment/)) return 'automation';
    if (text.match(/data|database|analytics|report/)) return 'data_processing';
    if (text.match(/monitor|alert|track|watch/)) return 'monitoring';
    if (text.match(/customer|support|ticket|helpdesk/)) return 'support';
    
    return 'automation';
  };

  const validateWorkflow = (workflow) => {
    const errors = [];
    const warnings = [];

    if (!workflow || workflow.length === 0) {
      errors.push('Workflow must have at least one step');
    }

    if (workflow && workflow.length > 15) {
      warnings.push('Workflow has many steps - consider breaking into multiple bots');
    }

    if (workflow && workflow.length === 1) {
      warnings.push('Single-step workflow - consider adding error handling or validation steps');
    }

    const hasErrorHandling = workflow?.some(step =>
      step.toLowerCase().includes('error') ||
      step.toLowerCase().includes('retry') ||
      step.toLowerCase().includes('fallback')
    );

    if (!hasErrorHandling && workflow && workflow.length > 3) {
      warnings.push('Consider adding error handling steps');
    }

    return { errors, warnings, isValid: errors.length === 0 };
  };

  const calculateRelevanceScore = (template, searchTerm) => {
    if (!searchTerm) return 0;
    
    const term = searchTerm.toLowerCase();
    let score = 0;

    if (template.name.toLowerCase() === term) score += 100;
    else if (template.name.toLowerCase().includes(term)) score += 50;

    if (template.description.toLowerCase().includes(term)) score += 30;
    if (template.category.toLowerCase() === term) score += 40;

    if (template.integrations?.some(i => i.toLowerCase().includes(term))) score += 35;
    if (template.workflow?.some(w => w.toLowerCase().includes(term))) score += 20;

    return score;
  };

  const getFilteredTemplates = (categoryFilter, searchTerm) => {
    const term = searchTerm.trim().toLowerCase();
    let filtered = botTemplates.filter((template) => {
      const matchesCategory = categoryFilter === 'all' || template.category === categoryFilter;
      const matchesTerm =
        !term ||
        template.name.toLowerCase().includes(term) ||
        template.description.toLowerCase().includes(term) ||
        template.category.toLowerCase().includes(term) ||
        (template.integrations || []).some((integration) => integration.toLowerCase().includes(term)) ||
        (template.workflow || []).some((step) => step.toLowerCase().includes(term));

      return matchesCategory && matchesTerm;
    });

    // Sort by relevance score when searching
    if (term) {
      filtered = filtered
        .map(template => ({
          ...template,
          relevanceScore: calculateRelevanceScore(template, term)
        }))
        .sort((a, b) => b.relevanceScore - a.relevanceScore);
    }

    return filtered;
  };

  if (!botProjectId) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Bot className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Preparing Bot Builder</h2>
          <p className="text-gray-500">Setting up a dedicated bot workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col gap-4 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">Bot Builder</h1>
            <p className="text-gray-500">Create automated workflows and intelligent bots with team collaboration</p>
          </div>
          <Button onClick={() => setShowDialog(true)} className="bg-gray-900 hover:bg-gray-800">
            <Plus className="w-4 h-4 mr-2" />
            Create Bot
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            placeholder="What kind of bot do you want to create?"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && promptText.trim()) {
                setActiveTab('custom');
                setShowDialog(true);
                setAiPrompt(promptText.trim());
                generateBotWorkflow(promptText.trim());
              }
            }}
          />
          <Button
            variant="outline"
            disabled={isGenerating || !promptText.trim()}
            onClick={() => {
              setActiveTab('custom');
              setShowDialog(true);
              setAiPrompt(promptText.trim());
              generateBotWorkflow(promptText.trim());
            }}
          >
            {isGenerating ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            Generate Bot
          </Button>
        </div>

        <div className="flex items-center gap-3 text-xs text-gray-600">
          <Switch
            checked={autoOpenVisualEditor}
            onCheckedChange={setAutoOpenVisualEditor}
            id="auto-open-visual"
          />
          <Label htmlFor="auto-open-visual" className="text-xs">Auto-open visual editor after generation</Label>
        </div>

        <div className="flex flex-wrap gap-2">
          {promptSuggestions.map((suggestion) => (
            <Button
              key={suggestion}
              variant="secondary"
              size="sm"
              onClick={() => {
                setPromptText(suggestion);
                setActiveTab('custom');
                setShowDialog(true);
                setAiPrompt(suggestion);
                generateBotWorkflow(suggestion);
              }}
            >
              {suggestion}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {aiCapabilities.map((capability) => (
          <Card key={capability.title} className="border-gray-200">
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-1">{capability.title}</h3>
              <p className="text-xs text-gray-500">{capability.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Template Gallery</h2>
          <p className="text-sm text-gray-500">Pick a starting point for what your bot can do</p>
        </div>
        <div className="flex flex-col gap-3 mb-4">
          <Input
            value={templateSearch}
            onChange={(e) => setTemplateSearch(e.target.value)}
            placeholder="Search templates by name, capability, or integration"
          />
          <div className="flex flex-wrap gap-2">
            {templateCategories.map((category) => (
              <Button
                key={category}
                variant={templateCategory === category ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTemplateCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {getFilteredTemplates(templateCategory, templateSearch).map((template, idx) => {
            const TemplateIcon = template.icon;
            const capabilityPreview = template.capabilities || template.workflow;
            return (
              <Card
                key={`${template.name}-${idx}`}
                className="cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => {
                  setNewBot({
                    name: template.name,
                    description: template.description,
                    trigger: template.trigger,
                    nodes: template.workflow.map((step, i) => ({
                      id: `node-${i}`,
                      name: step,
                      type: 'action'
                    })),
                    integrations: template.integrations || [],
                    status: 'draft'
                  });
                  setActiveTab('custom');
                  setShowDialog(true);
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                      <TemplateIcon className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm mb-1">{template.name}</h4>
                      <p className="text-xs text-gray-600 mb-2">{template.description}</p>
                      <div className="flex flex-wrap gap-1 mb-2">
                        <Badge variant="secondary" className="text-[10px] uppercase">
                          {template.category}
                        </Badge>
                        {(template.integrations || []).slice(0, 2).map((integration) => (
                          <Badge key={integration} variant="outline" className="text-[10px]">
                            {integration}
                          </Badge>
                        ))}
                      </div>
                      <ul className="text-xs text-gray-500 list-disc pl-4 space-y-1">
                        {capabilityPreview.slice(0, 3).map((capability, index) => (
                          <li key={index}>{capability}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-4" />
              <div className="h-4 bg-gray-100 rounded w-full mb-2" />
              <div className="h-4 bg-gray-100 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : bots.length === 0 ? (
        <div className="text-center py-12">
          <Bot className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No bots yet</h3>
          <p className="text-gray-500 mb-4">Create your first automation bot</p>
          <Button onClick={() => setShowDialog(true)}>Create Bot</Button>
        </div>
      ) : (
        <div className="space-y-6">
          {bots.map((bot) => (
            <div key={bot.id} className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              <div className="lg:col-span-1">
                <Card className="hover:shadow-lg transition-shadow h-full">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                          <Bot className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{bot.name}</CardTitle>
                          <Badge variant={bot.status === 'active' ? 'default' : 'secondary'} className="mt-1">
                            {bot.status}
                          </Badge>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteMutation.mutate(bot.id)}
                      >
                        <Trash2 className="w-4 h-4 text-gray-400" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4">{bot.description}</p>
                    
                    {/* Capabilities Panel */}
                    {bot.metadata?.capabilities && bot.metadata.capabilities.length > 0 && (
                      <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <h4 className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          Capabilities
                        </h4>
                        <ul className="space-y-1">
                          {bot.metadata.capabilities.slice(0, 3).map((capability, idx) => (
                            <li key={idx} className="text-xs text-gray-600 flex items-start gap-1">
                              <span className="text-gray-400 mt-0.5">•</span>
                              <span className="flex-1">{capability}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Integrations Panel */}
                    {bot.integrations && bot.integrations.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-xs font-semibold text-gray-700 mb-2">Integrations</h4>
                        <div className="flex flex-wrap gap-1">
                          {bot.integrations.slice(0, 4).map((integration, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {integration}
                            </Badge>
                          ))}
                          {bot.integrations.length > 4 && (
                            <Badge variant="outline" className="text-xs">
                              +{bot.integrations.length - 4} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                      <span>Trigger: {bot.trigger?.type || 'None'}</span>
                      <span>Runs: {bot.execution_count || 0}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => toggleStatus(bot)}
                        variant={bot.status === 'active' ? 'outline' : 'default'}
                        className="flex-1"
                        size="sm"
                      >
                        {bot.status === 'active' ? (
                          <>
                            <Pause className="w-3 h-3 mr-1" />
                            Pause
                          </>
                        ) : (
                          <>
                            <Play className="w-3 h-3 mr-1" />
                            Activate
                          </>
                        )}
                      </Button>
                      <Button variant="outline" size="sm">
                        <Settings className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
              <div className="lg:col-span-3 space-y-4">
                <CollaboratorManager botId={bot.id} />
                <ActivityLog botId={bot.id} />
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Bot</DialogTitle>
          </DialogHeader>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="all">All Templates</TabsTrigger>
              <TabsTrigger value="email">Email</TabsTrigger>
              <TabsTrigger value="social">Social</TabsTrigger>
              <TabsTrigger value="trading">Trading</TabsTrigger>
              <TabsTrigger value="automation">Automation</TabsTrigger>
              <TabsTrigger value="custom">Custom</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4 mt-4">
              <Label className="mb-2 block">All Available Templates</Label>
              <div className="flex flex-col gap-2">
                <Input
                  value={dialogTemplateSearch}
                  onChange={(e) => setDialogTemplateSearch(e.target.value)}
                  placeholder="Search templates"
                />
                <div className="flex flex-wrap gap-2">
                  {templateCategories.map((category) => (
                    <Button
                      key={category}
                      variant={dialogTemplateCategory === category ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setDialogTemplateCategory(category)}
                    >
                      {category}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 gap-2 mb-4">
                {getFilteredTemplates(dialogTemplateCategory, dialogTemplateSearch).map((template, idx) => {
                  const TemplateIcon = template.icon;
                  const capabilityPreview = template.capabilities || template.workflow;
                  return (
                    <Card 
                      key={idx} 
                      className="cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => {
                        setNewBot({
                          name: template.name,
                          description: template.description,
                          trigger: template.trigger,
                          nodes: template.workflow.map((step, i) => ({
                            id: `node-${i}`,
                            name: step,
                            type: 'action'
                          })),
                          integrations: template.integrations || [],
                          status: 'draft'
                        });
                        setActiveTab('custom');
                      }}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                            <TemplateIcon className="w-5 h-5 text-indigo-600" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-sm">{template.name}</h4>
                              <Badge variant="outline" className="text-xs">{template.category}</Badge>
                            </div>
                            <p className="text-xs text-gray-600 mt-1">{template.description}</p>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {(template.integrations || []).slice(0, 3).map((integration) => (
                                <Badge key={integration} variant="secondary" className="text-[10px]">
                                  {integration}
                                </Badge>
                              ))}
                            </div>
                            <ul className="text-xs text-gray-500 list-disc pl-4 mt-2 space-y-1">
                              {capabilityPreview.slice(0, 3).map((capability, index) => (
                                <li key={index}>{capability}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="email" className="space-y-4 mt-4">
              <Label className="mb-2 block">Email & Communication Bots</Label>
              <div className="grid grid-cols-1 gap-2 mb-4">
                {botTemplates.filter(t => t.category === 'email' && (!dialogTemplateSearch || t.name.toLowerCase().includes(dialogTemplateSearch.toLowerCase()) || t.description.toLowerCase().includes(dialogTemplateSearch.toLowerCase()))).map((template, idx) => {
                  const TemplateIcon = template.icon;
                  const capabilityPreview = template.capabilities || template.workflow;
                  return (
                    <Card 
                      key={idx} 
                      className="cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => {
                        setNewBot({
                          name: template.name,
                          description: template.description,
                          trigger: template.trigger,
                          nodes: template.workflow.map((step, i) => ({
                            id: `node-${i}`,
                            name: step,
                            type: 'action'
                          })),
                          integrations: template.integrations || [],
                          status: 'draft'
                        });
                        setActiveTab('custom');
                      }}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                            <TemplateIcon className="w-5 h-5 text-indigo-600" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-sm mb-1">{template.name}</h4>
                            <p className="text-xs text-gray-600 mb-2">{template.description}</p>
                            <div className="flex flex-wrap gap-1">
                              {capabilityPreview.slice(0, 3).map((step, i) => (
                                <Badge key={i} variant="outline" className="text-xs">
                                  {step}
                                </Badge>
                              ))}
                              {capabilityPreview.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{capabilityPreview.length - 3} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="social" className="space-y-4 mt-4">
              <Label className="mb-2 block">Social Media Bots</Label>
              <div className="grid grid-cols-1 gap-2 mb-4">
                {botTemplates.filter(t => t.category === 'social' && (!dialogTemplateSearch || t.name.toLowerCase().includes(dialogTemplateSearch.toLowerCase()) || t.description.toLowerCase().includes(dialogTemplateSearch.toLowerCase()))).map((template, idx) => {
                  const TemplateIcon = template.icon;
                  const capabilityPreview = template.capabilities || template.workflow;
                  return (
                    <Card 
                      key={idx} 
                      className="cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => {
                        setNewBot({
                          name: template.name,
                          description: template.description,
                          trigger: template.trigger,
                          nodes: template.workflow.map((step, i) => ({
                            id: `node-${i}`,
                            name: step,
                            type: 'action'
                          })),
                          integrations: template.integrations || [],
                          status: 'draft'
                        });
                        setActiveTab('custom');
                      }}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-lg bg-pink-100 flex items-center justify-center">
                            <TemplateIcon className="w-5 h-5 text-pink-600" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-sm mb-1">{template.name}</h4>
                            <p className="text-xs text-gray-600 mb-2">{template.description}</p>
                            <div className="flex flex-wrap gap-1">
                              {capabilityPreview.slice(0, 3).map((step, i) => (
                                <Badge key={i} variant="outline" className="text-xs">
                                  {step}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="automation" className="space-y-4 mt-4">
              <Label className="mb-2 block">Automation Bots</Label>
              <div className="grid grid-cols-1 gap-2 mb-4">
                {botTemplates.filter(t => ['data_processing', 'reporting', 'content', 'sales', 'devops', 'scheduling', 'integration', 'social', 'monitoring'].includes(t.category) && (!dialogTemplateSearch || t.name.toLowerCase().includes(dialogTemplateSearch.toLowerCase()) || t.description.toLowerCase().includes(dialogTemplateSearch.toLowerCase()))).map((template, idx) => {
                  const TemplateIcon = template.icon;
                  const capabilityPreview = template.capabilities || template.workflow;
                  return (
                    <Card 
                      key={idx} 
                      className="cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => {
                        setNewBot({
                          name: template.name,
                          description: template.description,
                          trigger: template.trigger,
                          nodes: template.workflow.map((step, i) => ({
                            id: `node-${i}`,
                            name: step,
                            type: 'action'
                          })),
                          integrations: template.integrations || [],
                          status: 'draft'
                        });
                        setActiveTab('custom');
                      }}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                            <TemplateIcon className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-sm mb-1">{template.name}</h4>
                            <p className="text-xs text-gray-600">{template.description}</p>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {capabilityPreview.slice(0, 3).map((step, i) => (
                                <Badge key={i} variant="outline" className="text-xs">
                                  {step}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="trading" className="space-y-4 mt-4">
              <Label className="mb-2 block">Crypto & Trading Bots</Label>
              <CryptoTradingBotBuilder onSave={(botConfig) => {
                setNewBot(botConfig);
                setActiveTab('custom');
              }} />
            </TabsContent>

            <TabsContent value="custom" className="space-y-4 mt-4">
              <div className="border-t pt-4">
                <Label className="mb-2 block">AI Bot Generator</Label>
                <div className="flex gap-2 mb-3">
                  <Input
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="Describe what you want to automate..."
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                        generateBotWorkflow(e.currentTarget.value);
                      }
                    }}
                  />
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (aiPrompt.trim()) generateBotWorkflow(aiPrompt.trim());
                    }}
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <Input
                    value={aiPreferences.trigger}
                    onChange={(e) => setAiPreferences({ ...aiPreferences, trigger: e.target.value })}
                    placeholder="Preferred trigger (e.g., webhook, schedule)"
                  />
                  <Input
                    value={aiPreferences.integrations}
                    onChange={(e) => setAiPreferences({ ...aiPreferences, integrations: e.target.value })}
                    placeholder="Preferred integrations (e.g., Slack, Gmail)"
                  />
                  <Input
                    value={aiPreferences.output}
                    onChange={(e) => setAiPreferences({ ...aiPreferences, output: e.target.value })}
                    placeholder="Desired output (e.g., report, notification)"
                  />
                </div>
                {promptHistory.length > 0 && (
                  <div className="mt-3">
                    <Label className="text-xs text-gray-500">Recent prompts</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {promptHistory.slice(0, 4).map((item) => (
                        <Button
                          key={item.created_at}
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setAiPrompt(item.prompt);
                            generateBotWorkflow(item.prompt);
                          }}
                        >
                          {item.prompt}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div>
                <Label>Bot Name</Label>
                <Input
                  value={newBot.name}
                  onChange={(e) => setNewBot({ ...newBot, name: e.target.value })}
                  placeholder="My Automation Bot"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={newBot.description}
                  onChange={(e) => setNewBot({ ...newBot, description: e.target.value })}
                  placeholder="What does this bot do?"
                  rows={3}
                />
              </div>
              <div>
                <Label>Trigger Type</Label>
                <Select
                  value={newBot.trigger.type}
                  onValueChange={(value) => setNewBot({ ...newBot, trigger: { type: value, config: {} } })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {triggerTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        <div className="flex items-center gap-2">
                          <type.icon className="w-4 h-4" />
                          <div>
                            <div className="font-medium">{type.name}</div>
                            <div className="text-xs text-gray-500">{type.description}</div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <TriggerConfiguration
                triggerType={newBot.trigger.type}
                config={newBot.trigger.config}
                onChange={(config) => setNewBot({ ...newBot, trigger: { type: newBot.trigger.type, config } })}
              />

              <div>
                <Label className="mb-2 block">Visual Workflow Editor</Label>
                <Button
                  variant="outline"
                  onClick={() => {
                    setWorkflowNodes(newBot.nodes.length > 0 ? newBot.nodes : []);
                    setShowVisualEditor(true);
                  }}
                  className="w-full"
                >
                  Open Visual Editor
                </Button>
              </div>
              </TabsContent>
              </Tabs>

              <DialogFooter>
              <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
              <Button onClick={() => createMutation.mutate(newBot)} disabled={!newBot.name}>
                Create Bot
              </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      {showVisualEditor && (
        <Dialog open={showVisualEditor} onOpenChange={setShowVisualEditor}>
          <DialogContent className="max-w-6xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>Visual Workflow Editor</DialogTitle>
            </DialogHeader>
            <div className="h-[70vh]">
              <VisualWorkflowEditor
                initialNodes={workflowNodes}
                onSave={(nodes) => {
                  setNewBot({
                    ...newBot,
                    nodes: nodes.map((node, idx) => ({
                      id: `node-${idx}`,
                      name: node.label || node.type,
                      type: node.type,
                      config: node.config
                    }))
                  });
                  setShowVisualEditor(false);
                  toast.success('Workflow saved');
                }}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}