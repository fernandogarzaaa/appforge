import React, { useState } from 'react';
import { 
  BookOpen, CheckCircle, Circle, ChevronRight, Rocket,
  FolderPlus, Database, FileCode, Sparkles, Upload, Globe
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';

const steps = [
  {
    id: 1,
    title: 'Create Your First Project',
    description: 'Start by creating a new project to organize your work',
    icon: FolderPlus,
    color: 'blue',
    instructions: [
      'Click on "Projects" in the sidebar',
      'Click the "Create Project" button',
      'Choose a template or start from scratch',
      'Give your project a name and description',
      'Select an icon and color theme',
      'Click "Create Project" to finish'
    ],
    page: 'Projects'
  },
  {
    id: 2,
    title: 'Use AI to Build Your App',
    description: 'Simply describe what you want - AI will create everything for you',
    icon: Sparkles,
    color: 'purple',
    instructions: [
      'Open your project from the dashboard',
      'Click on "AI Assistant" in the sidebar',
      'Type what you want in plain English (e.g., "Create a blog with posts and comments")',
      'AI will automatically create the data structure (entities) for you',
      'AI will also build the pages and features you need',
      'Review what AI created and ask for changes if needed',
      'That\'s it! No coding required'
    ],
    page: 'AIAssistant'
  },
  {
    id: 3,
    title: 'Customize with Templates',
    description: 'Use ready-made templates and customize them to your needs',
    icon: FileCode,
    color: 'green',
    instructions: [
      'Go to "Templates" in the main menu',
      'Browse professional templates (e-commerce, blog, portfolio, etc.)',
      'Click "Install" on any template you like',
      'The template is automatically added to your project',
      'Use AI Assistant to customize: "Change the colors to blue" or "Add a contact form"',
      'Preview your changes instantly in the right panel',
      'No coding knowledge needed!'
    ],
    page: 'TemplateMarketplace'
  },
  {
    id: 4,
    title: 'Generate Content with AI',
    description: 'Create professional content for your app automatically',
    icon: FileText,
    color: 'pink',
    instructions: [
      'Go to "Content Studio" to generate blog posts, articles, or product descriptions',
      'Visit "Media Studio" to create images and graphics with AI',
      'Use "Email Campaigns" to write marketing emails automatically',
      'Go to "Social Media Hub" to create posts for all platforms at once',
      'Just describe what you need and AI creates it instantly',
      'Edit and refine the content with simple requests'
    ],
    page: 'ContentStudio'
  },
  {
    id: 5,
    title: 'Export & Deploy',
    description: 'Export your project or deploy it to production',
    icon: Upload,
    color: 'orange',
    instructions: [
      'Navigate to "VS Code" integration',
      'Export your full project as a ZIP file',
      'Or sync directly with GitHub',
      'Open in VS Code for advanced editing',
      'Deploy to your hosting platform',
      'Share your app with the world!'
    ],
    page: 'VSCodeIntegration'
  },
  {
    id: 6,
    title: 'Go Live!',
    description: 'Publish your project and share it with users',
    icon: Rocket,
    color: 'red',
    instructions: [
      'Go to "Settings" in your project',
      'Configure your app settings',
      'Set up custom domain (optional)',
      'Enable public access',
      'Test your published app',
      'Monitor analytics and usage'
    ],
    page: 'ProjectSettings'
  }
];

const quickTips = [
  { title: 'Use Templates', desc: 'Save time by starting with pre-built templates for common use cases' },
  { title: 'AI Code Generator', desc: 'Describe what you need and let AI write the code for you' },
  { title: 'Real-time Preview', desc: 'See your changes instantly in the live preview window' },
  { title: 'Component Library', desc: 'Reuse components across multiple pages for consistency' },
  { title: 'API Explorer', desc: 'Discover and integrate free APIs to enhance your app' },
  { title: 'Social Media Automation', desc: 'Schedule posts and automate marketing across platforms' }
];

export default function Guide() {
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState([]);

  const toggleStep = (stepId) => {
    if (completedSteps.includes(stepId)) {
      setCompletedSteps(completedSteps.filter(id => id !== stepId));
    } else {
      setCompletedSteps([...completedSteps, stepId]);
    }
  };

  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    purple: 'bg-purple-100 text-purple-600',
    green: 'bg-green-100 text-green-600',
    pink: 'bg-pink-100 text-pink-600',
    orange: 'bg-orange-100 text-orange-600',
    red: 'bg-red-100 text-red-600'
  };

  const progressPercentage = (completedSteps.length / steps.length) * 100;

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <BookOpen className="w-8 h-8 text-indigo-600" />
          <h1 className="text-3xl font-bold text-gray-900">Getting Started Guide</h1>
        </div>
        <p className="text-gray-500">Follow these steps to successfully build and publish your project</p>
      </div>

      {/* Progress Bar */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-700">Your Progress</span>
            <Badge variant="outline">{completedSteps.length} of {steps.length} completed</Badge>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-indigo-500 to-purple-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Steps */}
      <div className="space-y-4 mb-8">
        {steps.map((step, index) => {
          const StepIcon = step.icon;
          const isCompleted = completedSteps.includes(step.id);
          const isActive = currentStep === step.id;

          return (
            <Card 
              key={step.id} 
              className={`transition-all ${isActive ? 'ring-2 ring-indigo-500 shadow-lg' : ''} ${isCompleted ? 'bg-gray-50' : ''}`}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className={`w-12 h-12 rounded-xl ${colorClasses[step.color]} flex items-center justify-center flex-shrink-0`}>
                      <StepIcon className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <CardTitle className="text-lg">
                          Step {step.id}: {step.title}
                        </CardTitle>
                        {isCompleted && (
                          <Badge className="bg-green-100 text-green-700">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Done
                          </Badge>
                        )}
                      </div>
                      <CardDescription>{step.description}</CardDescription>
                    </div>
                  </div>
                  <Button
                    variant={isActive ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setCurrentStep(step.id)}
                  >
                    {isActive ? 'Viewing' : 'View'}
                  </Button>
                </div>
              </CardHeader>
              
              {isActive && (
                <CardContent className="space-y-4">
                  <div className="bg-indigo-50 rounded-lg p-4">
                    <h4 className="font-semibold text-sm mb-3 text-indigo-900">Step-by-Step Instructions:</h4>
                    <ol className="space-y-2">
                      {step.instructions.map((instruction, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm text-gray-700">
                          <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {i + 1}
                          </span>
                          <span className="pt-0.5">{instruction}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                  
                  <div className="flex gap-2">
                    <Link to={createPageUrl(step.page)} className="flex-1">
                      <Button className="w-full">
                        <ChevronRight className="w-4 h-4 mr-2" />
                        Go to {step.title.split(' ').slice(-2).join(' ')}
                      </Button>
                    </Link>
                    <Button
                      variant={isCompleted ? 'outline' : 'default'}
                      onClick={() => toggleStep(step.id)}
                      className={isCompleted ? 'bg-green-50 text-green-700 hover:bg-green-100' : ''}
                    >
                      {isCompleted ? (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Completed
                        </>
                      ) : (
                        <>
                          <Circle className="w-4 h-4 mr-2" />
                          Mark as Done
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* Quick Tips */}
      <Card>
        <CardHeader>
          <CardTitle>💡 Quick Tips & Best Practices</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {quickTips.map((tip, i) => (
              <div key={i} className="p-3 bg-gray-50 rounded-lg border">
                <h4 className="font-semibold text-sm mb-1">{tip.title}</h4>
                <p className="text-xs text-gray-600">{tip.desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Completion Message */}
      {completedSteps.length === steps.length && (
        <Card className="mt-8 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">🎉 Congratulations!</h3>
            <p className="text-gray-600 mb-4">
              You've completed all the steps! You're now ready to build amazing applications.
            </p>
            <Link to={createPageUrl('Projects')}>
              <Button size="lg" className="bg-green-600 hover:bg-green-700">
                <Rocket className="w-4 h-4 mr-2" />
                Start Building
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}