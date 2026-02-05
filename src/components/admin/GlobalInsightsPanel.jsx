import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, TrendingUp, AlertTriangle, Zap } from 'lucide-react';

export default function GlobalInsightsPanel() {
  const { data: insights = [] } = useQuery({
    queryKey: ['globalInsights'],
    queryFn: () => base44.asServiceRole.entities.GlobalInsight.filter({ is_active: true }),
  });

  const getSeverityIcon = (severity) => {
    const iconClass = 'w-4 h-4';
    switch (severity) {
      case 'critical':
        return <AlertTriangle className={`${iconClass} text-red-600`} />;
      case 'high':
        return <Zap className={`${iconClass} text-orange-600`} />;
      default:
        return <TrendingUp className={`${iconClass} text-blue-600`} />;
    }
  };

  const getSeverityBadgeClass = (severity) => {
    const baseClass = 'text-xs';
    switch (severity) {
      case 'critical':
        return `${baseClass} bg-red-100 text-red-700`;
      case 'high':
        return `${baseClass} bg-orange-100 text-orange-700`;
      case 'medium':
        return `${baseClass} bg-yellow-100 text-yellow-700`;
      default:
        return `${baseClass} bg-blue-100 text-blue-700`;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-yellow-600" />
          Global Insights
        </CardTitle>
        <CardDescription>Platform-wide patterns and recommendations</CardDescription>
      </CardHeader>
      <CardContent>
        {insights.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No insights available at this time</p>
          </div>
        ) : (
          <div className="space-y-3">
            {insights.slice(0, 5).map((insight) => (
              <div key={insight.id} className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    {getSeverityIcon(insight.severity)}
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm text-gray-900">{insight.title}</h4>
                      <p className="text-xs text-gray-600 mt-1">{insight.description}</p>
                      {insight.affected_projects_count > 0 && (
                        <p className="text-xs text-gray-500 mt-2">
                          Affects {insight.affected_projects_count} projects
                        </p>
                      )}
                    </div>
                  </div>
                  <Badge className={getSeverityBadgeClass(insight.severity)}>
                    {insight.severity}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}