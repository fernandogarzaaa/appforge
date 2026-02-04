import React, { useState, useEffect } from 'react';
import { useQuantumMultiverse } from './useQuantumMultiverse';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, GitBranch, Eye, Play, Pause, RotateCcw, Layers } from 'lucide-react';

export default function MultiverseViewer() {
  const { 
    universes, 
    activeUniverseId, 
    isSimulating, 
    timeline,
    createUniverse, 
    switchUniverse, 
    toggleSimulation, 
    resetSimulation,
    observeTimeline 
  } = useQuantumMultiverse();

  const [selectedUniverse, setSelectedUniverse] = useState(null);

  useEffect(() => {
    if (activeUniverseId && universes.length > 0) {
      const universe = universes.find(u => u.id === activeUniverseId);
      setSelectedUniverse(universe);
    }
  }, [activeUniverseId, universes]);

  const handleCreateUniverse = async () => {
    const newUniverse = await createUniverse({
      name: `Universe ${universes.length + 1}`,
      parameters: {
        quantumEntanglement: Math.random() * 100,
        coherenceLevel: Math.random() * 100,
        decoherenceRate: Math.random() * 0.1,
      }
    });
    if (newUniverse) {
      switchUniverse(newUniverse.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center">
            <Layers className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Multiverse Engine</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Parallel Universe Simulation</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant={isSimulating ? "default" : "outline"}
            size="sm"
            onClick={toggleSimulation}
            className="gap-2"
          >
            {isSimulating ? (
              <>
                <Pause className="w-4 h-4" />
                Pause
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Start
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={resetSimulation}
            className="gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </Button>
        </div>
      </div>

      {/* Timeline View */}
      {timeline && (
        <Card className="bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-950/20 dark:to-blue-950/20 border-cyan-200 dark:border-cyan-800">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="w-5 h-5 text-cyan-600" />
              Current Timeline State
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Iteration</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{timeline.iteration}</p>
              </div>
              <div className="p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Entanglement</p>
                <p className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">{timeline.entanglement.toFixed(1)}%</p>
              </div>
              <div className="p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Coherence</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{timeline.coherence.toFixed(1)}%</p>
              </div>
              <div className="p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Active Branches</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{timeline.branches}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Universes Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <GitBranch className="w-5 h-5" />
            Parallel Universes ({universes.length})
          </h3>
          <Button onClick={handleCreateUniverse} size="sm" className="gap-2">
            <Zap className="w-4 h-4" />
            New Universe
          </Button>
        </div>

        {universes.length === 0 ? (
          <Card className="bg-gray-50 dark:bg-gray-800/50">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <GitBranch className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-gray-600 dark:text-gray-400 mb-4">No universes created yet</p>
              <Button onClick={handleCreateUniverse} variant="outline">
                Create First Universe
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence mode="popLayout">
              {universes.map((universe) => (
                <motion.div
                  key={universe.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  onClick={() => switchUniverse(universe.id)}
                  className={`cursor-pointer transition-all ${
                    activeUniverseId === universe.id
                      ? 'ring-2 ring-cyan-500 ring-offset-2 dark:ring-offset-gray-950'
                      : ''
                  }`}
                >
                  <Card
                    className={`${
                      activeUniverseId === universe.id
                        ? 'border-cyan-500 bg-cyan-50/50 dark:bg-cyan-950/20'
                        : 'hover:shadow-lg'
                    }`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base">{universe.name}</CardTitle>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            ID: {universe.id.slice(0, 8)}...
                          </p>
                        </div>
                        {activeUniverseId === universe.id && (
                          <Eye className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Quantum Entanglement</p>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-cyan-500 h-2 rounded-full"
                            style={{ width: `${Math.min(universe.parameters.quantumEntanglement, 100)}%` }}
                          />
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Coherence Level</p>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ width: `${Math.min(universe.parameters.coherenceLevel, 100)}%` }}
                          />
                        </div>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Badge variant="outline" className="text-xs">
                          Decoherence: {(universe.parameters.decoherenceRate * 100).toFixed(1)}%
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Quantum Metrics */}
      {selectedUniverse && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quantum Metrics - {selectedUniverse.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <p className="text-xs text-gray-600 dark:text-gray-400">State Vector Dimension</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">2^{Math.ceil(Math.log2(universes.length + 1))}</p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <p className="text-xs text-gray-600 dark:text-gray-400">Fidelity</p>
                  <p className="text-lg font-semibold text-purple-600 dark:text-purple-400 mt-1">
                    {(Math.random() * 0.15 + 0.85 * 100).toFixed(2)}%
                  </p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <p className="text-xs text-gray-600 dark:text-gray-400">T1 Relaxation</p>
                  <p className="text-lg font-semibold text-indigo-600 dark:text-indigo-400 mt-1">
                    {(Math.random() * 100 + 50).toFixed(0)} μs
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}