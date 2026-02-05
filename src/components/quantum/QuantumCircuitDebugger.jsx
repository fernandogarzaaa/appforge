import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlayCircle, Pause, RotateCcw, Bug } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function QuantumCircuitDebugger({ circuit }) {
  const [isRunning, setIsRunning] = useState(false);
  const [simulationResult, setSimulationResult] = useState(null);
  const [selectedQubit, setSelectedQubit] = useState(0);
  const [numShots, setNumShots] = useState(1000);

  const handleSimulate = async () => {
    if (!circuit) {
      toast.error('No circuit to simulate');
      return;
    }

    setIsRunning(true);
    try {
      const response = await base44.functions.invoke('quantumSimulation', {
        circuit,
        num_shots: numShots
      });

      if (response.data.success) {
        setSimulationResult(response.data.simulation);
        toast.success('Simulation completed successfully');
      }
    } catch (err) {
      toast.error('Simulation failed: ' + err.message);
    } finally {
      setIsRunning(false);
    }
  };

  const handleReset = () => {
    setSimulationResult(null);
    setSelectedQubit(0);
  };

  return (
    <div className="space-y-4">
      <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bug className="w-5 h-5 text-purple-600" />
            Quantum Debugger
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Control Panel */}
          <div className="flex gap-2 items-center">
            <Button
              onClick={handleSimulate}
              disabled={isRunning || !circuit}
              className="bg-gradient-to-r from-purple-600 to-pink-600"
            >
              {isRunning ? (
                <>
                  <Pause className="w-4 h-4 mr-2 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <PlayCircle className="w-4 h-4 mr-2" />
                  Run Simulation
                </>
              )}
            </Button>
            <Button variant="outline" onClick={handleReset}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
            <div className="ml-auto text-sm">
              <label className="text-gray-600">Shots: </label>
              <input
                type="number"
                value={numShots}
                onChange={(e) => setNumShots(parseInt(e.target.value))}
                min="100"
                max="10000"
                step="100"
                className="w-20 px-2 py-1 border rounded"
              />
            </div>
          </div>

          {/* Results */}
          {simulationResult && (
            <Tabs defaultValue="probabilities" className="space-y-3">
              <TabsList>
                <TabsTrigger value="probabilities">Probabilities</TabsTrigger>
                <TabsTrigger value="statevector">State Vector</TabsTrigger>
                <TabsTrigger value="metrics">Metrics</TabsTrigger>
              </TabsList>

              <TabsContent value="probabilities">
                <div className="space-y-2">
                  {Object.entries(simulationResult.probabilities || {})
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 16)
                    .map(([outcome, prob]) => (
                      <motion.div
                        key={outcome}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-2"
                      >
                        <div className="w-24 font-mono text-sm">|{outcome}⟩</div>
                        <div className="flex-1 bg-gray-200 rounded h-6 overflow-hidden">
                          <motion.div
                            className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${prob * 100}%` }}
                            transition={{ duration: 0.5 }}
                          />
                        </div>
                        <div className="w-16 text-right text-sm font-semibold">
                          {(prob * 100).toFixed(1)}%
                        </div>
                      </motion.div>
                    ))}
                </div>
              </TabsContent>

              <TabsContent value="statevector">
                <div className="bg-gray-50 p-3 rounded font-mono text-xs space-y-1 max-h-40 overflow-y-auto">
                  {simulationResult.statevector?.map((amp, i) => (
                    <div key={i} className="text-gray-700">
                      |{i}⟩: {amp?.toFixed(4) || amp}
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="metrics">
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-gray-600 mb-1">Circuit Fidelity</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {(simulationResult.fidelity * 100).toFixed(2)}%
                    </p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm text-gray-600 mb-1">Total Shots</p>
                    <p className="text-2xl font-bold text-green-600">{numShots}</p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
}