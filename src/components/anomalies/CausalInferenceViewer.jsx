import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowRight, RotateCcw, RotateCw, Activity, Radio, Zap } from 'lucide-react';
import { useCausalStore } from '../../store/useCausalStore';
import { QuantumStream } from '../../services/QuantumStream';
// ⏳ Quantum Integration
import TopologyTimeline from './TopologyTimeline';
import QuantumDashboard from './QuantumDashboard';

export default function CausalInferenceViewer() {
  const [selectedRelationship, setSelectedRelationship] = useState(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const streamRef = useRef(null);

  // 🧬 Quantum State Management
  const {
    nodes, edges, threshold,
    setNodes, setEdges, setThreshold,
    undo, redo, historyIndex, history,
    predictFuture, clearPrediction, isPredicting, predictedNodes,
    processEntanglement, entangledEdges,
    collapsedState, collapseWavefunction, autoRemediate
  } = useCausalStore();

  const { data: relationships } = useQuery({
    queryKey: ['causal-relationships'],
    queryFn: () => base44.entities.CausalRelationship.list('-causal_strength', 30)
  });

  // Handle Quantum Stream
  useEffect(() => {
    if (isStreaming) {
      streamRef.current = new QuantumStream((packet) => {
        processEntanglement(packet);
      });
      streamRef.current.start();
    } else {
      streamRef.current?.stop();
    }

    return () => streamRef.current?.stop();
  }, [isStreaming, processEntanglement]);

  // Sync Data to Quantum Store
  useEffect(() => {
    if (relationships && relationships.length > 0) {
      // Derive Nodes from Edges
      const uniqueNodes = new Set();
      const newEdges = relationships.map(r => {
        uniqueNodes.add(r.cause_metric);
        uniqueNodes.add(r.effect_metric);
        return {
          id: r.id,
          source: r.cause_metric,
          target: r.effect_metric,
          strength: r.causal_strength,
          // Metadata for UI
          ...r
        };
      });

      const newNodes = Array.from(uniqueNodes).map((id, index) => ({
        id,
        label: id,
        position: { x: (index % 5) * 100, y: Math.floor(index / 5) * 100 },
        data: {}
      }));

      // Only update if different to avoid loop (simple count check for now)
      if (newNodes.length !== nodes.length) {
        setNodes(newNodes);
        setEdges(newEdges);
      }
    }
  }, [relationships, setNodes, setEdges]); // nodes.length check avoids cyclic dependency if we used 'nodes'

  if (!relationships || relationships.length === 0) {
    return <div className="p-4 text-slate-600">No causal relationships identified</div>;
  }

  // Filter based on Quantum Threshold - Optimized with useMemo
  const strongRelationships = React.useMemo(() =>
    relationships ? relationships.filter(r => r.causal_strength >= threshold) : [],
    [relationships, threshold]
  );

  const validatedRelationships = React.useMemo(() =>
    relationships ? relationships.filter(r => r.is_validated) : [],
    [relationships]
  );

  return (
    <div className="space-y-4">
      {/* 👁️ Quantum Observability */}
      <QuantumDashboard />

      {/* 🎛️ Quantum Control Box */}
      <Card className="bg-slate-50 border-slate-200">
        <CardContent className="pt-4 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 w-1/2">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <Activity className="w-4 h-4" />
                <span>Causal Threshold: {threshold}%</span>
              </div>
              <Slider
                value={[threshold]}
                min={0}
                max={100}
                step={5}
                onValueChange={(val) => setThreshold(val[0])}
                className="w-48"
              />
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={undo} disabled={historyIndex <= 0}>
                <RotateCcw className="w-4 h-4 mr-1" /> Undo
              </Button>
              <Button variant="outline" size="sm" onClick={redo} disabled={historyIndex >= history.length - 1}>
                <RotateCw className="w-4 h-4 mr-1" /> Redo
              </Button>
              <div className="w-px h-6 bg-slate-200 mx-1" />

              <Button
                variant={isPredicting ? "secondary" : "default"}
                size="sm"
                onClick={isPredicting ? clearPrediction : predictFuture}
                className={isPredicting ? "bg-purple-100 text-purple-700 hover:bg-purple-200" : "bg-purple-600 hover:bg-purple-700"}
              >
                <Activity className="w-4 h-4 mr-1" />
                {isPredicting ? "Clear Forecast" : "Quantum Forecast"}
              </Button>

              <Button
                variant={isStreaming ? "destructive" : "outline"}
                size="sm"
                onClick={() => setIsStreaming(!isStreaming)}
                className={isStreaming ? "animate-pulse" : ""}
              >
                <Radio className="w-4 h-4 mr-1" />
                {isStreaming ? "Stop Uplink" : "Quantum Uplink"}
              </Button>
            </div>
          </div>

          {/* ⏳ Topology Timeline Visualization */}
          <TopologyTimeline />
        </CardContent>
      </Card>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-slate-600">Total Nodes / Edges</p>
            <p className="text-2xl font-bold">{nodes.length} / {edges.length}</p>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-4">
            <p className="text-xs text-green-600">Visible Relations (&ge;{threshold}%)</p>
            <p className="text-2xl font-bold text-green-700">{strongRelationships.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-slate-600">Validated</p>
            <p className="text-2xl font-bold">{validatedRelationships.length}</p>
          </CardContent>
        </Card>

        {isPredicting && (
          <Card className="border-purple-200 bg-purple-50">
            <CardContent className="pt-4">
              <p className="text-xs text-purple-600">Quantum Forecast</p>
              <p className="text-2xl font-bold text-purple-700">{predictedNodes.length} Anomalies</p>
            </CardContent>
          </Card>
        )}

        {isStreaming && (
          <Card className="border-cyan-200 bg-cyan-50 animate-in slide-in-from-top-2">
            <CardContent className="pt-4">
              <p className="text-xs text-cyan-600 flex items-center gap-1">
                <Zap className="w-3 h-3" /> Entanglement Strength
              </p>
              <p className="text-2xl font-bold text-cyan-700">{entangledEdges.length} Links</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Relationships List (Filtered by Store Threshold) */}
      <div className="space-y-2">
        {strongRelationships.length === 0 && (
          <div className="text-center py-8 text-slate-400 italic">
            No relationships meet the {threshold}% probability threshold. Try lowering it.
          </div>
        )}

        {/* Entanglement Beams (Live Stream) */}
        {entangledEdges.map(edge => (
          <Card key={edge.id} className="border-cyan-200 bg-cyan-50/30 border-dashed animate-pulse">
            <CardContent className="pt-3 pb-3 flex justify-between items-center">
              <div className="flex items-center gap-2 text-cyan-700">
                <Radio className="w-4 h-4" />
                <span className="font-mono text-xs">LIVE SIGNAL [{edge.details.metric}]</span>
                <ArrowRight className="w-4 h-4" />
                <span className="font-semibold">{edge.target}</span>
              </div>
              <Badge variant="outline" className="text-cyan-600 border-cyan-200">
                Signal Strength: {edge.details.value.toFixed(1)}dB
              </Badge>
            </CardContent>
          </Card>
        ))}

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
                  <Badge className={rel.causal_strength > 85 ? 'bg-purple-600' : 'bg-blue-600'}>
                    {rel.causal_strength}% causal
                  </Badge>
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

      {/* 🔮 Component for Predicted Anomalies (Ghost State) */}
      {isPredicting && predictedNodes.length > 0 && (
        <div className="space-y-2 mt-8 animate-in fade-in zoom-in duration-500">
          <h3 className="text-sm font-semibold text-purple-700 flex items-center gap-2">
            <Activity className="w-4 h-4" /> Quantum Predicted Anomalies (Ghost State)
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {predictedNodes.map(node => (
              <Card key={node.id} className="border-dashed border-purple-300 bg-purple-50/50 hover:bg-purple-100 transition-colors">
                <CardContent className="p-3">
                  <div className="flex justify-between items-start mb-1">
                    <p className="font-semibold text-sm text-purple-900">{node.label.replace(' ?', '')}</p>
                    <Badge variant="secondary" className="text-[10px] bg-purple-200 text-purple-800">Potential</Badge>
                  </div>
                  <p className="text-xs text-purple-600">Probability: {(node.data.probability * 100).toFixed(1)}%</p>
                  <div className="w-full bg-purple-200 h-1 mt-2 rounded-full overflow-hidden">
                    <div
                      className="bg-purple-600 h-full rounded-full"
                      style={{ width: `${node.data.probability * 100}%` }}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

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