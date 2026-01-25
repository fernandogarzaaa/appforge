import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { 
  Check, X, Sparkles, Zap, Crown, Building2,
  Loader2, ArrowRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    description: 'For personal projects',
    price: { monthly: 0, yearly: 0 },
    icon: Sparkles,
    color: 'from-gray-500 to-gray-600',
    features: {
      projects_limit: 2,
      api_calls_limit: 1000,
      ai_requests_limit: 50,
      storage_gb: 1,
      team_members: 1,
      custom_domain: false,
      priority_support: false,
      github_integration: false,
      advanced_analytics: false,
    },
    featureList: [
      { name: '2 Projects', included: true },
      { name: '1,000 API calls/month', included: true },
      { name: '50 AI requests/month', included: true },
      { name: '1 GB Storage', included: true },
      { name: 'Community support', included: true },
      { name: 'Custom domain', included: false },
      { name: 'GitHub integration', included: false },
      { name: 'Priority support', included: false },
    ]
  },
  {
    id: 'starter',
    name: 'Starter',
    description: 'For small teams',
    price: { monthly: 19, yearly: 190 },
    icon: Zap,
    color: 'from-blue-500 to-cyan-500',
    features: {
      projects_limit: 10,
      api_calls_limit: 10000,
      ai_requests_limit: 500,
      storage_gb: 10,
      team_members: 3,
      custom_domain: false,
      priority_support: false,
      github_integration: false,
      advanced_analytics: true,
    },
    featureList: [
      { name: '10 Projects', included: true },
      { name: '10,000 API calls/month', included: true },
      { name: '500 AI requests/month', included: true },
      { name: '10 GB Storage', included: true },
      { name: '3 Team members', included: true },
      { name: 'Advanced analytics', included: true },
      { name: 'Custom domain', included: false },
      { name: 'GitHub integration', included: false },
    ]
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'For growing businesses',
    price: { monthly: 49, yearly: 490 },
    icon: Crown,
    color: 'from-purple-500 to-indigo-500',
    popular: true,
    features: {
      projects_limit: 50,
      api_calls_limit: 100000,
      ai_requests_limit: 2000,
      storage_gb: 50,
      team_members: 10,
      custom_domain: true,
      priority_support: true,
      github_integration: true,
      advanced_analytics: true,
    },
    featureList: [
      { name: '50 Projects', included: true },
      { name: '100,000 API calls/month', included: true },
      { name: '2,000 AI requests/month', included: true },
      { name: '50 GB Storage', included: true },
      { name: '10 Team members', included: true },
      { name: 'Custom domain', included: true },
      { name: 'GitHub integration', included: true },
      { name: 'Priority support', included: true },
    ]
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For large organizations',
    price: { monthly: 199, yearly: 1990 },
    icon: Building2,
    color: 'from-amber-500 to-orange-500',
    features: {
      projects_limit: -1,
      api_calls_limit: -1,
      ai_requests_limit: -1,
      storage_gb: 500,
      team_members: -1,
      custom_domain: true,
      priority_support: true,
      github_integration: true,
      advanced_analytics: true,
    },
    featureList: [
      { name: 'Unlimited Projects', included: true },
      { name: 'Unlimited API calls', included: true },
      { name: 'Unlimited AI requests', included: true },
      { name: '500 GB Storage', included: true },
      { name: 'Unlimited Team members', included: true },
      { name: 'Custom domain', included: true },
      { name: 'Dedicated support', included: true },
      { name: 'SLA guarantee', included: true },
    ]
  }
];

export default function Pricing() {
  const [isYearly, setIsYearly] = useState(false);
  const [isProcessing, setIsProcessing] = useState(null);
  const queryClient = useQueryClient();

  const { data: currentSubscription } = useQuery({
    queryKey: ['subscription'],
    queryFn: async () => {
      const subs = await base44.entities.Subscription.list();
      return subs[0] || { plan: 'free', status: 'active' };
    },
  });

  const subscribeMutation = useMutation({
    mutationFn: async (planId) => {
      // Simulate payment processing
      await new Promise(r => setTimeout(r, 2000));
      
      const plan = PLANS.find(p => p.id === planId);
      return base44.entities.Subscription.create({
        plan: planId,
        status: 'active',
        features: plan.features,
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      toast.success('Subscription activated!');
      setIsProcessing(null);
    },
  });

  const handleSubscribe = async (planId) => {
    if (planId === 'free') {
      toast.info('You are already on the free plan');
      return;
    }
    setIsProcessing(planId);
    subscribeMutation.mutate(planId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Simple, transparent pricing
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Choose the plan that's right for you
          </p>
          
          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4">
            <span className={cn("text-sm", !isYearly && "font-medium")}>Monthly</span>
            <Switch
              checked={isYearly}
              onCheckedChange={setIsYearly}
            />
            <span className={cn("text-sm", isYearly && "font-medium")}>
              Yearly
              <Badge className="ml-2 bg-green-100 text-green-700">Save 20%</Badge>
            </span>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-4 gap-6">
          {PLANS.map((plan, index) => {
            const Icon = plan.icon;
            const isCurrentPlan = currentSubscription?.plan === plan.id;
            
            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={cn(
                  "rounded-2xl h-full flex flex-col relative",
                  plan.popular && "border-2 border-purple-500 shadow-lg shadow-purple-500/20"
                )}>
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-purple-500 text-white px-3">Most Popular</Badge>
                    </div>
                  )}
                  
                  <CardHeader className="pb-4">
                    <div className={cn(
                      "w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center mb-3",
                      plan.color
                    )}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle>{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                    <div className="mt-4">
                      <span className="text-4xl font-bold">
                        ${isYearly ? plan.price.yearly : plan.price.monthly}
                      </span>
                      <span className="text-gray-500">
                        /{isYearly ? 'year' : 'month'}
                      </span>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="flex-1 flex flex-col">
                    <ul className="space-y-3 flex-1">
                      {plan.featureList.map((feature, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm">
                          {feature.included ? (
                            <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                          ) : (
                            <X className="w-4 h-4 text-gray-300 flex-shrink-0" />
                          )}
                          <span className={cn(!feature.included && "text-gray-400")}>
                            {feature.name}
                          </span>
                        </li>
                      ))}
                    </ul>
                    
                    <Button
                      onClick={() => handleSubscribe(plan.id)}
                      disabled={isCurrentPlan || isProcessing === plan.id}
                      className={cn(
                        "w-full h-11 rounded-xl mt-6",
                        plan.popular 
                          ? "bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white"
                          : isCurrentPlan
                          ? "bg-gray-100 text-gray-500"
                          : "bg-gray-900 hover:bg-gray-800 text-white"
                      )}
                    >
                      {isProcessing === plan.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : isCurrentPlan ? (
                        'Current Plan'
                      ) : (
                        <>
                          Get Started
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* FAQ or Additional Info */}
        <div className="mt-16 text-center">
          <p className="text-gray-500">
            All plans include SSL, automatic backups, and 99.9% uptime guarantee.
          </p>
          <p className="text-gray-500 mt-2">
            Need a custom plan? <a href="#" className="text-indigo-600 hover:underline">Contact us</a>
          </p>
        </div>
      </div>
    </div>
  );
}