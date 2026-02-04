/**
 * ProjectWizard Component
 * Interactive wizard for generating full projects from descriptions
 * Guides users through project generation with step-by-step feedback
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Database,
  Workflow,
  Layout,
  CheckCircle,
  Circle,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Wand2,
  Settings,
  FileCode,
  Play,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Edit3,
  Trash2,
  Plus,
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { base44 } from '@/api/base44Client';
import {
  analyzeProjectDescription,
  generateFullProject,
  PROJECT_TEMPLATES,
  WORKFLOW_TEMPLATES
} from '@/utils/projectGenerator';

const WIZARD_STEPS = [
  { id: 'describe', label: 'Describe', icon: Edit3 },
  { id: 'analyze', label: 'Analyze', icon: Sparkles },
  { id: 'entities', label: 'Entities', icon: Database },
  { id: 'workflows', label: 'Workflows', icon: Workflow },
  { id: 'pages', label: 'Pages', icon: Layout },
  { id: 'generate', label: 'Generate', icon: Play }
];

export default function ProjectWizard({ onComplete, onCancel, initialDescription = '' }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [description, setDescription] = useState(initialDescription);
  const [analysis, setAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(null);
  const [error, setError] = useState(null);
  
  // Editable project configuration
  const [projectConfig, setProjectConfig] = useState({
    name: '',
    type: null,
    entities: [],
    workflows: [],
    pages: [],
    features: {}
  });
  
  // Expanded sections for editing
  const [expandedSections, setExpandedSections] = useState({});
  
  // Generated project result
  const [generatedProject, setGeneratedProject] = useState(null);

  // Auto-analyze when description changes (with debounce)
  useEffect(() => {
    if (description.length > 20 && currentStep === 0) {
      const timer = setTimeout(() => {
        handleAnalyze();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [description]);

  const handleAnalyze = async () => {
    if (!description.trim()) {
      setError('Please provide a project description');
      return;
    }
    
    setIsAnalyzing(true);
    setError(null);
    
    try {
      const result = analyzeProjectDescription(description);
      setAnalysis(result);
      
      // Initialize project config from analysis
      setProjectConfig({
        name: extractProjectName(description),
        type: result.detectedType,
        entities: result.suggestedTemplate?.entities || result.extractedEntities || [],
        workflows: result.suggestedTemplate?.workflows || [],
        pages: result.suggestedTemplate?.pages || ['Home', 'Dashboard'],
        features: result.features || {}
      });
      
      setCurrentStep(1);
    } catch (err) {
      console.error('Analysis error:', err);
      setError('Failed to analyze description. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    
    try {
      const result = await generateFullProject(
        description,
        base44,
        (progress) => setGenerationProgress(progress)
      );
      
      setGeneratedProject(result);
      setCurrentStep(5); // Move to final step
    } catch (err) {
      console.error('Generation error:', err);
      setError('Failed to generate project. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const extractProjectName = (desc) => {
    let cleaned = desc
      .replace(/^(create|build|make|develop|generate|design|i want|i need|please|help me)\s+/gi, '')
      .replace(/\s+(landing\s+page|website|web\s+app|app|page|site|for\s+me|application)$/gi, '')
      .trim();
    
    const words = cleaned.split(' ').slice(0, 5);
    return words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const addEntity = (entityName) => {
    if (entityName && !projectConfig.entities.includes(entityName)) {
      setProjectConfig(prev => ({
        ...prev,
        entities: [...prev.entities, entityName]
      }));
    }
  };

  const removeEntity = (entityName) => {
    setProjectConfig(prev => ({
      ...prev,
      entities: prev.entities.filter(e => e !== entityName)
    }));
  };

  const addWorkflow = (workflowName) => {
    if (workflowName && !projectConfig.workflows.includes(workflowName)) {
      setProjectConfig(prev => ({
        ...prev,
        workflows: [...prev.workflows, workflowName]
      }));
    }
  };

  const removeWorkflow = (workflowName) => {
    setProjectConfig(prev => ({
      ...prev,
      workflows: prev.workflows.filter(w => w !== workflowName)
    }));
  };

  const addPage = (pageName) => {
    if (pageName && !projectConfig.pages.includes(pageName)) {
      setProjectConfig(prev => ({
        ...prev,
        pages: [...prev.pages, pageName]
      }));
    }
  };

  const removePage = (pageName) => {
    setProjectConfig(prev => ({
      ...prev,
      pages: prev.pages.filter(p => p !== pageName)
    }));
  };

  const toggleFeature = (featureName) => {
    setProjectConfig(prev => ({
      ...prev,
      features: {
        ...prev.features,
        [featureName]: !prev.features[featureName]
      }
    }));
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-8">
      {WIZARD_STEPS.map((step, index) => {
        const isActive = index === currentStep;
        const isCompleted = index < currentStep;
        const StepIcon = step.icon;
        
        return (
          <React.Fragment key={step.id}>
            <button
              onClick={() => index < currentStep && setCurrentStep(index)}
              disabled={index > currentStep}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg transition-all",
                isActive && "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300",
                isCompleted && "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300 cursor-pointer hover:bg-green-200",
                !isActive && !isCompleted && "text-gray-400 cursor-not-allowed"
              )}
            >
              {isCompleted ? (
                <CheckCircle className="w-5 h-5" />
              ) : isActive ? (
                <StepIcon className="w-5 h-5" />
              ) : (
                <Circle className="w-5 h-5" />
              )}
              <span className="text-sm font-medium hidden md:inline">{step.label}</span>
            </button>
            {index < WIZARD_STEPS.length - 1 && (
              <div className={cn(
                "w-8 h-0.5 hidden md:block",
                index < currentStep ? "bg-green-500" : "bg-gray-200 dark:bg-gray-700"
              )} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );

  const renderDescriptionStep = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-4">
          <Wand2 className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Describe Your Project</h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Tell me about the application you want to build. Be as detailed as possible.
        </p>
      </div>
      
      <div className="max-w-2xl mx-auto">
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Example: Build an e-commerce platform for selling handmade crafts. It should have product listings with categories, a shopping cart, user accounts, order tracking, and reviews. Include a seller dashboard for vendors to manage their products and view sales analytics."
          className="min-h-[200px] text-base p-4"
          rows={8}
        />
        
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="text-sm text-gray-500">Quick templates:</span>
          {Object.entries(PROJECT_TEMPLATES).slice(0, 5).map(([key, template]) => (
            <Button
              key={key}
              variant="outline"
              size="sm"
              onClick={() => setDescription(`Build a ${template.name.toLowerCase()} with ${template.entities.slice(0, 3).join(', ')} management and ${template.pages.slice(0, 3).join(', ')} pages.`)}
              className="text-xs"
            >
              {template.icon} {template.name}
            </Button>
          ))}
        </div>
        
        {error && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-700 dark:text-red-400">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}
      </div>
      
      <div className="flex justify-center gap-4 mt-8">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          onClick={handleAnalyze}
          disabled={!description.trim() || isAnalyzing}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Analyze Project
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );

  const renderAnalysisStep = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Project Analysis</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Here's what I understood from your description
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {/* Project Type Detection */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-500" />
              Detected Project Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analysis?.suggestedTemplate ? (
              <div className="flex items-center gap-3">
                <span className="text-3xl">{analysis.suggestedTemplate.icon}</span>
                <div>
                  <p className="font-semibold text-lg">{analysis.suggestedTemplate.name}</p>
                  <p className="text-sm text-gray-500">
                    {Math.round(analysis.typeConfidence * 100)}% confidence
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">Custom project type</p>
            )}
            
            <div className="mt-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Change project type:</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(PROJECT_TEMPLATES).map(([key, template]) => (
                  <Button
                    key={key}
                    variant={projectConfig.type === key ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setProjectConfig(prev => ({
                        ...prev,
                        type: key,
                        entities: template.entities,
                        workflows: template.workflows,
                        pages: template.pages,
                        features: template.features.reduce((acc, f) => ({ ...acc, [f]: true }), {})
                      }));
                    }}
                  >
                    {template.icon}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Project Name */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileCode className="w-5 h-5 text-green-500" />
              Project Name
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              value={projectConfig.name}
              onChange={(e) => setProjectConfig(prev => ({ ...prev, name: e.target.value }))}
              placeholder="My Awesome Project"
              className="text-lg font-medium"
            />
          </CardContent>
        </Card>
        
        {/* Detected Features */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Settings className="w-5 h-5 text-purple-500" />
              Features
            </CardTitle>
            <CardDescription>Toggle features for your project</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(analysis?.features || {}).map(([feature, enabled]) => (
                <button
                  key={feature}
                  onClick={() => toggleFeature(feature)}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg transition-all",
                    projectConfig.features[feature] ?? enabled
                      ? "bg-indigo-100 dark:bg-indigo-900/50 border-2 border-indigo-500"
                      : "bg-gray-50 dark:bg-gray-800 border-2 border-transparent hover:border-gray-200"
                  )}
                >
                  <span className="text-sm capitalize font-medium">
                    {feature.replace(/_/g, ' ')}
                  </span>
                  {(projectConfig.features[feature] ?? enabled) && (
                    <CheckCircle className="w-4 h-4 text-indigo-600" />
                  )}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="flex justify-center gap-4 mt-8">
        <Button variant="outline" onClick={() => setCurrentStep(0)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button
          onClick={() => setCurrentStep(2)}
          className="bg-gradient-to-r from-indigo-600 to-purple-600"
        >
          Configure Entities
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </motion.div>
  );

  const renderEntitiesStep = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Data Models</h2>
        <p className="text-gray-600 dark:text-gray-400">
          These entities will be created for your project
        </p>
      </div>
      
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Database className="w-5 h-5 text-blue-500" />
                Entities ({projectConfig.entities.length})
              </CardTitle>
              <EntityAdder onAdd={addEntity} existingEntities={projectConfig.entities} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {projectConfig.entities.map((entity, index) => (
                <motion.div
                  key={entity}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                      <Database className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="font-medium">{entity}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeEntity(entity)}
                    className="h-8 w-8 text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </motion.div>
              ))}
            </div>
            
            {projectConfig.entities.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No entities added yet. Click "Add Entity" to get started.
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Suggested Entities */}
        {analysis?.extractedEntities?.length > 0 && (
          <div className="mt-4">
            <p className="text-sm text-gray-500 mb-2">Suggested entities from your description:</p>
            <div className="flex flex-wrap gap-2">
              {analysis.extractedEntities
                .filter(e => !projectConfig.entities.includes(e))
                .map(entity => (
                  <Button
                    key={entity}
                    variant="outline"
                    size="sm"
                    onClick={() => addEntity(entity)}
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    {entity}
                  </Button>
                ))}
            </div>
          </div>
        )}
      </div>
      
      <div className="flex justify-center gap-4 mt-8">
        <Button variant="outline" onClick={() => setCurrentStep(1)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button
          onClick={() => setCurrentStep(3)}
          className="bg-gradient-to-r from-indigo-600 to-purple-600"
        >
          Configure Workflows
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </motion.div>
  );

  const renderWorkflowsStep = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Workflows</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Automated business processes for your application
        </p>
      </div>
      
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Workflow className="w-5 h-5 text-purple-500" />
                Workflows ({projectConfig.workflows.length})
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {projectConfig.workflows.map((workflow, index) => {
                const template = WORKFLOW_TEMPLATES[workflow];
                return (
                  <motion.div
                    key={workflow}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <div
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg cursor-pointer"
                      onClick={() => toggleSection(`workflow-${workflow}`)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                          <Workflow className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                          <span className="font-medium">{template?.name || workflow}</span>
                          {template?.description && (
                            <p className="text-sm text-gray-500">{template.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {expandedSections[`workflow-${workflow}`] ? (
                          <ChevronUp className="w-4 h-4 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeWorkflow(workflow);
                          }}
                          className="h-8 w-8 text-gray-400 hover:text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Expanded workflow details */}
                    {expandedSections[`workflow-${workflow}`] && template && (
                      <div className="ml-11 mt-2 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          <strong>Trigger:</strong> {template.trigger}
                        </p>
                        <div className="space-y-1">
                          {template.steps.map((step, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm">
                              <span className="w-5 h-5 rounded-full bg-purple-200 dark:bg-purple-800 text-purple-700 dark:text-purple-300 flex items-center justify-center text-xs">
                                {i + 1}
                              </span>
                              <span>{step.description}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
            
            {projectConfig.workflows.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No workflows added yet.
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Available Workflows */}
        <div className="mt-4">
          <p className="text-sm text-gray-500 mb-2">Available workflow templates:</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(WORKFLOW_TEMPLATES)
              .filter(([key]) => !projectConfig.workflows.includes(key))
              .map(([key, template]) => (
                <Button
                  key={key}
                  variant="outline"
                  size="sm"
                  onClick={() => addWorkflow(key)}
                >
                  <Plus className="w-3 h-3 mr-1" />
                  {template.name}
                </Button>
              ))}
          </div>
        </div>
      </div>
      
      <div className="flex justify-center gap-4 mt-8">
        <Button variant="outline" onClick={() => setCurrentStep(2)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button
          onClick={() => setCurrentStep(4)}
          className="bg-gradient-to-r from-indigo-600 to-purple-600"
        >
          Configure Pages
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </motion.div>
  );

  const renderPagesStep = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">UI Pages</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Pages that will be created for your application
        </p>
      </div>
      
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Layout className="w-5 h-5 text-green-500" />
                Pages ({projectConfig.pages.length})
              </CardTitle>
              <PageAdder onAdd={addPage} existingPages={projectConfig.pages} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {projectConfig.pages.map((page, index) => (
                <motion.div
                  key={page}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.03 }}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <Layout className="w-4 h-4 text-green-600 dark:text-green-400" />
                    <span className="font-medium text-sm">{page}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removePage(page)}
                    className="h-6 w-6 text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </motion.div>
              ))}
            </div>
            
            {projectConfig.pages.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No pages added yet. Click "Add Page" to get started.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <div className="flex justify-center gap-4 mt-8">
        <Button variant="outline" onClick={() => setCurrentStep(3)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-2" />
              Generate Project
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );

  const renderGeneratingStep = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mx-auto mb-4">
          {generatedProject ? (
            <CheckCircle className="w-8 h-8 text-white" />
          ) : (
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          )}
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          {generatedProject ? 'Project Created!' : 'Generating Project...'}
        </h2>
        {generationProgress && !generatedProject && (
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            {generationProgress.message}
          </p>
        )}
      </div>
      
      {/* Progress Bar */}
      {generationProgress && (
        <div className="max-w-md mx-auto">
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
              initial={{ width: 0 }}
              animate={{ width: `${generationProgress.progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <p className="text-center text-sm text-gray-500 mt-2">
            {generationProgress.progress}% complete
          </p>
        </div>
      )}
      
      {/* Success Summary */}
      {generatedProject && (
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">{analysis?.suggestedTemplate?.icon || '✨'}</span>
                {generatedProject.project.name}
              </CardTitle>
              <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <Database className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                    {generatedProject.entities.length}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Entities</p>
                </div>
                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <Workflow className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-purple-700 dark:text-purple-400">
                    {generatedProject.workflows.length}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Workflows</p>
                </div>
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <Layout className="w-6 h-6 text-green-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                    {generatedProject.pages.length}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Pages</p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="justify-center gap-4">
              <Button variant="outline" onClick={onCancel}>
                Create Another
              </Button>
              <Button
                onClick={() => onComplete?.(generatedProject)}
                className="bg-gradient-to-r from-indigo-600 to-purple-600"
              >
                <Eye className="w-4 h-4 mr-2" />
                View Project
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
      
      {error && (
        <div className="max-w-md mx-auto p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerate}
            className="mt-3"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      )}
    </motion.div>
  );

  return (
    <div className="min-h-[600px] p-6">
      {renderStepIndicator()}
      
      <AnimatePresence mode="wait">
        {currentStep === 0 && renderDescriptionStep()}
        {currentStep === 1 && renderAnalysisStep()}
        {currentStep === 2 && renderEntitiesStep()}
        {currentStep === 3 && renderWorkflowsStep()}
        {currentStep === 4 && renderPagesStep()}
        {currentStep === 5 && renderGeneratingStep()}
      </AnimatePresence>
    </div>
  );
}

// Helper component for adding entities
function EntityAdder({ onAdd, existingEntities }) {
  const [isOpen, setIsOpen] = useState(false);
  const [newEntity, setNewEntity] = useState('');
  
  const commonEntities = [
    'User', 'Product', 'Order', 'Category', 'Review', 'Comment',
    'Post', 'Article', 'Event', 'Booking', 'Service', 'Customer',
    'Invoice', 'Payment', 'Subscription', 'Team', 'Task', 'Message'
  ];
  
  const handleAdd = () => {
    if (newEntity.trim()) {
      onAdd(newEntity.trim());
      setNewEntity('');
      setIsOpen(false);
    }
  };
  
  return (
    <div className="relative">
      <Button size="sm" onClick={() => setIsOpen(!isOpen)}>
        <Plus className="w-4 h-4 mr-1" />
        Add Entity
      </Button>
      
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-gray-800 border rounded-lg shadow-lg z-50 p-3">
          <Input
            value={newEntity}
            onChange={(e) => setNewEntity(e.target.value)}
            placeholder="Entity name..."
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            className="mb-2"
          />
          <Button size="sm" onClick={handleAdd} className="w-full mb-2">
            Add Custom Entity
          </Button>
          <div className="border-t pt-2">
            <p className="text-xs text-gray-500 mb-1">Common entities:</p>
            <div className="flex flex-wrap gap-1">
              {commonEntities
                .filter(e => !existingEntities.includes(e))
                .slice(0, 8)
                .map(entity => (
                  <Badge
                    key={entity}
                    variant="outline"
                    className="cursor-pointer hover:bg-gray-100"
                    onClick={() => {
                      onAdd(entity);
                      setIsOpen(false);
                    }}
                  >
                    {entity}
                  </Badge>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper component for adding pages
function PageAdder({ onAdd, existingPages }) {
  const [isOpen, setIsOpen] = useState(false);
  const [newPage, setNewPage] = useState('');
  
  const commonPages = [
    'Home', 'Dashboard', 'Settings', 'Profile', 'Account',
    'Products', 'Services', 'Contact', 'About', 'Cart', 'Checkout',
    'Orders', 'Analytics', 'Reports', 'Messages', 'Notifications'
  ];
  
  const handleAdd = () => {
    if (newPage.trim()) {
      onAdd(newPage.trim());
      setNewPage('');
      setIsOpen(false);
    }
  };
  
  return (
    <div className="relative">
      <Button size="sm" onClick={() => setIsOpen(!isOpen)}>
        <Plus className="w-4 h-4 mr-1" />
        Add Page
      </Button>
      
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-gray-800 border rounded-lg shadow-lg z-50 p-3">
          <Input
            value={newPage}
            onChange={(e) => setNewPage(e.target.value)}
            placeholder="Page name..."
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            className="mb-2"
          />
          <Button size="sm" onClick={handleAdd} className="w-full mb-2">
            Add Custom Page
          </Button>
          <div className="border-t pt-2">
            <p className="text-xs text-gray-500 mb-1">Common pages:</p>
            <div className="flex flex-wrap gap-1">
              {commonPages
                .filter(p => !existingPages.includes(p))
                .slice(0, 8)
                .map(page => (
                  <Badge
                    key={page}
                    variant="outline"
                    className="cursor-pointer hover:bg-gray-100"
                    onClick={() => {
                      onAdd(page);
                      setIsOpen(false);
                    }}
                  >
                    {page}
                  </Badge>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
