import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, AlertTriangle, Zap, CheckCircle, XCircle, 
  RefreshCw, Eye, Code, Brain
} from 'lucide-react';
import { toast } from 'sonner';

export default function GlobalInsightsPanel() {
  const queryClient = useQueryClient();

  // Fetch insights
  const { data: insights = [], isLoading } = useQuery({
    queryKey: ['globalInsights'],
    queryFn: () => base44.entities.GlobalInsight.list('-created_date', 50),
  });

  // Run analysis
  const analyzeMutation = useMutation({
    mutationFn: () => base44.functions.invoke('analyzeGlobalPatterns', {}),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['globalInsights'] });
      toast.success(`Generated ${result.data.insights?.length || 0} new insights`);
    },
  });

  const insightIcons = {
    trend: TrendingUp,
    vulnerability: AlertTriangle,
    optimization: Zap,
    best_practice: CheckCircle,
    anti_pattern: XCircle
  };

  const insightColors = {
    trend: 'bg-blue-100 text-blue-700 border-blue-200',
    vulnerability: 'bg-red-100 text-red-700 border-red-200',
    optimization: 'bg-purple-100 text-purple-700 border-purple-200',
    best_practice: 'bg-green-100 text-green-700 border-green-200',
    anti_pattern: 'bg-orange-100 text-orange-700 border-orange-200'
  };

  const severityColors = {
    info: 'bg-gray-100 text-gray-700',
    low: 'bg-blue-100 text-blue-700',
    medium: 'bg-yellow-100 text-yellow-700',
    high: 'bg-orange-100 text-orange-700',
    critical: 'bg-red-100 text-red-700'
  };

  const groupedInsights = insights.reduce((acc, insight) => {
    if (!acc[insight.insight_type]) acc[insight.insight_type] = [];
    acc[insight.insight_type].push(insight);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-indigo-500 to-purple-600">
        <CardContent className="p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Brain className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">🔮 Cross-Project Quantum Insights</h2>
                <p className="text-purple-100 text-sm">
                  Platform-wide patterns, trends, and recommendations
                </p>
              </div>
            </div>
            <Button
              onClick={() => analyzeMutation.mutate()}
              disabled={analyzeMutation.isPending}
              className="bg-white/20 hover:bg-white/30 text-white border-0"
            >
              {analyzeMutation.isPending ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Run Analysis
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4">
        {Object.entries(groupedInsights).map(([type, items]) => {
          const Icon = insightIcons[type] || Eye;
          return (
            <Card key={type}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="w-4 h-4 text-gray-600" />
                  <span className="text-xs font-medium text-gray-600 capitalize">
                    {type.replace('_', ' ')}
                  </span>
                </div>
                <div className="text-2xl font-bold text-gray-900">{items.length}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Insights Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Insights</TabsTrigger>
          <TabsTrigger value="critical">Critical</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="vulnerabilities">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-3">
          {insights.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center text-gray-500">
                <Brain className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No insights yet. Run global analysis to generate insights.</p>
              </CardContent>
            </Card>
          ) : (
            insights.map((insight) => {
              const Icon = insightIcons[insight.insight_type] || Eye;
              return (
                <Card key={insight.id} className={`border-l-4 ${insightColors[insight.insight_type]}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Icon className="w-5 h-5" />
                          <CardTitle className="text-lg">{insight.title}</CardTitle>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={severityColors[insight.severity]}>
                            {insight.severity}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {insight.affected_projects_count} projects
                          </Badge>
                          {insight.quantum_validated && (
                            <Badge variant="outline" className="text-xs text-purple-700">
                              🔮 Quantum-Validated
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-xs">
                            {Math.round((insight.confidence || 0) * 100)}% confidence
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-gray-700">{insight.description}</p>
                    
                    {insight.recommendations?.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 mb-2">Recommendations:</h4>
                        <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                          {insight.recommendations.map((rec, idx) => (
                            <li key={idx}>{rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {insight.code_examples?.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                          <Code className="w-4 h-4" />
                          Example:
                        </h4>
                        {insight.code_examples.map((example, idx) => (
                          <pre key={idx} className="bg-gray-900 text-gray-100 p-3 rounded-lg text-xs overflow-x-auto">
                            {example.code}
                          </pre>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="critical">
          {insights.filter(i => ['high', 'critical'].includes(i.severity)).map((insight) => {
            const Icon = insightIcons[insight.insight_type] || Eye;
            return (
              <Card key={insight.id} className="border-l-4 border-red-500">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Icon className="w-5 h-5 text-red-600" />
                    <CardTitle className="text-lg">{insight.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-700">{insight.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="trends">
          {insights.filter(i => i.insight_type === 'trend').map((insight) => (
            <Card key={insight.id} className="border-l-4 border-blue-500">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  {insight.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700">{insight.description}</p>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="vulnerabilities">
          {insights.filter(i => i.insight_type === 'vulnerability').map((insight) => (
            <Card key={insight.id} className="border-l-4 border-red-500">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  {insight.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700">{insight.description}</p>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}