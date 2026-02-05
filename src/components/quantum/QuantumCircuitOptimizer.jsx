import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Zap, TrendingDown, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function QuantumCircuitOptimizer({ circuit, onOptimized }) {
  const [selectedBackend, setSelectedBackend] = useState('ibm_quantum');
  const [optimizationLevel, setOptimizationLevel] = useState('medium');
  const [optimizedCircuit, setOptimizedCircuit] = useState(null);

  const optimizeMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('optimizeQuantumCircuit', {
        circuit_data: circuit,
        backend: selectedBackend,
        optimization_level: optimizationLevel
      });
      return response.data;
    },
    onSuccess: (data) => {
      setOptimizedCircuit(data);
      toast.success('Circuit optimized');
      if (onOptimized) {
        onOptimized(data.circuit);
      }
    },
    onError: (err) => toast.error(err.message)
  });

  if (!circuit) {
    return (
      <Card className="border-2 border-dashed border-gray-300">
        <CardContent className="p-6 text-center text-gray-500">
          <Zap className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p>Load or generate a circuit to optimize</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-900">
          <TrendingDown className="w-5 h-5" />
          Circuit Optimizer
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Backend Selection */}
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700">Target Backend</label>
          <select
            value={selectedBackend}
            onChange={(e) => setSelectedBackend(e.target.value)}
            className="w-full px-3 py-2 border-2 border-blue-200 rounded-lg"
          >
            <option value="ibm_quantum">IBM Quantum</option>
            <option value="aws_braket">AWS Braket</option>
            <option value="google_cirq">Google Cirq</option>
          </select>
        </div>

        {/* Optimization Level */}
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700">Optimization Level</label>
          <div className="flex gap-2">
            {['light', 'medium', 'aggressive'].map(level => (
              <Button
                key={level}
                variant={optimizationLevel === level ? 'default' : 'outline'}
                onClick={() => setOptimizationLevel(level)}
                className="flex-1 capitalize"
              >
                {level}
              </Button>
            ))}
          </div>
        </div>

        {/* Optimize Button */}
        <Button
          onClick={() => optimizeMutation.mutate()}
          disabled={optimizeMutation.isPending}
          className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white"
        >
          {optimizeMutation.isPending ? (
            <>
              <Zap className="w-4 h-4 mr-2 animate-spin" />
              Optimizing...
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 mr-2" />
              Optimize Circuit
            </>
          )}
        </Button>

        {/* Results */}
        {optimizedCircuit && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3 bg-white border-2 border-blue-200 rounded-lg p-4"
          >
            {/* Improvements */}
            <div>
              <p className="font-medium text-gray-900 flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                Optimizations Applied
              </p>
              <div className="flex flex-wrap gap-2">
                {optimizedCircuit.optimizations.map((opt, idx) => (
                  <Badge key={idx} variant="outline" className="bg-green-50 text-green-700">
                    {opt}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Metrics */}
            <div className="bg-blue-50 rounded-lg p-3 space-y-2 text-sm">
              <p className="font-medium text-gray-900">Performance Metrics</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-gray-600">Gate Count</p>
                  <div className="flex items-center gap-1">
                    <span className="font-semibold text-gray-900">
                      {optimizedCircuit.metrics.optimized_gate_count}
                    </span>
                    <span className="text-red-600">
                      ↓ {optimizedCircuit.metrics.gate_reduction_percent.toFixed(1)}%
                    </span>
                  </div>
                </div>

                <div>
                  <p className="text-gray-600">Circuit Depth</p>
                  <div className="flex items-center gap-1">
                    <span className="font-semibold text-gray-900">
                      {optimizedCircuit.metrics.optimized_depth}
                    </span>
                    <span className="text-red-600">
                      (was {optimizedCircuit.metrics.original_depth})
                    </span>
                  </div>
                </div>

                <div className="col-span-2">
                  <p className="text-gray-600">Two-Qubit Gates</p>
                  <p className="font-semibold text-gray-900">
                    {optimizedCircuit.metrics.two_qubit_gate_count}
                  </p>
                </div>
              </div>
            </div>

            {/* Hardware Notes */}
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-3 rounded text-xs text-gray-700">
              <p className="font-medium mb-1 text-blue-900">Backend Notes</p>
              {optimizedCircuit.hardware_notes}
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}