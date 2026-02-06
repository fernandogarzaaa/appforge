import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Zap } from 'lucide-react';

export default function SubscriptionPlanManager() {
  const [plans, setPlans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadPlans = async () => {
      try {
        const activePlans = await base44.entities.Subscription.filter({ is_active: true });
        const sorted = activePlans.sort((a, b) => (a.tier_level || 0) - (b.tier_level || 0));
        setPlans(sorted);
      } catch (error) {
        console.error('Failed to load subscription plans:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadPlans();
  }, []);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        {isLoading ? (
          <Card className="col-span-3">
            <CardContent className="pt-6 text-sm text-gray-600">Loading plans...</CardContent>
          </Card>
        ) : plans.map((plan, idx) => (
          <Card key={idx} className={idx === 1 ? 'border-purple-500 border-2' : ''}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{plan.tier_name || plan.name}</CardTitle>
                {idx === 1 && <Badge className="bg-purple-600">Popular</Badge>}
              </div>
              <div className="text-2xl font-bold text-purple-600 mt-2">
                {plan.price_sol || plan.price_per_month_sol} SOL<span className="text-sm text-gray-600">/mo</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {(plan.features || []).map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <Zap className="w-4 h-4 text-purple-500" />
                    {feature.feature_name || feature}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
