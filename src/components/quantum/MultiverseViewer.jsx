import React, { useState, useEffect } from 'react';
import { useQuantumMultiverse } from './useQuantumMultiverse';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Zap, GitBranch, Maximize2, AlertCircle, 
  GitMerge, Waves, Eye, Play, Pause
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function MultiverseViewer({ initialQubits = 3 }) {
  const {
    universes,
    activeUniverseId,
    setActiveUniverseId,
    timelineHistory,
    entanglementMap,
    branchUniverse,
    collapseWavefunction,
    calculateInterference,
    entangleUniverses,
    applyHadamard,
    applyPauliX,
    getActiveUniverse,
  } = useQuantumMultiverse(initialQubits);

  const [isAnimating, setIsAnimating] = useState(false);
  const [selectedPair, setSelectedPair] = useState(null);
  const [interference, setInterference] = useState({});

  useEffect(() => {
    const newInterference = calculateInterference();
    setInterference(newInterference);
  }, [universes, calculateInterference]);

  const activeUniverse = getActiveUniverse();

  const handleBranch = () => {
    setIsAnimating(true);
    branchUniverse();
    setTimeout(() => setIsAnimating(false), 600);
  };

  const handleEntangle = (id1, id2) => {
    entangleUniverses(id1, id2);
    setSelectedPair([id1, id2]);
  };

  return (
    <div className="space-y-6">
      {/* Multiverse Timeline Visualization */}
      <Card className="border-2 border-purple-500/30 dark:border-purple-500/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
            <Maximize2 className="w-5 h-5" />
            Multiverse Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Universes Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {universes.map((universe, idx) => (
                <motion.button
                  key={universe.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.1 }}
                  onClick={() => setActiveUniverseId(universe.id)}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    activeUniverseId === universe.id
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/30'
                      : 'border-gray-200 dark:border-gray-700 hover:border-purple-300'
                  }`}
                >
                  <div className="text-left space-y-2">
                    <div className="flex items-center gap-2 justify-between">
                      <span className="font-semibold text-sm dark:text-white">
                        {universe.name}
                      </span>
                      {universe.collapsed && (
                        <Badge variant="secondary" className="text-xs">
                          Collapsed
                        </Badge>
                      )}
                    </div>

                    {/* Amplitude visualization */}
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded h-2">
                      <div
                        className="bg-purple-500 h-full rounded transition-all"
                        style={{ width: `${Math.abs(universe.amplitude) * 100}%` }}
                      />
                    </div>

                    {/* Qubit count */}
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {universe.qubits.length} qubits
                    </div>

                    {/* Entanglement indicator */}
                    {entanglementMap[universe.id] && (
                      <div className="text-xs text-purple-600 dark:text-purple-400 flex items-center gap-1">
                        <Waves className="w-3 h-3" />
                        Entangled
                      </div>
                    )}
                  </div>
                </motion.button>
              ))}
            </div>

            {/* Timeline History */}
            {timelineHistory.length > 0 && (
              <div className="border-t dark:border-gray-700 pt-4">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Timeline Events
                </h4>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {timelineHistory.slice(-5).reverse().map((event, idx) => (
                    <div key={idx} className="text-xs text-gray-600 dark:text-gray-400 p-2 bg-gray-50 dark:bg-gray-800/50 rounded">
                      <span className="font-medium capitalize">{event.type}</span>
                      {' '} - {event.details}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quantum Controls */}
      <Card className="border-2 border-indigo-500/30 dark:border-indigo-500/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
            <Zap className="w-5 h-5" />
            Quantum Operations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Button
              onClick={applyHadamard}
              variant="outline"
              size="sm"
              className="h-10 rounded-lg dark:border-indigo-700 dark:hover:bg-indigo-950/30"
            >
              <Waves className="w-4 h-4 mr-2" />
              Hadamard
            </Button>
            <Button
              onClick={applyPauliX}
              variant="outline"
              size="sm"
              className="h-10 rounded-lg dark:border-indigo-700 dark:hover:bg-indigo-950/30"
            >
              <Zap className="w-4 h-4 mr-2" />
              Pauli-X
            </Button>
            <Button
              onClick={handleBranch}
              variant="outline"
              size="sm"
              className="h-10 rounded-lg dark:border-purple-700 dark:hover:bg-purple-950/30"
            >
              <GitBranch className="w-4 h-4 mr-2" />
              Branch
            </Button>
            <Button
              onClick={collapseWavefunction}
              variant="outline"
              size="sm"
              className="h-10 rounded-lg dark:border-red-700 dark:hover:bg-red-950/30"
            >
              <Eye className="w-4 h-4 mr-2" />
              Measure
            </Button>
          </div>

          {/* Active Universe Details */}
          {activeUniverse && (
            <div className="border-t dark:border-gray-700 pt-4">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Active Universe: {activeUniverse.name}
              </h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">State:</span>
                  <span className="font-mono text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                    {activeUniverse.collapsed ? '|collapsed⟩' : '|superposition⟩'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Amplitude:</span>
                  <span className="font-mono text-xs">{activeUniverse.amplitude.toFixed(3)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Probability:</span>
                  <span className="font-mono text-xs">
                    {(Math.abs(activeUniverse.amplitude) ** 2 * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quantum Interference */}
      {Object.keys(interference).length > 0 && (
        <Card className="border-2 border-cyan-500/30 dark:border-cyan-500/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400">
              <Waves className="w-5 h-5" />
              Quantum Interference
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {Object.entries(interference)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 6)
                .map(([pair, value]) => (
                  <div key={pair} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800/50 rounded">
                    <span className="text-xs font-mono text-gray-600 dark:text-gray-400">
                      {pair.split('-').map(id => id.substring(9)).join(' ↔ ')}
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded h-1">
                        <div
                          className="bg-cyan-500 h-full rounded transition-all"
                          style={{ width: `${Math.min(value * 100, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs font-mono text-cyan-600 dark:text-cyan-400">
                        {(value * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* System Status */}
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
            {universes.length}
          </div>
          <div className="text-xs text-blue-600 dark:text-blue-400">Universes</div>
        </div>
        <div className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-200 dark:border-purple-800">
          <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
            {timelineHistory.length}
          </div>
          <div className="text-xs text-purple-600 dark:text-purple-400">Events</div>
        </div>
        <div className="p-3 bg-cyan-50 dark:bg-cyan-950/30 rounded-lg border border-cyan-200 dark:border-cyan-800">
          <div className="text-lg font-bold text-cyan-600 dark:text-cyan-400">
            {Object.keys(entanglementMap).length}
          </div>
          <div className="text-xs text-cyan-600 dark:text-cyan-400">Entangled</div>
        </div>
      </div>
    </div>
  );
}