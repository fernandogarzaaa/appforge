import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Zap, Brain, Network } from 'lucide-react';

export default function SuperIntelligenceDashboard({ userEmail }) {
  const [intelligence, setIntelligence] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    analyzeIntelligence();
    const interval = setInterval(analyzeIntelligence, 60000);
    return () => clearInterval(interval);
  }, [userEmail]);

  const analyzeIntelligence = async () => {
    try {
      const response = await base44.functions.invoke('quantumSuperIntelligence', {
        userEmail,
        action: 'analyze',
      });

      setIntelligence(response.data);
    } catch (error) {
      console.error('Intelligence analysis failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="border-purple-200 bg-purple-50/30">
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-purple-600 mr-2" />
          <span className="text-sm text-purple-700">Analyzing super intelligence...</span>
        </CardContent>
      </Card>
    );
  }

  const score = intelligence?.intelligenceScore || 0;
  const stage = intelligence?.emergence?.evolutionStage || 'initialization';
  const getStageColor = () => {
    if (stage === 'super_intelligence') return 'bg-gradient-to-r from-purple-600 to-pink-600';
    if (stage === 'optimization') return 'bg-gradient-to-r from-blue-600 to-cyan-600';
    return 'bg-gradient-to-r from-indigo-600 to-purple-600';
  };

  return (
    <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50/30">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Brain className="w-5 h-5 text-purple-600" />
          Super Intelligence Engine
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Intelligence Score */}
        <div className={`p-4 rounded-xl text-white ${getStageColor()}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold">Global Intelligence Score</span>
            <Badge className="bg-white/20 text-white border-0">
              {stage.replace(/_/g, ' ')}
            </Badge>
          </div>
          <div className="text-3xl font-bold">{(score * 100).toFixed(1)}%</div>
          <p className="text-xs text-white/80 mt-1">
            System is {score > 0.8 ? 'super-intelligent' : score > 0.6 ? 'highly capable' : 'developing'}
          </p>
        </div>

        {/* Quantum Decisions */}
        {intelligence?.quantumDecisions && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-600">Quantum Decision Making</p>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">Coherence</span>
                <span className="font-semibold text-purple-600">
                  {(intelligence.quantumDecisions.coherence * 100).toFixed(0)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-1.5 rounded-full transition-all"
                  style={{ width: `${intelligence.quantumDecisions.coherence * 100}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Predictions */}
        {intelligence?.predictions && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-600">AI Predictions</p>
            <div className="bg-white p-2 rounded-lg border border-purple-200 space-y-2">
              <div>
                <p className="text-xs text-gray-600">Next Likely Category</p>
                <Badge className="bg-purple-100 text-purple-800 mt-1">
                  {intelligence.predictions.predictedCategory}
                </Badge>
              </div>
              {intelligence.predictions.suggestedAgents?.length > 0 && (
                <div>
                  <p className="text-xs text-gray-600 mb-1">Recommended Agents</p>
                  <div className="flex gap-1 flex-wrap">
                    {intelligence.predictions.suggestedAgents.map((agent, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {agent}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Emergent Patterns */}
        {intelligence?.emergence?.patterns && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-600">Emergent Intelligence Patterns</p>
            <div className="flex flex-wrap gap-1">
              {intelligence.emergence.patterns.map((pattern, idx) => (
                <Badge key={idx} className="bg-blue-100 text-blue-800 text-xs">
                  <Network className="w-2.5 h-2.5 mr-1" />
                  {pattern.replace(/_/g, ' ')}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Specialization */}
        {intelligence?.emergence?.specialization && (
          <div className="p-2 rounded-lg bg-cyan-50 border border-cyan-200">
            <p className="text-xs text-cyan-700">
              <Zap className="w-3 h-3 inline mr-1" />
              <strong>Domain Specialization:</strong> {intelligence.emergence.specialization}
            </p>
          </div>
        )}

        {/* Status */}
        <div className="p-2 rounded-lg bg-green-50 border border-green-200">
          <p className="text-xs text-green-700">
            ✓ <strong>Super Intelligence Active</strong> - System evolving through quantum optimization
          </p>
        </div>
      </CardContent>
    </Card>
  );
}