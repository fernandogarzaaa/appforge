import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, AlertCircle, CheckCircle2, AlertTriangle, Info,
  Zap, Database, Shield, TrendingUp, FileCode, Play
} from 'lucide-react';
import { toast } from 'sonner';

export default function ProjectDiagnostics() {
  const [diagnosticData, setDiagnosticData] = useState(null);

  const runDiagnosticsMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('runProjectDiagnostics', {});
      return response.data;
    },
    onSuccess: (data) => {
      setDiagnosticData(data.diagnostics);
      toast.success('Diagnostics completed');
    },
    onError: () => {
      toast.error('Failed to run diagnostics');
    }
  });

  const autoFixMutation = useMutation({
    mutationFn: async (fixType) => {
      const response = await base44.functions.invoke('autoFixProject', { fix_type: fixType });
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(`Applied ${data.fixes_applied.length} fixes`);
      runDiagnosticsMutation.mutate();
    }
  });

  const getHealthColor = (health) => {
    switch (health) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-blue-600';
      case 'fair': return 'text-yellow-600';
      case 'poor': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'error': return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'info': return <Info className="w-5 h-5 text-blue-500" />;
      default: return <CheckCircle2 className="w-5 h-5 text-green-500" />;
    }
  };

  const categoryIcons = {
    'API Architecture': Shield,
    'Data Management': Database,
    'Performance': Zap,
    'Security': Shield,
    'Best Practices': FileCode
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Project Diagnostics</h1>
          <p className="text-gray-500">Analyze your project health and get improvement suggestions</p>
        </div>
        <Button 
          onClick={() => runDiagnosticsMutation.mutate()}
          disabled={runDiagnosticsMutation.isPending}
        >
          <Play className={`w-4 h-4 mr-2 ${runDiagnosticsMutation.isPending ? 'animate-spin' : ''}`} />
          Run Diagnostics
        </Button>
      </div>

      {!diagnosticData && !runDiagnosticsMutation.isPending && (
        <Card className="text-center py-12">
          <Activity className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-semibold mb-2">No Diagnostic Data</h3>
          <p className="text-gray-500 mb-4">Run diagnostics to analyze your project</p>
          <Button onClick={() => runDiagnosticsMutation.mutate()}>
            <Play className="w-4 h-4 mr-2" />
            Start Analysis
          </Button>
        </Card>
      )}

      {runDiagnosticsMutation.isPending && (
        <Card className="text-center py-12">
          <Activity className="w-16 h-16 mx-auto mb-4 text-blue-500 animate-spin" />
          <h3 className="text-lg font-semibold mb-2">Running Diagnostics...</h3>
          <p className="text-gray-500">Analyzing your project</p>
        </Card>
      )}

      {diagnosticData && (
        <>
          {/* Overall Health */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm text-gray-500 mb-1">Overall Health</h2>
                  <div className={`text-3xl font-bold capitalize ${getHealthColor(diagnosticData.overall_health)}`}>
                    {diagnosticData.overall_health}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-red-600">{diagnosticData.errors.length}</div>
                    <div className="text-xs text-gray-500">Errors</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-yellow-600">{diagnosticData.warnings.length}</div>
                    <div className="text-xs text-gray-500">Warnings</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{diagnosticData.suggestions.length}</div>
                    <div className="text-xs text-gray-500">Suggestions</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {Object.entries(diagnosticData.stats).map(([key, value]) => (
              <Card key={key}>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{value}</div>
                  <div className="text-xs text-gray-500 capitalize">{key.replace(/_/g, ' ')}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Tabs defaultValue="issues">
            <TabsList>
              <TabsTrigger value="issues">
                Issues ({diagnosticData.errors.length + diagnosticData.warnings.length})
              </TabsTrigger>
              <TabsTrigger value="suggestions">
                Suggestions ({diagnosticData.suggestions.length})
              </TabsTrigger>
              <TabsTrigger value="fixes">Quick Fixes</TabsTrigger>
            </TabsList>

            <TabsContent value="issues" className="space-y-3">
              {diagnosticData.errors.length === 0 && diagnosticData.warnings.length === 0 ? (
                <Card className="text-center py-12">
                  <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-green-500" />
                  <h3 className="text-lg font-semibold mb-2">No Issues Found</h3>
                  <p className="text-gray-500">Your project is in good shape!</p>
                </Card>
              ) : (
                <>
                  {diagnosticData.errors.map((error, idx) => (
                    <Card key={idx} className="border-l-4 border-l-red-500">
                      <CardHeader>
                        <div className="flex items-start gap-3">
                          {getSeverityIcon('error')}
                          <div className="flex-1">
                            <CardTitle className="text-base">{error.message}</CardTitle>
                            {error.suggestion && (
                              <CardDescription className="mt-1">{error.suggestion}</CardDescription>
                            )}
                            {error.entity && (
                              <Badge variant="outline" className="mt-2">{error.entity}</Badge>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  ))}

                  {diagnosticData.warnings.map((warning, idx) => (
                    <Card key={idx} className="border-l-4 border-l-yellow-500">
                      <CardHeader>
                        <div className="flex items-start gap-3">
                          {getSeverityIcon('warning')}
                          <div className="flex-1">
                            <CardTitle className="text-base">{warning.message}</CardTitle>
                            {warning.suggestion && (
                              <CardDescription className="mt-1">{warning.suggestion}</CardDescription>
                            )}
                            {warning.entity && (
                              <Badge variant="outline" className="mt-2">{warning.entity}</Badge>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  ))}
                </>
              )}
            </TabsContent>

            <TabsContent value="suggestions" className="space-y-4">
              {diagnosticData.suggestions.map((category, idx) => {
                const Icon = categoryIcons[category.category] || FileCode;
                return (
                  <Card key={idx}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className="w-5 h-5 text-blue-600" />
                          <CardTitle>{category.category}</CardTitle>
                        </div>
                        <Badge variant={category.priority === 'high' ? 'default' : 'secondary'}>
                          {category.priority} priority
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {category.items.map((item, itemIdx) => (
                          <div key={itemIdx} className="border-l-2 border-blue-200 pl-4">
                            <h4 className="font-semibold text-sm mb-1">{item.title}</h4>
                            <p className="text-sm text-gray-600 mb-1">{item.description}</p>
                            <p className="text-xs text-gray-500">💡 {item.implementation}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </TabsContent>

            <TabsContent value="fixes" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Automated Fixes</CardTitle>
                  <CardDescription>
                    Apply automatic fixes to common issues (Admin only)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => autoFixMutation.mutate('integrations')}
                    disabled={autoFixMutation.isPending}
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    Fix Broken Integrations
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => autoFixMutation.mutate('schemas')}
                    disabled={autoFixMutation.isPending}
                  >
                    <Database className="w-4 h-4 mr-2" />
                    Validate Entity Schemas
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => autoFixMutation.mutate()}
                    disabled={autoFixMutation.isPending}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Run All Fixes
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}