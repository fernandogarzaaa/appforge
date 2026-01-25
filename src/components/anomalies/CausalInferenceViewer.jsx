import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowRight, Zap, TrendingDown } from 'lucide-react';

export default function CausalInferenceViewer() {
  const [selectedRelationship, setSelectedRelationship] = useState(null);
  
  const { data: relationships } = useQuery({
    queryKey: ['causal-relationships'],
    queryFn: () => base44.entities.CausalRelationship.list('-causal_strength', 30)
  });

  if (!relationships || relationships.length === 0) {
    return <div className="p-4 text-slate-600">No causal relationships identified</div>;
  }

  const strongRelationships = relationships.filter(r => r.causal_strength > 70);
  const validatedRelationships = relationships.filter(r => r.is_validated);

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-slate-600">Total Relationships</p>
            <p className="text-2xl font-bold">{relationships.length}</p>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-4">
            <p className="text-xs text-green-600">Strong (>70%)</p>
            <p className="text-2xl font-bold text-green-700">{strongRelationships.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-slate-600">Validated</p>
            <p className="text-2xl font-bold">{validatedRelationships.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Relationships */}
      <div className="space-y-2">
        {strongRelationships.map(rel => (
          <Card
            key={rel.id}
            className="cursor-pointer border-l-4 border-l-blue-500 hover:bg-slate-50 transition-colors"
            onClick={() => setSelectedRelationship(rel)}
          >
            <CardContent className="pt-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3 flex-1">
                  <div className="text-right">
                    <p className="font-semibold text-sm">{rel.cause_metric}</p>
                    <p className="text-xs text-slate-600">{rel.cause_source}</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-semibold text-sm">{rel.effect_metric}</p>
                    <p className="text-xs text-slate-600">{rel.effect_source}</p>
                  </div>
                </div>
                <div>
                  <Badge className="bg-blue-600">{rel.causal_strength}% causal</Badge>
                </div>
              </div>

              <div className="flex gap-3 text-xs text-slate-600">
                <span>Confidence: {rel.confidence_level}%</span>
                <span>Lag: {rel.lag_time_seconds}s</span>
                <span>Impact: {rel.impact_magnitude?.toFixed(2)}x</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Details Dialog */}
      {selectedRelationship && (
        <Dialog open={!!selectedRelationship} onOpenChange={() => setSelectedRelationship(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Causal Analysis: {selectedRelationship.cause_metric} → {selectedRelationship.effect_metric}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {/* Main Metrics */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded">
                  <p className="text-xs text-blue-600 font-semibold mb-1">CAUSE</p>
                  <p className="font-semibold">{selectedRelationship.cause_metric}</p>
                  <p className="text-xs text-slate-600">{selectedRelationship.cause_source}</p>
                </div>
                <div className="p-4 bg-orange-50 border border-orange-200 rounded">
                  <p className="text-xs text-orange-600 font-semibold mb-1">EFFECT</p>
                  <p className="font-semibold">{selectedRelationship.effect_metric}</p>
                  <p className="text-xs text-slate-600">{selectedRelationship.effect_source}</p>
                </div>
              </div>

              {/* Causal Metrics */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded">
                  <p className="text-xs text-slate-600">Causal Strength</p>
                  <p className="text-2xl font-bold text-blue-600">{selectedRelationship.causal_strength}%</p>
                </div>
                <div className="p-3 bg-slate-50 rounded">
                  <p className="text-xs text-slate-600">Confidence</p>
                  <p className="text-2xl font-bold text-green-600">{selectedRelationship.confidence_level}%</p>
                </div>
                <div className="p-3 bg-slate-50 rounded">
                  <p className="text-xs text-slate-600">Time Lag</p>
                  <p className="text-2xl font-bold">{selectedRelationship.lag_time_seconds}s</p>
                </div>
                <div className="p-3 bg-slate-50 rounded">
                  <p className="text-xs text-slate-600">Impact Magnitude</p>
                  <p className="text-2xl font-bold">{selectedRelationship.impact_magnitude?.toFixed(2)}x</p>
                </div>
              </div>

              {/* Method */}
              <div className="p-3 bg-slate-50 rounded">
                <p className="text-xs text-slate-600 mb-1">Inference Method</p>
                <Badge variant="outline">{selectedRelationship.inference_method}</Badge>
              </div>

              {/* Supporting Evidence */}
              {selectedRelationship.supporting_evidence?.length > 0 && (
                <div>
                  <p className="font-semibold text-sm mb-2">Supporting Evidence ({selectedRelationship.supporting_evidence.length} instances)</p>
                  <div className="space-y-1 max-h-40 overflow-auto">
                    {selectedRelationship.supporting_evidence.slice(0, 5).map((evidence, idx) => (
                      <div key={idx} className="p-2 bg-slate-50 rounded text-xs">
                        <p>Cause: {evidence.cause_value?.toFixed(2)} → Effect: {evidence.effect_value?.toFixed(2)} (Error: {evidence.prediction_error?.toFixed(2)})</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Confounding Factors */}
              {selectedRelationship.confounding_factors?.length > 0 && (
                <div>
                  <p className="font-semibold text-sm mb-2">Potential Confounding Factors</p>
                  <div className="flex gap-2 flex-wrap">
                    {selectedRelationship.confounding_factors.map((factor, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">{factor}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Validation Status */}
              <div className="p-3 bg-slate-50 rounded flex items-center justify-between">
                <span className="text-sm font-semibold">Expert Validated</span>
                <Badge className={selectedRelationship.is_validated ? 'bg-green-600' : 'bg-slate-400'}>
                  {selectedRelationship.is_validated ? 'Yes' : 'Pending'}
                </Badge>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}