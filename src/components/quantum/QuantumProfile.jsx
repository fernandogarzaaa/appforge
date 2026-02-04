import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles } from 'lucide-react';
import {
  createQuantumVar,
  observeQuantumVar,
  peekMostLikely,
  getUncertaintyIndex,
} from '@/lib/QScript';

const QuantumProfile = () => {
  const [userQVar, setUserQVar] = useState(null);
  const [collapsedUser, setCollapsedUser] = useState(null);
  const [mostLikely, setMostLikely] = useState(null);
  const [uncertainty, setUncertainty] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      const cachedData = { name: 'Fernando (Cache)', balance: 500 };
      const apiData = { name: 'Fernando (Live)', balance: 520 };

      const qVar = await createQuantumVar([
        [apiData, 0.8],
        [cachedData, 0.2],
      ]);

      setUserQVar(qVar);
      setMostLikely(peekMostLikely(qVar));
      setUncertainty(getUncertaintyIndex(qVar));
    };

    loadData();
  }, []);

  const handleMeasure = () => {
    if (!userQVar) return;
    const result = observeQuantumVar(userQVar);
    setCollapsedUser(result);
    setUncertainty(getUncertaintyIndex(userQVar));
  };

  return (
    <Card className="border-purple-200 bg-white/80 backdrop-blur">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-600" />
          Q-Script Quantum Variable
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-purple-700">
            Probabilistic Superset
          </Badge>
          <Badge variant="secondary">Crash-Proof Mode</Badge>
        </div>

        {!collapsedUser ? (
          <div className="space-y-3">
            <p className="text-sm text-slate-600">
              State is in superposition. Observe to collapse into a stable reality.
            </p>
            <div className="text-xs text-slate-500">
              Most Likely: {mostLikely ? JSON.stringify(mostLikely) : 'n/a'}
            </div>
            <div className="text-xs text-slate-500">
              Uncertainty Index: {uncertainty.toFixed(3)}
            </div>
            <Button onClick={handleMeasure} className="bg-indigo-600 hover:bg-indigo-500">
              Observe State (Collapse)
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-green-600 text-sm">Wavefunction collapsed:</p>
            <pre className="bg-slate-900 text-slate-100 p-3 rounded-md text-xs">
              {JSON.stringify(collapsedUser, null, 2)}
            </pre>
            <div className="text-xs text-slate-500">
              Uncertainty Index: {uncertainty.toFixed(3)}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default QuantumProfile;
