import React from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Sparkles, Zap, Shield, Code, Rocket, Users, 
  CheckCircle, ArrowRight, Star, Globe
} from 'lucide-react';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';

const features = [
  {
    icon: Sparkles,
    title: 'AI-Powered Development',
    description: 'Generate code, components, and content with advanced AI assistance'
  },
  {
    icon: Code,
    title: 'Visual App Builder',
    description: 'Build full-stack applications with drag-and-drop simplicity'
  },
  {
    icon: Globe,
    title: 'Web3 Integration',
    description: 'Create tokens, NFTs, smart contracts, and DeFi protocols'
  },
  {
    icon: Zap,
    title: 'Automation Tools',
    description: 'Build bots and workflows to automate your business processes'
  },
  {
    icon: Shield,
    title: 'Enterprise Security',
    description: 'Bank-level security with automatic backups and data protection'
  },
  {
    icon: Users,
    title: 'Team Collaboration',
    description: 'Work together with your team in real-time'
  }
];

const pricingPlans = [
  {
    name: 'Free',
    price: '$0',
    description: 'Perfect for getting started',
    features: [
      '3 projects',
      'Basic AI features',
      'Community support',
      '1GB storage'
    ]
  },
  {
    name: 'Pro',
    price: '$29',
    description: 'For professional developers',
    features: [
      'Unlimited projects',
      'Advanced AI features',
      'Priority support',
      '50GB storage',
      'Custom domains',
      'GitHub integration'
    ],
    popular: true
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    description: 'For large teams',
    features: [
      'Everything in Pro',
      'Dedicated support',
      'Custom integrations',
      'SLA guarantee',
      'Advanced analytics'
    ]
  }
];

export default function Landing() {
  const handleGetStarted = async () => {
    const isAuth = await base44.auth.isAuthenticated();
    if (isAuth) {
      window.location.href = createPageUrl('Dashboard');
    } else {
      base44.auth.redirectToLogin(createPageUrl('Dashboard'));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-gray-900/[0.04] bg-[size:32px_32px]" />
        <div className="relative max-w-7xl mx-auto px-6 py-20 lg:py-32">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-900 to-gray-700 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900">AppForge</h1>
            </div>
            <h2 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Build Apps 10x Faster
              <br />
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                With AI & No-Code
              </span>
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              The all-in-one platform for building web apps, blockchain projects, and AI-powered automations without writing code.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                size="lg" 
                onClick={handleGetStarted}
                className="bg-gradient-to-r from-gray-900 to-gray-700 text-white px-8 h-12 text-lg"
              >
                Get Started Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Link to={createPageUrl('Guide')}>
                <Button size="lg" variant="outline" className="px-8 h-12 text-lg">
                  View Guide
                </Button>
              </Link>
            </div>
            <div className="flex items-center justify-center gap-6 mt-8 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                No credit card required
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Free forever plan
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Cancel anytime
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold text-gray-900 mb-4">
            Everything You Need to Build Amazing Apps
          </h3>
          <p className="text-gray-600 text-lg">
            Powerful features that help you ship faster
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-500/10 to-purple-600/10 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-indigo-600" />
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Pricing Section */}
      <div className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h3>
            <p className="text-gray-600 text-lg">
              Choose the plan that's right for you
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {pricingPlans.map((plan, index) => (
              <Card key={index} className={plan.popular ? 'border-2 border-indigo-600 shadow-xl' : ''}>
                {plan.popular && (
                  <div className="bg-indigo-600 text-white text-center py-2 text-sm font-semibold rounded-t-lg">
                    Most Popular
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    {plan.price !== 'Custom' && <span className="text-gray-600">/month</span>}
                  </div>
                  <p className="text-gray-600 mt-2">{plan.description}</p>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button 
                    onClick={handleGetStarted}
                    className={`w-full ${plan.popular ? 'bg-indigo-600 hover:bg-indigo-700' : ''}`}
                    variant={plan.popular ? 'default' : 'outline'}
                  >
                    Get Started
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-7xl mx-auto px-6 py-20">
        <Card className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
          <CardContent className="p-12 text-center">
            <Rocket className="w-16 h-16 mx-auto mb-6 opacity-90" />
            <h3 className="text-3xl font-bold mb-4">
              Ready to Build Your Next Big Idea?
            </h3>
            <p className="text-lg mb-8 opacity-90 max-w-2xl mx-auto">
              Join thousands of developers and entrepreneurs building the future with AppForge
            </p>
            <Button 
              size="lg" 
              onClick={handleGetStarted}
              className="bg-white text-indigo-600 hover:bg-gray-100 px-8 h-12 text-lg"
            >
              Start Building Now
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 py-8">
        <div className="max-w-7xl mx-auto px-6 text-center text-gray-600 text-sm">
          © 2026 AppForge. All rights reserved. Built with ❤️ for developers.
        </div>
      </div>
    </div>
  );
}