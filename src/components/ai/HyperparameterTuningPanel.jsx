import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Zap, TrendingUp } from 'lucide-react';

export default function HyperparameterTuningPanel({ agentId }) {
  const [tuningRuns, setTuningRuns] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [expandedRun, setExpandedRun] = useState(null);

  useEffect(() => {
    fetchTuningRuns();
  }, [agentId]);

  const fetchTuningRuns = async () => {
    try {
      const data = await base44.entities.HyperparameterTuning.filter(
        { agent_id: agentId },
        '-updated_date',
        10
      );
      setTuningRuns(data || []);
    } catch (error) {
      console.error('Failed to fetch tuning runs:', error);
    }
  };

  const startTuning = async () => {
    setIsRunning(true);
    try {
      const response = await base44.functions.invoke('tuneHyperparameters', {
        agentId,
        iterations: 10
      });
      
      if (response.data?.success) {
        fetchTuningRuns();
        alert(`Optimization complete! Improvement: ${response.data.improvement}%`);
      }
    } catch (error) {
      console.error('Tuning error:', error);
      alert('Tuning failed');
    } finally {
      setIsRunning(false);
    }
  };

  const applyParameters = async (tuningId) => {
    try {
      const runs = await base44.entities.HyperparameterTuning.filter({ id: tuningId });
      if (runs.length === 0) return;

      const run = runs[0];
      
      // Update agent with optimized parameters
      await base44.entities.CustomAgent.update(agentId, {
        parameters: run.optimized_parameters
      });

      // Mark as applied
      await base44.entities.HyperparameterTuning.update(tuningId, { applied: true });
      fetchTuningRuns();
      alert('Optimized parameters applied!');
    } catch (error) {
      console.error('Apply error:', error);
      alert('Failed to apply parameters');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Zap className="w-4 h-4" />
          Hyperparameter Tuning
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button
          onClick={startTuning}
          disabled={isRunning}
          className="w-full bg-gradient-to-r from-amber-600 to-orange-600"
        >
          {isRunning ? 'Optimizing...' : 'Start Optimization'}
        </Button>

        <div className="space-y-2">
          {tuningRuns.length === 0 ? (
            <p className="text-xs text-gray-500">No tuning runs yet</p>
          ) : (
            tuningRuns.map((run) => (
              <div
                key={run.id}
                className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                onClick={() => setExpandedRun(expandedRun === run.id ? null : run.id)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-3 h-3 text-green-600" />
                      <span className="font-semibold text-xs">Run {run.iterations} iterations</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-0.5">
                      Score: {run.best_score?.toFixed(2) || 'N/A'}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge className={run.improvement_percentage > 5 ? 'bg-green-600' : 'bg-blue-600'}>
                      +{run.improvement_percentage?.toFixed(1) || 0}%
                    </Badge>
                  </div>
                </div>

                {expandedRun === run.id && (
                  <div className="mt-3 pt-3 border-t space-y-2">
                    <div className="text-xs space-y-1">
                      <p><span className="font-semibold">Temperature:</span> {run.optimized_parameters?.temperature?.toFixed(2)}</p>
                      <p><span className="font-semibold">Creativity:</span> {run.optimized_parameters?.creativity?.toFixed(2)}</p>
                      <p><span className="font-semibold">Accuracy:</span> {run.optimized_parameters?.accuracy?.toFixed(2)}</p>
                    </div>
                    {!run.applied && (
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          applyParameters(run.id);
                        }}
                        className="w-full mt-2 bg-green-600"
                      >
                        Apply Parameters
                      </Button>
                    )}
                    {run.applied && (
                      <Badge className="w-full text-center bg-green-100 text-green-800">
                        Applied
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}