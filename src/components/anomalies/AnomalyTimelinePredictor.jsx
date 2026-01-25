import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertTriangle, Clock, TrendingUp } from 'lucide-react';

export default function AnomalyTimelinePredictor() {
  const [selectedTimeline, setSelectedTimeline] = useState(null);
  
  const { data: timelines } = useQuery({
    queryKey: ['anomaly-timelines'],
    queryFn: () => base44.entities.AnomalyTimeline.list('-created_at', 20)
  });

  if (!timelines || timelines.length === 0) {
    return <div className="p-4 text-slate-600">No anomaly timelines predicted</div>;
  }

  const inProgressTimelines = timelines.filter(t => t.status === 'in_progress');
  const withInterventionWindows = timelines.filter(t => t.intervention_opportunities?.length > 0);

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-slate-600">Predicted</p>
            <p className="text-2xl font-bold">{timelines.length}</p>
          </CardContent>
        </Card>
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-4">
            <p className="text-xs text-orange-600">In Progress</p>
            <p className="text-2xl font-bold text-orange-700">{inProgressTimelines.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-slate-600">Intervention Windows</p>
            <p className="text-2xl font-bold">{withInterventionWindows.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Timelines */}
      <div className="space-y-2">
        {timelines.slice(0, 5).map(timeline => (
          <Card
            key={timeline.id}
            className={`cursor-pointer border-l-4 transition-colors hover:bg-slate-50 ${
              timeline.status === 'in_progress' ? 'border-l-orange-500' : 'border-l-slate-300'
            }`}
            onClick={() => setSelectedTimeline(timeline)}
          >
            <CardContent className="pt-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-semibold flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {timeline.stages?.length} Stages
                  </p>
                  <p className="text-xs text-slate-600 mt-1">
                    {timeline.forecast_start ? new Date(timeline.forecast_start).toLocaleString() : 'Unknown'} →
                    {timeline.forecast_end ? new Date(timeline.forecast_end).toLocaleString() : 'Unknown'}
                  </p>
                </div>
                <Badge className={
                  timeline.status === 'in_progress' ? 'bg-orange-600' :
                  timeline.status === 'completed' ? 'bg-green-600' : 'bg-blue-600'
                }>
                  {timeline.status}
                </Badge>
              </div>

              {/* Stage Progression */}
              <div className="flex gap-1 mt-2">
                {timeline.stages?.slice(0, 5).map((stage, idx) => (
                  <div
                    key={idx}
                    className={`h-2 flex-1 rounded ${
                      stage.severity_level === 'critical' ? 'bg-red-500' :
                      stage.severity_level === 'high' ? 'bg-orange-500' :
                      stage.severity_level === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                    }`}
                    title={stage.stage_name}
                  />
                ))}
              </div>

              <p className="text-xs text-slate-600 mt-2">
                Accuracy: {timeline.accuracy_confidence}%
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Timeline Details Dialog */}
      {selectedTimeline && (
        <Dialog open={!!selectedTimeline} onOpenChange={() => setSelectedTimeline(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>Anomaly Timeline Forecast</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {/* Overall Info */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-blue-50 rounded">
                  <p className="text-xs text-blue-600 mb-1">Forecast Duration</p>
                  <p className="font-semibold">
                    {selectedTimeline.stages?.length} stages
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded">
                  <p className="text-xs text-slate-600 mb-1">Prediction Confidence</p>
                  <p className="font-semibold">{selectedTimeline.accuracy_confidence}%</p>
                </div>
              </div>

              {/* Stages */}
              <div>
                <h3 className="font-semibold text-sm mb-2">Predicted Stages</h3>
                <div className="space-y-2">
                  {selectedTimeline.stages?.map((stage, idx) => (
                    <Card key={idx} className="border-l-4 border-l-slate-300">
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-semibold">{stage.stage_number}. {stage.stage_name}</p>
                            <p className="text-sm text-slate-600 mt-1">{stage.description}</p>
                          </div>
                          <Badge className={
                            stage.severity_level === 'critical' ? 'bg-red-600' :
                            stage.severity_level === 'high' ? 'bg-orange-600' : 'bg-yellow-600'
                          }>
                            {stage.severity_level}
                          </Badge>
                        </div>
                        <div className="text-xs text-slate-600 space-y-1">
                          <p>Start: {stage.predicted_start ? new Date(stage.predicted_start).toLocaleString() : 'N/A'}</p>
                          <p>End: {stage.predicted_end ? new Date(stage.predicted_end).toLocaleString() : 'N/A'}</p>
                          <p>Predicted Impact: {stage.predicted_impact}%</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Intervention Opportunities */}
              {selectedTimeline.intervention_opportunities?.length > 0 && (
                <div>
                  <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Intervention Windows
                  </h3>
                  <div className="space-y-2">
                    {selectedTimeline.intervention_opportunities.map((window, idx) => (
                      <div key={idx} className="p-3 bg-green-50 border border-green-200 rounded">
                        <p className="font-semibold text-sm text-green-900 mb-1">
                          Window {idx + 1}: {window.recommended_action}
                        </p>
                        <p className="text-xs text-green-800 mb-1">
                          {window.window_start ? new Date(window.window_start).toLocaleTimeString() : 'N/A'} - 
                          {window.window_end ? new Date(window.window_end).toLocaleTimeString() : 'N/A'}
                        </p>
                        <p className="text-xs text-green-700">
                          Impact if taken: {window.impact_if_taken}% reduction
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recovery Trajectory */}
              {selectedTimeline.recovery_trajectory?.length > 0 && (
                <div>
                  <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Recovery Trajectory
                  </h3>
                  <div className="text-xs text-slate-600 space-y-1">
                    {selectedTimeline.recovery_trajectory?.slice(0, 5).map((point, idx) => (
                      <div key={idx} className="p-2 bg-slate-50 rounded">
                        <p>+{point.time_offset_minutes}min: Value = {point.expected_metric_value?.toFixed(2)}, Recovery Probability = {point.recovery_probability}%</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}