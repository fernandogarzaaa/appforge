import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';

export default function SubscriptionCard({ plan, isCurrentPlan, onSelect }) {
  const isPopular = plan.tier === 'premium';

  return (
    <Card className={`relative transition-all ${isPopular ? 'ring-2 ring-purple-500 shadow-lg' : ''}`}>
      {isPopular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <Badge className="bg-gradient-to-r from-purple-600 to-pink-600">Most Popular</Badge>
        </div>
      )}

      <CardHeader className={isPopular ? 'pt-8' : ''}>
        <div className="flex items-center justify-between mb-2">
          <CardTitle className="text-lg">{plan.name}</CardTitle>
          {isCurrentPlan && (
            <Badge className="bg-green-600">Current Plan</Badge>
          )}
        </div>
        <p className="text-sm text-gray-600">{plan.description}</p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Pricing */}
        <div className="space-y-1">
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold">{plan.price_per_month_sol}</span>
            <span className="text-gray-600">SOL/month</span>
          </div>
          {plan.price_per_month_usd && (
            <p className="text-xs text-gray-500">
              or ${plan.price_per_month_usd} USD via card
            </p>
          )}
        </div>

        {/* Limits */}
        <div className="border-t pt-3 space-y-2">
          {plan.max_agents && (
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
              <span className="text-sm">{plan.max_agents} Custom Agents</span>
            </div>
          )}
          {plan.max_recommendations_per_month && (
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
              <span className="text-sm">{plan.max_recommendations_per_month}/mo Recommendations</span>
            </div>
          )}
          {plan.max_workflows_per_month && (
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
              <span className="text-sm">{plan.max_workflows_per_month}/mo Guided Workflows</span>
            </div>
          )}
          {plan.max_api_calls_per_month && (
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
              <span className="text-sm">{plan.max_api_calls_per_month.toLocaleString()} API calls/mo</span>
            </div>
          )}
          {plan.support_level && plan.support_level !== 'none' && (
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
              <span className="text-sm">{plan.support_level.charAt(0).toUpperCase() + plan.support_level.slice(1)} Support</span>
            </div>
          )}
        </div>

        {/* Button */}
        <Button
          onClick={() => onSelect(plan)}
          disabled={isCurrentPlan}
          className={`w-full ${
            isCurrentPlan
              ? 'bg-gray-300'
              : isPopular
              ? 'bg-gradient-to-r from-purple-600 to-pink-600'
              : 'bg-blue-600'
          }`}
        >
          {isCurrentPlan ? 'Current Plan' : 'Subscribe Now'}
        </Button>
      </CardContent>
    </Card>
  );
}