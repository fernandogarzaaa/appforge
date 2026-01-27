import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BusinessImpactCard from '@/components/intelligence/BusinessImpactCard';
import AutomatedActionManager from '@/components/intelligence/AutomatedActionManager';
import SLAMonitoringDashboard from '@/components/intelligence/SLAMonitoringDashboard';
import ResponsePlaybookLibrary from '@/components/intelligence/ResponsePlaybookLibrary';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Brain, Zap, AlertTriangle, BookOpen, TrendingUp } from 'lucide-react';

export default function EnterpriseIntelligence() {
  const { data: impacts } = useQuery({
    queryKey: ['business-impacts'],
    queryFn: () => base44.entities.BusinessImpact.list('-created_date', 50)
  });

  const { data: benchmarks } = useQuery({
    queryKey: ['benchmark-metrics'],
    queryFn: () => base44.entities.BenchmarkMetric.list('-created_date', 20)
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b bg-white sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Brain className="w-8 h-8 text-purple-600" />
            Enterprise Intelligence
          </h1>
          <p className="text-slate-600 mt-1">Advanced analytics, automation, and insights for your system</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <Tabs defaultValue="sla" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="sla" className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              <span className="hidden sm:inline">SLA Monitoring</span>
            </TabsTrigger>
            <TabsTrigger value="automation" className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              <span className="hidden sm:inline">Automation</span>
            </TabsTrigger>
            <TabsTrigger value="impact" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              <span className="hidden sm:inline">Impact</span>
            </TabsTrigger>
            <TabsTrigger value="playbooks" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Playbooks</span>
            </TabsTrigger>
            <TabsTrigger value="benchmarks">Benchmarks</TabsTrigger>
          </TabsList>

          {/* SLA Monitoring */}
          <TabsContent value="sla" className="space-y-6 mt-6">
            <SLAMonitoringDashboard />
          </TabsContent>

          {/* Automation */}
          <TabsContent value="automation" className="space-y-6 mt-6">
            <AutomatedActionManager />
          </TabsContent>

          {/* Business Impact */}
          <TabsContent value="impact" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {impacts?.slice(0, 6).map(impact => (
                <div key={impact.id}>
                  <BusinessImpactCard impact={impact} />
                </div>
              ))}
            </div>
            {(!impacts || impacts.length === 0) && (
              <div className="p-8 text-center text-slate-600">No business impacts recorded</div>
            )}
          </TabsContent>

          {/* Response Playbooks */}
          <TabsContent value="playbooks" className="space-y-6 mt-6">
            <ResponsePlaybookLibrary />
          </TabsContent>

          {/* Benchmarks */}
          <TabsContent value="benchmarks" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {benchmarks?.map(benchmark => (
                <div key={benchmark.id} className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-3">{benchmark.metric_name}</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Your Value</span>
                      <span className="font-semibold">{benchmark.your_value}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Industry Avg</span>
                      <span className="font-semibold">{benchmark.industry_average}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Your Percentile</span>
                      <span className="font-semibold text-blue-600">{benchmark.performance_percentile}th</span>
                    </div>
                    <div className="pt-2 border-t">
                      <span className={`text-xs font-semibold ${
                        benchmark.trend === 'improving' ? 'text-green-600' :
                        benchmark.trend === 'degrading' ? 'text-red-600' : 'text-slate-600'
                      }`}>
                        Trend: {benchmark.trend.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}