import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, TrendingUp, CheckCircle2, Clock } from 'lucide-react';
import ProactiveAnomalyCard from './ProactiveAnomalyCard';

export default function ProactiveMonitoringPanel() {
  const { data: forecasts } = useQuery({
    queryKey: ['anomaly-forecasts'],
    queryFn: () => base44.entities.AnomalyForecast.filter({ status: 'active' }, '-probability_percent', 50)
  });

  const { data: actions } = useQuery({
    queryKey: ['preventative-actions'],
    queryFn: () => base44.entities.PreventativeAction.filter({ status: 'recommended' })
  });

  // Sort by probability
  const activeForecast = forecasts?.filter(f => f.status === 'active') || [];
  const criticalForecast = activeForecast.filter(f => f.severity_if_occurs === 'critical');
  const highProbability = activeForecast.filter(f => f.probability_percent >= 70);

  const recommendedActions = actions?.filter(a => a.status === 'recommended') || [];
  const highPriorityActions = recommendedActions.filter(a => a.priority === 'high' || a.priority === 'critical');

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Active Predictions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{activeForecast.length}</div>
            <p className="text-xs text-slate-500 mt-1">
              {criticalForecast.length} critical
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              High Probability
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{highProbability.length}</div>
            <p className="text-xs text-slate-500 mt-1">
              ≥70% probability
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Recommended Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{recommendedActions.length}</div>
            <p className="text-xs text-slate-500 mt-1">
              {highPriorityActions.length} high priority
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="predictions" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="predictions">Predicted Anomalies</TabsTrigger>
          <TabsTrigger value="actions">Recommended Actions</TabsTrigger>
        </TabsList>

        <TabsContent value="predictions" className="space-y-4">
          {criticalForecast.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-red-600 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Critical Predictions
              </h3>
              <div className="space-y-3">
                {criticalForecast.map(forecast => (
                  <ProactiveAnomalyCard key={forecast.id} forecast={forecast} />
                ))}
              </div>
            </div>
          )}

          {highProbability.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-orange-600 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                High Probability Predictions
              </h3>
              <div className="space-y-3">
                {highProbability
                  .filter(f => f.severity_if_occurs !== 'critical')
                  .map(forecast => (
                    <ProactiveAnomalyCard key={forecast.id} forecast={forecast} />
                  ))}
              </div>
            </div>
          )}

          {activeForecast.length === 0 && (
            <Card className="p-8 text-center">
              <p className="text-slate-600">No active predictions. System is operating normally.</p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="actions" className="space-y-4">
          {highPriorityActions.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-red-600">High Priority Actions</h3>
              <div className="grid gap-3">
                {highPriorityActions.map(action => (
                  <Card key={action.id} className="border-l-4 border-l-red-500">
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold">{action.title}</p>
                          <p className="text-sm text-slate-600 mt-1">{action.description}</p>
                        </div>
                        <Badge className="bg-red-100 text-red-800">{action.priority}</Badge>
                      </div>
                      <div className="flex gap-4 text-sm mt-3">
                        <span className="text-slate-600">
                          Effort: <span className="font-semibold capitalize">{action.effort_level}</span>
                        </span>
                        <span className="text-slate-600">
                          Impact: <span className="font-semibold text-green-600">{action.estimated_impact}%</span>
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {recommendedActions.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-slate-700">Other Recommended Actions</h3>
              <div className="grid gap-3">
                {recommendedActions
                  .filter(a => a.priority !== 'high' && a.priority !== 'critical')
                  .map(action => (
                    <Card key={action.id}>
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-semibold">{action.title}</p>
                            <p className="text-sm text-slate-600 mt-1">{action.description}</p>
                          </div>
                          <Badge variant="outline">{action.priority}</Badge>
                        </div>
                        <div className="flex gap-4 text-sm mt-3">
                          <span className="text-slate-600">
                            Effort: <span className="font-semibold capitalize">{action.effort_level}</span>
                          </span>
                          <span className="text-slate-600">
                            Impact: <span className="font-semibold text-green-600">{action.estimated_impact}%</span>
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </div>
          )}

          {recommendedActions.length === 0 && (
            <Card className="p-8 text-center">
              <p className="text-slate-600">No recommended actions at this time.</p>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}