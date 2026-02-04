import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Activity, GitBranch, CheckCircle2 } from 'lucide-react';
import { useQuantumMultiverse } from '@/hooks/useQuantumMultiverse';

const initialUniverses = [
  {
    id: 'alpha',
    name: 'Universe Alpha',
    architecture: 'Redux + REST',
    score: 0.78,
    latency: 45,
  },
  {
    id: 'beta',
    name: 'Universe Beta',
    architecture: 'Zustand + GraphQL',
    score: 0.92,
    latency: 20,
  },
  {
    id: 'gamma',
    name: 'Universe Gamma',
    architecture: 'Context + tRPC',
    score: 0.85,
    latency: 28,
  },
];

const MultiverseViewer = () => {
  const { isReady, error, simulateTimeline } = useQuantumMultiverse();
  const [universes, setUniverses] = useState(initialUniverses);
  const [activeUniverse, setActiveUniverse] = useState('beta');
  const [isSimulating, setIsSimulating] = useState(false);

  const handleSimulate = () => {
    if (!isReady) return;
    setIsSimulating(true);

    const { universes: updated, bestUniverseId } = simulateTimeline(universes, 400);
    setUniverses(updated);
    if (bestUniverseId) {
      setActiveUniverse(bestUniverseId);
    }

    setTimeout(() => setIsSimulating(false), 300);
  };

  return (
    <Card className="border-indigo-200 bg-white/80 backdrop-blur">
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <GitBranch className="w-5 h-5 text-indigo-600" />
              Many-Worlds Engine
            </CardTitle>
            <CardDescription>
              Simulate architectural timelines and collapse into the strongest future.
            </CardDescription>
          </div>
          <Button onClick={handleSimulate} disabled={!isReady || isSimulating}>
            <Activity className="w-4 h-4 mr-2" />
            {isSimulating ? 'Collapsing...' : 'Simulate Future'}
          </Button>
        </div>
        {error && (
          <Badge variant="destructive">{error}</Badge>
        )}
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-3">
        {universes.map((universe) => {
          const isActive = universe.id === activeUniverse;
          return (
            <div
              key={universe.id}
              className={`rounded-lg border p-4 transition ${
                isActive ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-sm font-semibold text-slate-900">{universe.name}</div>
                  <div className="text-xs text-slate-500">{universe.architecture}</div>
                </div>
                {isActive && (
                  <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                )}
              </div>

              <div className="space-y-2">
                <div className="text-xs text-slate-500 flex justify-between">
                  <span>Viability</span>
                  <span>{Math.round(universe.score * 100)}%</span>
                </div>
                <Progress value={universe.score * 100} />
                <div className="text-xs text-slate-500 flex justify-between">
                  <span>Predicted Latency</span>
                  <span>{universe.latency}ms</span>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default MultiverseViewer;
