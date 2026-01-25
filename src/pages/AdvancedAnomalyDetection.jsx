import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MultiDimensionalDetector from '@/components/anomalies/MultiDimensionalDetector';
import CausalInferenceViewer from '@/components/anomalies/CausalInferenceViewer';
import AnomalyTimelinePredictor from '@/components/anomalies/AnomalyTimelinePredictor';
import ImpactScoringDashboard from '@/components/anomalies/ImpactScoringDashboard';
import { Network, Zap, Clock, TrendingUp } from 'lucide-react';

export default function AdvancedAnomalyDetection() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b bg-white sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <h1 className="text-3xl font-bold">Advanced Anomaly Detection</h1>
          <p className="text-slate-600 mt-1">Multi-dimensional patterns, causal inference, timeline prediction, and impact scoring</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <Tabs defaultValue="multidim" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="multidim" className="flex items-center gap-2">
              <Network className="w-4 h-4" />
              <span className="hidden sm:inline">Multi-Dimensional</span>
            </TabsTrigger>
            <TabsTrigger value="causal" className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              <span className="hidden sm:inline">Causal Inference</span>
            </TabsTrigger>
            <TabsTrigger value="timeline" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span className="hidden sm:inline">Timeline</span>
            </TabsTrigger>
            <TabsTrigger value="impact" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              <span className="hidden sm:inline">Impact Score</span>
            </TabsTrigger>
          </TabsList>

          {/* Multi-Dimensional Tab */}
          <TabsContent value="multidim" className="mt-6">
            <div className="bg-white rounded-lg p-6">
              <MultiDimensionalDetector />
            </div>
          </TabsContent>

          {/* Causal Inference Tab */}
          <TabsContent value="causal" className="mt-6">
            <div className="bg-white rounded-lg p-6">
              <CausalInferenceViewer />
            </div>
          </TabsContent>

          {/* Timeline Prediction Tab */}
          <TabsContent value="timeline" className="mt-6">
            <div className="bg-white rounded-lg p-6">
              <AnomalyTimelinePredictor />
            </div>
          </TabsContent>

          {/* Impact Scoring Tab */}
          <TabsContent value="impact" className="mt-6">
            <div className="bg-white rounded-lg p-6">
              <ImpactScoringDashboard />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}