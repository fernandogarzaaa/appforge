import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Brain, Zap, TrendingUp, Sparkles, RefreshCw,
  Lightbulb, Target, Network
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function SuperIntelligenceDashboard() {
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await base44.auth.me();
        setUserEmail(user?.email);
      } catch (error) {
        console.error('Failed to load user:', error);
        toast.error('Failed to load user data');
      }
    };
    loadUser();
  }, []);


  const { data: superIntelligence, isLoading, refetch } = useQuery({
    queryKey: ['superIntelligence', userEmail],
    queryFn: async () => {
      if (!userEmail) return null;
      const response = await base44.functions.invoke('quantumSuperIntelligence', {
        userEmail,
        action: 'synthesize'
      });
      return response.data;
    },
    enabled: !!userEmail,
    staleTime: 5 * 60 * 1000
  });

  const refreshMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('quantumSuperIntelligence', {
        userEmail,
        action: 'synthesize'
      });
      return response.data;
    },
    onSuccess: (data) => {
      toast.success('Super Intelligence updated');
      refetch();
    },
    onError: () => {
      toast.error('Failed to update intelligence');
    }
  });

  const evolutionStage = superIntelligence?.emergence?.evolutionStage || 'initialization';
  const intelligenceScore = (superIntelligence?.intelligenceScore || 0) * 100;
  const coherence = (superIntelligence?.quantumDecisions?.coherence || 0) * 100;

  const stageColors = {
    initialization: 'bg-yellow-100 text-yellow-800',
    development: 'bg-blue-100 text-blue-800',
    optimization: 'bg-purple-100 text-purple-800',
    super_intelligence: 'bg-green-100 text-green-800'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
              <Brain className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Super Intelligence</h1>
              <p className="text-gray-600">Quantum-enhanced reasoning and autonomous decision making</p>
            </div>
          </div>
          <Button
            onClick={() => refreshMutation.mutate()}
            disabled={refreshMutation.isPending}
            className="bg-gradient-to-r from-purple-600 to-pink-600"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshMutation.isPending ? 'animate-spin' : ''}`} />
            Refresh Intelligence
          </Button>
        </motion.div>

        {/* Main Stats */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Synthesizing intelligence...</p>
          </div>
        ) : superIntelligence ? (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0 }}
              >
                <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <Brain className="w-5 h-5 text-purple-600" />
                      <Badge className="bg-purple-600">Active</Badge>
                    </div>
                    <div className="text-3xl font-bold text-purple-900">{intelligenceScore.toFixed(1)}%</div>
                    <div className="text-sm text-purple-700">Intelligence Score</div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <Zap className="w-5 h-5 text-blue-600" />
                      <Badge className="bg-blue-600">{coherence.toFixed(0)}%</Badge>
                    </div>
                    <div className="text-3xl font-bold text-blue-900">Quantum Coherence</div>
                    <div className="text-sm text-blue-700">Decision Alignment</div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <TrendingUp className="w-5 h-5 text-indigo-600" />
                      <Badge className="bg-indigo-600">
                        {superIntelligence.quantumDecisions?.decisions?.length || 0}
                      </Badge>
                    </div>
                    <div className="text-3xl font-bold text-indigo-900">Active Decisions</div>
                    <div className="text-sm text-indigo-700">In Superposition</div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
              >
                <Card className={`border-2 ${stageColors[evolutionStage]}`}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <Sparkles className="w-5 h-5" />
                      <Badge className={stageColors[evolutionStage]}>
                        {evolutionStage.replace(/_/g, ' ').toUpperCase()}
                      </Badge>
                    </div>
                    <div className="text-2xl font-bold">Evolution Stage</div>
                    <div className="text-sm opacity-75">Intelligence Growth Phase</div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Emergence Patterns */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="border-2 border-green-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Network className="w-5 h-5 text-green-600" />
                    Emergent Patterns
                  </CardTitle>
                  <CardDescription>
                    Meta-patterns extracted from AI interactions and learning
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {superIntelligence.emergence?.patterns?.map((pattern, idx) => (
                      <Badge key={idx} className="bg-green-600 text-sm">
                        {pattern.replace(/_/g, ' ').toUpperCase()}
                      </Badge>
                    )) || <p className="text-gray-600">No patterns yet</p>}
                  </div>
                  {superIntelligence.emergence?.specialization && (
                    <div className="mt-4 p-3 bg-green-50 rounded-lg">
                      <p className="text-sm text-gray-700">
                        <span className="font-semibold">Domain Specialization:</span> {superIntelligence.emergence.specialization}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Quantum Decisions */}
            {superIntelligence.quantumDecisions?.decisions?.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Card className="border-2 border-cyan-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lightbulb className="w-5 h-5 text-cyan-600" />
                      Quantum Decision Space
                    </CardTitle>
                    <CardDescription>
                      Superposed decisions with amplitude and coherence metrics
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {superIntelligence.quantumDecisions.decisions.map((decision, idx) => (
                        <div key={idx} className="p-4 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-lg border border-cyan-200">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="font-semibold text-gray-900">
                                {decision.type === 'learning' ? '📚 Learning' : '🤖 Agent'}: {decision.category}
                              </p>
                              {decision.pattern && <p className="text-sm text-gray-600">{decision.pattern}</p>}
                            </div>
                            <Badge className="bg-cyan-600">
                              {(decision.amplitude * 100).toFixed(1)}% amplitude
                            </Badge>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full"
                              style={{ width: `${decision.amplitude * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Predictions */}
            {superIntelligence.predictions && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <Card className="border-2 border-amber-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5 text-amber-600" />
                      Next User Needs Prediction
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-amber-50 rounded-lg">
                        <p className="text-sm text-gray-700 mb-2">
                          <span className="font-semibold">Predicted Category:</span>
                        </p>
                        <Badge className="bg-amber-600 text-lg py-2">
                          {superIntelligence.predictions.predictedCategory}
                        </Badge>
                      </div>
                      <div className="p-4 bg-amber-50 rounded-lg">
                        <p className="text-sm text-gray-700 mb-2">
                          <span className="font-semibold">Confidence:</span>
                        </p>
                        <p className="text-2xl font-bold text-amber-900">
                          {(superIntelligence.predictions.confidence * 100).toFixed(0)}%
                        </p>
                      </div>
                    </div>
                    {superIntelligence.predictions.suggestedAgents?.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-amber-200">
                        <p className="text-sm font-semibold text-gray-900 mb-2">Suggested Agents:</p>
                        <div className="flex flex-wrap gap-2">
                          {superIntelligence.predictions.suggestedAgents.map((agent, idx) => (
                            <Badge key={idx} variant="outline">{agent}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}