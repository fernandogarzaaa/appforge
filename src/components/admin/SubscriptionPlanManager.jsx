import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Zap } from 'lucide-react';

export default function SubscriptionPlanManager() {
  const plans = [
    {
      name: 'Starter',
      price: 9.99,
      features: ['Basic AI assistance', '10 analyses/month', 'Email support']
    },
    {
      name: 'Pro',
      price: 29.99,
      features: ['Advanced AI', 'Unlimited analyses', 'Priority support', 'Custom workflows']
    },
    {
      name: 'Enterprise',
      price: 99.99,
      features: ['Full AI suite', 'Unlimited everything', '24/7 support', 'Custom integrations']
    }
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        {plans.map((plan, idx) => (
          <Card key={idx} className={idx === 1 ? 'border-purple-500 border-2' : ''}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{plan.name}</CardTitle>
                {idx === 1 && <Badge className="bg-purple-600">Popular</Badge>}
              </div>
              <div className="text-2xl font-bold text-purple-600 mt-2">
                ${plan.price}<span className="text-sm text-gray-600">/mo</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <Zap className="w-4 h-4 text-purple-500" />
                    {feature}
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