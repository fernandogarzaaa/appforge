import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Sparkles, Database, Shield, 
  Zap, Users, Link2, TestTube, GitBranch
} from 'lucide-react';

const suggestedFeatures = [
  {
    category: 'Advanced AI',
    icon: Sparkles,
    color: 'indigo',
    features: [
      { name: 'AI Code Refactoring', description: 'Automatically optimize and refactor existing code', priority: 'high' },
      { name: 'Visual AI Training', description: 'Train custom ML models with your data', priority: 'medium' },
      { name: 'AI Testing Suite', description: 'Generate and run automated tests', priority: 'high' },
      { name: 'Natural Language Queries', description: 'Query your database using plain English', priority: 'medium' }
    ]
  },
  {
    category: 'Collaboration',
    icon: Users,
    color: 'blue',
    features: [
      { name: 'Real-time Collaboration', description: 'Multiple developers working simultaneously', priority: 'high' },
      { name: 'Code Review System', description: 'Built-in peer review workflow', priority: 'medium' },
      { name: 'Team Chat', description: 'Integrated messaging for teams', priority: 'low' },
      { name: 'Live Cursors', description: 'See what teammates are editing', priority: 'medium' }
    ]
  },
  {
    category: 'DevOps & Deployment',
    icon: GitBranch,
    color: 'green',
    features: [
      { name: 'CI/CD Pipeline', description: 'Automated testing and deployment', priority: 'high' },
      { name: 'Docker Integration', description: 'Containerize and deploy anywhere', priority: 'high' },
      { name: 'Multi-Environment', description: 'Dev, staging, production environments', priority: 'medium' },
      { name: 'Rollback System', description: 'One-click rollback to previous versions', priority: 'high' }
    ]
  },
  {
    category: 'Advanced Data',
    icon: Database,
    color: 'purple',
    features: [
      { name: 'GraphQL Support', description: 'Auto-generate GraphQL APIs', priority: 'high' },
      { name: 'Real-time Database', description: 'Live data sync across clients', priority: 'high' },
      { name: 'Data Migrations', description: 'Version-controlled schema changes', priority: 'medium' },
      { name: 'Database Replication', description: 'Multi-region data replication', priority: 'low' }
    ]
  },
  {
    category: 'Security & Monitoring',
    icon: Shield,
    color: 'red',
    features: [
      { name: 'Security Scanning', description: 'Automated vulnerability detection', priority: 'high' },
      { name: 'Rate Limiting', description: 'API rate limiting and throttling', priority: 'medium' },
      { name: 'Audit Logs', description: 'Complete activity tracking', priority: 'medium' },
      { name: 'Performance Monitoring', description: 'Real-time performance metrics', priority: 'high' }
    ]
  },
  {
    category: 'Integrations',
    icon: Link2,
    color: 'orange',
    features: [
      { name: 'Stripe Advanced', description: 'Subscriptions, invoices, payment links', priority: 'high' },
      { name: 'Email Providers', description: 'SendGrid, Mailchimp integration', priority: 'medium' },
      { name: 'SMS/WhatsApp', description: 'Twilio integration for messaging', priority: 'medium' },
      { name: 'Cloud Storage', description: 'AWS S3, Google Cloud Storage', priority: 'high' }
    ]
  },
  {
    category: 'Testing & QA',
    icon: TestTube,
    color: 'cyan',
    features: [
      { name: 'E2E Testing', description: 'Playwright/Cypress integration', priority: 'high' },
      { name: 'Load Testing', description: 'Performance and stress testing', priority: 'medium' },
      { name: 'Visual Regression', description: 'Screenshot-based UI testing', priority: 'low' },
      { name: 'API Testing', description: 'Automated API endpoint testing', priority: 'medium' }
    ]
  },
  {
    category: 'Advanced Features',
    icon: Zap,
    color: 'yellow',
    features: [
      { name: 'WebSocket Support', description: 'Real-time bidirectional communication', priority: 'high' },
      { name: 'Background Jobs', description: 'Queue system for long-running tasks', priority: 'high' },
      { name: 'Scheduled Tasks', description: 'Cron jobs and scheduled functions', priority: 'medium' },
      { name: 'File Processing', description: 'Image/video processing pipeline', priority: 'medium' }
    ]
  }
];

export default function FeatureSuggestions() {
  const priorityColors = {
    high: 'bg-red-600',
    medium: 'bg-orange-500',
    low: 'bg-blue-500'
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Feature Roadmap & Suggestions</h1>
        <p className="text-gray-500">Upcoming features and enhancements for AppForge platform</p>
      </div>

      <div className="space-y-8">
        {suggestedFeatures.map((category, idx) => (
          <Card key={idx} className="border-2">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-10 h-10 rounded-lg bg-${category.color}-100 flex items-center justify-center`}>
                  <category.icon className={`w-5 h-5 text-${category.color}-600`} />
                </div>
                <CardTitle className="text-xl">{category.category}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {category.features.map((feature, i) => (
                  <div key={i} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">{feature.name}</h4>
                      <Badge className={priorityColors[feature.priority]}>
                        {feature.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">{feature.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-8 bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200">
        <CardContent className="pt-6">
          <div className="text-center">
            <Sparkles className="w-12 h-12 mx-auto mb-4 text-indigo-600" />
            <h3 className="text-xl font-bold mb-2">Have a Feature Request?</h3>
            <p className="text-gray-600 mb-4">
              We're always listening to our community. Share your ideas and help shape the future of AppForge.
            </p>
            <Button className="bg-indigo-600 hover:bg-indigo-700">
              Submit Feature Request
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}