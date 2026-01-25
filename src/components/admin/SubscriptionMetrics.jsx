import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Users, TrendingUp, DollarSign, AlertCircle, Loader2 } from 'lucide-react';

export default function SubscriptionMetrics() {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['subscriptionMetrics'],
    queryFn: () => base44.functions.invoke('getSubscriptionMetrics', {})
  });

  const data = metrics?.data || {
    total_subscribers: 0,
    active_subscriptions: 0,
    mrr: 0,
    churn_rate: 0
  };

  const metricCards = [
    {
      icon: Users,
      label: 'Total Subscribers',
      value: data.total_subscribers,
      color: 'blue'
    },
    {
      icon: TrendingUp,
      label: 'Active Subscriptions',
      value: data.active_subscriptions,
      color: 'green'
    },
    {
      icon: DollarSign,
      label: 'Monthly Recurring Revenue',
      value: `$${data.mrr.toFixed(2)}`,
      color: 'purple'
    },
    {
      icon: AlertCircle,
      label: 'Churn Rate (30d)',
      value: `${data.churn_rate.toFixed(1)}%`,
      color: 'orange'
    }
  ];

  if (isLoading) {
    return (
      <div className="grid md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="flex items-center justify-center py-6">
              <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-4 gap-4">
      {metricCards.map((metric, idx) => {
        const Icon = metric.icon;
        const colorClasses = {
          blue: 'bg-blue-50 text-blue-600 border-blue-200',
          green: 'bg-green-50 text-green-600 border-green-200',
          purple: 'bg-purple-50 text-purple-600 border-purple-200',
          orange: 'bg-orange-50 text-orange-600 border-orange-200'
        };

        return (
          <Card key={idx} className={`border ${colorClasses[metric.color]}`}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold opacity-75">{metric.label}</p>
                  <p className="text-2xl font-bold mt-2">{metric.value}</p>
                </div>
                <Icon className="w-8 h-8 opacity-50" />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}