import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Code2, Sparkles, GitBranch, Terminal } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';

export default function AdminDeveloperTools() {
  const tools = [
    {
      title: 'Code Generator',
      description: 'AI-powered boilerplate code generation for entities and pages',
      icon: Sparkles,
      href: createPageUrl('CodeGenerator'),
      gradient: 'from-purple-500 to-pink-500',
      badge: 'AI'
    },
    {
      title: 'API Management',
      description: 'Create and manage API keys, webhooks, and integrations',
      icon: Code2,
      href: createPageUrl('APIManagement'),
      gradient: 'from-blue-500 to-cyan-500',
      badge: 'REST'
    },
    {
      title: 'GitHub Integration',
      description: 'Sync code changes and manage repositories',
      icon: GitBranch,
      href: createPageUrl('AdminAgents'),
      gradient: 'from-gray-600 to-gray-800',
      badge: 'Git'
    },
    {
      title: 'System Health',
      description: 'Monitor system performance and health metrics',
      icon: Terminal,
      href: createPageUrl('AdminSystemConfig'),
      gradient: 'from-green-500 to-emerald-500',
      badge: 'Monitor'
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Developer Tools</h2>
        <p className="text-gray-600">AI-powered development utilities and integrations</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tools.map(tool => (
          <Link key={tool.title} to={tool.href}>
            <Card className="h-full hover:shadow-lg hover:border-purple-300 transition-all cursor-pointer">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${tool.gradient} flex items-center justify-center`}>
                    <tool.icon className="w-6 h-6 text-white" />
                  </div>
                  <Badge className="bg-purple-100 text-purple-900">{tool.badge}</Badge>
                </div>
                <CardTitle className="mt-4">{tool.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">{tool.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}