import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Zap, Brain } from 'lucide-react';

export default function QuantumQueryAnalyzer({ onAnalysisComplete }) {
  const [query, setQuery] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);

  const analyzeQuantumQuery = async () => {
    if (!query.trim()) return;
    
    setIsAnalyzing(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this quantum simulation query and extract:
1. Intent (what the user wants to do: simulate, analyze, optimize, explore, debug)
2. Quantum concepts involved (gates, qubits, entanglement, superposition, etc.)
3. Complexity level (beginner, intermediate, advanced)
4. Suggested simulation type (circuit, state-vector, density-matrix, adiabatic)
5. Key parameters to track (coherence, fidelity, entanglement entropy, etc.)

User query: "${query}"

Respond in JSON format with keys: intent, quantum_concepts, complexity_level, simulation_type, parameters_to_track, confidence_score (0-1)`,
        response_json_schema: {
          type: 'object',
          properties: {
            intent: { type: 'string' },
            quantum_concepts: { type: 'array', items: { type: 'string' } },
            complexity_level: { type: 'string', enum: ['beginner', 'intermediate', 'advanced'] },
            simulation_type: { type: 'string' },
            parameters_to_track: { type: 'array', items: { type: 'string' } },
            confidence_score: { type: 'number' },
          },
        },
      });

      setAnalysis(response.data);
      onAnalysisComplete?.(response.data);
    } catch (error) {
      console.error('Failed to analyze query:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="Ask about quantum simulations... (e.g., 'Create a Bell state and measure entanglement')"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && analyzeQuantumQuery()}
          disabled={isAnalyzing}
          className="text-sm"
        />
        <Button
          onClick={analyzeQuantumQuery}
          disabled={!query.trim() || isAnalyzing}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
        >
          {isAnalyzing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Brain className="w-4 h-4" />
          )}
        </Button>
      </div>

      {analysis && (
        <Card className="border-purple-200 bg-purple-50/30">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Query Analysis</CardTitle>
              <Badge variant="outline" className="bg-white">
                {(analysis.confidence_score * 100).toFixed(0)}% confidence
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="text-xs text-gray-600 font-semibold mb-1">Intent</p>
              <p className="text-gray-900 capitalize">{analysis.intent}</p>
            </div>

            <div>
              <p className="text-xs text-gray-600 font-semibold mb-1">Complexity</p>
              <Badge className="bg-indigo-100 text-indigo-800 capitalize">
                {analysis.complexity_level}
              </Badge>
            </div>

            <div>
              <p className="text-xs text-gray-600 font-semibold mb-1">Simulation Type</p>
              <Badge variant="outline">{analysis.simulation_type}</Badge>
            </div>

            <div>
              <p className="text-xs text-gray-600 font-semibold mb-2">Quantum Concepts</p>
              <div className="flex flex-wrap gap-1">
                {analysis.quantum_concepts.map((concept, idx) => (
                  <Badge key={idx} className="bg-cyan-100 text-cyan-800 text-xs">
                    {concept}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs text-gray-600 font-semibold mb-2">Parameters</p>
              <div className="flex flex-wrap gap-1">
                {analysis.parameters_to_track.map((param, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    <Zap className="w-3 h-3 mr-1" />
                    {param}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}