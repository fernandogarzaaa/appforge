import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Zap, Copy, Play } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function QuantumCircuitGenerator({ onCircuitGenerated }) {
  const [description, setDescription] = useState('');
  const [numQubits, setNumQubits] = useState(3);
  const [selectedBackend, setSelectedBackend] = useState('ibm_quantum');
  const [generatedCircuit, setGeneratedCircuit] = useState(null);

  const generateMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('generateQuantumCircuit', {
        description,
        num_qubits: numQubits,
        backend: selectedBackend
      });
      return response.data;
    },
    onSuccess: (data) => {
      setGeneratedCircuit(data.circuit);
      toast.success('Circuit generated successfully');
      if (onCircuitGenerated) {
        onCircuitGenerated(data.circuit);
      }
    },
    onError: (err) => toast.error(err.message)
  });

  const handleCopyCircuit = () => {
    navigator.clipboard.writeText(JSON.stringify(generatedCircuit, null, 2));
    toast.success('Circuit copied to clipboard');
  };

  const backends = [
    { id: 'ibm_quantum', name: 'IBM Quantum' },
    { id: 'aws_braket', name: 'AWS Braket' },
    { id: 'google_cirq', name: 'Google Cirq' }
  ];

  return (
    <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-purple-900">
          <Sparkles className="w-5 h-5" />
          AI Circuit Generator
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Description Input */}
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700">
            Describe the computation you want
          </label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="E.g., 'Create a quantum circuit that implements a Bell state for testing entanglement' or 'Generate a circuit for quantum phase estimation'"
            className="min-h-24 border-2 border-purple-200 focus:border-purple-500"
          />
        </div>

        {/* Parameters Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Qubits</label>
            <input
              type="number"
              value={numQubits}
              onChange={(e) => setNumQubits(parseInt(e.target.value))}
              min="1"
              max="20"
              className="w-full px-3 py-2 border-2 border-purple-200 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Backend</label>
            <select
              value={selectedBackend}
              onChange={(e) => setSelectedBackend(e.target.value)}
              className="w-full px-3 py-2 border-2 border-purple-200 rounded-lg"
            >
              {backends.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Generate Button */}
        <Button
          onClick={() => generateMutation.mutate()}
          disabled={!description.trim() || generateMutation.isPending}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
        >
          {generateMutation.isPending ? (
            <>
              <Sparkles className="w-4 h-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Circuit with AI
            </>
          )}
        </Button>

        {/* Generated Circuit Display */}
        {generatedCircuit && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3 bg-white border-2 border-purple-200 rounded-lg p-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-gray-900">{generatedCircuit.name}</p>
                <p className="text-xs text-gray-600 mt-1">{generatedCircuit.description}</p>
              </div>
              <Badge variant="outline">{generatedCircuit.qubits} qubits</Badge>
            </div>

            {/* Gates List */}
            <div className="space-y-1 text-sm">
              <p className="font-medium text-gray-700">Gates ({generatedCircuit.gates.length}):</p>
              <div className="max-h-32 overflow-y-auto text-xs text-gray-600 space-y-1">
                {generatedCircuit.gates.map((gate, idx) => (
                  <div key={idx} className="flex items-center gap-2 px-2 py-1 bg-purple-50 rounded">
                    <span className="font-mono font-semibold text-purple-700">{gate.type}</span>
                    <span className="text-gray-600">→ q{gate.targets.join(',')}</span>
                    {gate.params && <span className="text-gray-500">(θ={gate.params.toFixed(3)})</span>}
                  </div>
                ))}
              </div>
            </div>

            {/* Explanation */}
            <div className="bg-purple-50 p-3 rounded text-xs text-gray-700 max-h-24 overflow-y-auto">
              <p className="font-medium mb-1 text-purple-900">How it works:</p>
              {generatedCircuit.explanation}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleCopyCircuit}
                className="text-xs"
              >
                <Copy className="w-3 h-3 mr-1" /> Copy
              </Button>
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}