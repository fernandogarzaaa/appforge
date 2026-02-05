import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion } from 'framer-motion';
import { Sparkles, Zap, TrendingDown, AlertCircle } from 'lucide-react';
import QuantumCircuitGenerator from '@/components/quantum/QuantumCircuitGenerator';
import QuantumCircuitOptimizer from '@/components/quantum/QuantumCircuitOptimizer';
import QuantumErrorPredictor from '@/components/quantum/QuantumErrorPredictor';
import QuantumHardwareJobManager from '@/components/quantum/QuantumHardwareJobManager';
import QuantumCircuitVisualizer from '@/components/QuantumCircuitVisualizer';

export default function QuantumLab() {
  const [currentCircuit, setCurrentCircuit] = useState(null);
  const [selectedBackend, setSelectedBackend] = useState('ibm_quantum');

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 p-8">
      <div className="max-w-[1600px] mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Quantum Lab</h1>
              <p className="text-gray-600">AI-powered circuit design, optimization, and error analysis</p>
            </div>
          </div>
        </motion.div>

        {/* Main Content */}
        <Tabs defaultValue="design" className="space-y-6">
          <TabsList className="bg-white border-2 border-gray-200">
            <TabsTrigger value="design" className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Design
            </TabsTrigger>
            <TabsTrigger value="optimize" className="flex items-center gap-2">
              <TrendingDown className="w-4 h-4" />
              Optimize
            </TabsTrigger>
            <TabsTrigger value="analyze" className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Analyze
            </TabsTrigger>
            <TabsTrigger value="execute" className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Execute
            </TabsTrigger>
          </TabsList>

          {/* Design Tab */}
          <TabsContent value="design" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <QuantumCircuitGenerator
                  onCircuitGenerated={(circuit) => {
                    setCurrentCircuit(circuit);
                  }}
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <QuantumCircuitVisualizer
                  initialQubits={currentCircuit?.qubits || 3}
                  onCircuitChange={(circuit) => setCurrentCircuit(circuit)}
                />
              </motion.div>
            </div>
          </TabsContent>

          {/* Optimize Tab */}
          <TabsContent value="optimize" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <QuantumCircuitOptimizer
                  circuit={currentCircuit}
                  onOptimized={(optimized) => setCurrentCircuit(optimized)}
                />
              </motion.div>

              {currentCircuit && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <Card className="border-2 border-gray-200">
                    <CardHeader>
                      <CardTitle className="text-sm">Current Circuit</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3 text-sm">
                        <div>
                          <p className="text-gray-600 text-xs">Name</p>
                          <p className="font-semibold">{currentCircuit.name || 'Untitled'}</p>
                        </div>
                        <div>
                          <p className="text-gray-600 text-xs">Qubits</p>
                          <p className="font-semibold">{currentCircuit.qubits}</p>
                        </div>
                        <div>
                          <p className="text-gray-600 text-xs">Gates</p>
                          <p className="font-semibold">{currentCircuit.gates?.length || 0}</p>
                        </div>
                        <div>
                          <label className="block text-gray-600 text-xs mb-1">Target Backend</label>
                          <select
                            value={selectedBackend}
                            onChange={(e) => setSelectedBackend(e.target.value)}
                            className="w-full px-2 py-1 border rounded text-xs"
                          >
                            <option value="ibm_quantum">IBM Quantum</option>
                            <option value="aws_braket">AWS Braket</option>
                            <option value="google_cirq">Google Cirq</option>
                          </select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </div>
          </TabsContent>

          {/* Analyze Tab */}
          <TabsContent value="analyze">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <QuantumErrorPredictor
                circuit={currentCircuit}
                backend={selectedBackend}
              />
            </motion.div>
          </TabsContent>

          {/* Execute Tab */}
          <TabsContent value="execute">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <QuantumHardwareJobManager />
            </motion.div>
          </TabsContent>
        </Tabs>

        {/* Quick Start Guide */}
        <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50">
          <CardHeader>
            <CardTitle className="text-blue-900">Quick Start</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2 text-sm text-gray-700">
              <li><span className="font-semibold">1. Design:</span> Describe your quantum computation in natural language</li>
              <li><span className="font-semibold">2. Optimize:</span> Let AI optimize it for your target hardware</li>
              <li><span className="font-semibold">3. Analyze:</span> Check for potential errors and noise</li>
              <li><span className="font-semibold">4. Execute:</span> Run on real quantum hardware or simulator</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}