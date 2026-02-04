import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Loader2 } from 'lucide-react';

export default function SubscriptionPlansCard({ onSelectPlan }) {
  const [plans, setPlans] = useState([]);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadPlans();
    loadUserSubscription();
  }, []);

  const loadPlans = async () => {
    try {
      const activePlans = await base44.entities.Subscription.filter({
        is_active: true
      });
      setPlans(activePlans.sort((a, b) => a.tier_level - b.tier_level));
    } catch (error) {
      console.error('Error loading plans:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserSubscription = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
      const subs = await base44.entities.UserSubscription.filter({
        user_id: userData.email,
        status: 'active'
      });
      if (subs.length > 0) {
        setCurrentSubscription(subs[0]);
      }
    } catch (error) {
      console.error('Error loading subscription:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {plans.map((plan) => {
        const isCurrent = currentSubscription?.subscription_id === plan.id;
        return (
          <Card
            key={plan.id}
            className={`flex flex-col transition-all ${
              isCurrent
                ? 'ring-2 ring-purple-600 shadow-lg'
                : 'hover:shadow-md'
            }`}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{plan.tier_name}</CardTitle>
                {isCurrent && (
                  <Badge className="bg-purple-600">Current</Badge>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-2">{plan.description}</p>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col">
              <div className="mb-4">
                <p className="text-2xl font-bold text-purple-600">
                  {plan.price_sol} <span className="text-sm text-gray-500">SOL/mo</span>
                </p>
              </div>

              {/* Features */}
              <div className="space-y-2 mb-6 flex-1">
                {plan.features?.map((feature, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2 text-sm"
                  >
                    {feature.enabled ? (
                      <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <div className="w-4 h-4 border border-gray-300 rounded flex-shrink-0 mt-0.5" />
                    )}
                    <span className={feature.enabled ? 'text-gray-700' : 'text-gray-400 line-through'}>
                      {feature.feature_name}
                      {feature.limit && ` (${feature.limit})`}
                    </span>
                  </div>
                ))}
              </div>

              <Button
                onClick={() => onSelectPlan(plan)}
                disabled={isCurrent}
                className={
                  isCurrent
                    ? 'w-full bg-gray-300'
                    : 'w-full bg-gradient-to-r from-purple-600 to-pink-600'
                }
              >
                {isCurrent ? 'Current Plan' : 'Upgrade'}
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}