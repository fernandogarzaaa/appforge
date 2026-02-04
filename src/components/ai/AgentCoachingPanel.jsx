import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Lightbulb, Target, TrendingUp, CheckCircle2 } from 'lucide-react';

const priorityConfig = {
  critical: { color: 'bg-red-600', icon: AlertCircle },
  high: { color: 'bg-orange-600', icon: AlertCircle },
  medium: { color: 'bg-yellow-600', icon: Lightbulb },
  low: { color: 'bg-blue-600', icon: TrendingUp }
};

export default function AgentCoachingPanel({ agentId, agentName }) {
  const [recommendations, setRecommendations] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [expandedRec, setExpandedRec] = useState(null);

  useEffect(() => {
    fetchRecommendations();
  }, [agentId]);

  const fetchRecommendations = async () => {
    try {
      const data = await base44.entities.AgentCoachingRecommendation.filter(
        { agent_id: agentId, dismissed: false },
        '-priority',
        20
      );
      setRecommendations(data || []);
    } catch (error) {
      console.error('Failed to fetch recommendations:', error);
    }
  };

  const analyzeAgent = async () => {
    setIsAnalyzing(true);
    try {
      await base44.functions.invoke('generateCoachingRecommendations', {
        agentId
      });
      fetchRecommendations();
    } catch (error) {
      console.error('Analysis error:', error);
      alert('Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const dismissRecommendation = async (recId) => {
    try {
      await base44.entities.AgentCoachingRecommendation.update(recId, { dismissed: true });
      fetchRecommendations();
    } catch (error) {
      console.error('Dismiss error:', error);
    }
  };

  return (
    <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
      <CardHeader>
        <CardTitle className="text-sm flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4" />
            Agent Coaching System
          </span>
          <Button
            size="sm"
            onClick={analyzeAgent}
            disabled={isAnalyzing}
            className="bg-gradient-to-r from-purple-600 to-pink-600"
          >
            {isAnalyzing ? 'Analyzing...' : 'Analyze'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {recommendations.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-xs text-gray-500">No recommendations yet</p>
            <Button
              size="sm"
              variant="outline"
              onClick={analyzeAgent}
              className="mt-2"
            >
              Run Analysis
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {recommendations.map((rec) => {
              const Icon = priorityConfig[rec.priority]?.icon || AlertCircle;
              return (
                <div
                  key={rec.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-all ${
                    expandedRec === rec.id ? 'ring-2 ring-purple-400 bg-white' : 'hover:bg-white/50'
                  }`}
                  onClick={() => setExpandedRec(expandedRec === rec.id ? null : rec.id)}
                >
                  <div className="flex items-start gap-2 mb-1">
                    <Icon className={`w-3 h-3 mt-0.5 flex-shrink-0 ${priorityConfig[rec.priority]?.color.replace('bg-', 'text-')}`} />
                    <div className="flex-1">
                      <p className="font-semibold text-xs">{rec.title}</p>
                      <Badge className={`text-xs mt-1 ${priorityConfig[rec.priority].color}`}>
                        {rec.priority.toUpperCase()}
                      </Badge>
                    </div>
                  </div>

                  {expandedRec === rec.id && (
                    <div className="mt-2 pt-2 border-t space-y-2">
                      <p className="text-xs text-gray-700">{rec.description}</p>

                      {rec.rationale && (
                        <div className="p-2 bg-gray-50 rounded text-xs">
                          <p className="font-semibold mb-1">Performance Gap:</p>
                          <p className="text-gray-600">
                            {rec.rationale.performance_metric}: {(rec.rationale.current_value * 100).toFixed(0)}% → {(rec.rationale.target_value * 100).toFixed(0)}%
                          </p>
                          <p className="text-gray-600 mt-0.5">
                            Gap: {rec.rationale.gap_percentage?.toFixed(1)}%
                          </p>
                        </div>
                      )}

                      {rec.expected_improvement && (
                        <div className="p-2 bg-green-50 rounded text-xs">
                          <p className="text-green-800">
                            <Target className="w-3 h-3 inline mr-1" />
                            Expected Improvement: +{rec.expected_improvement}%
                          </p>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            dismissRecommendation(rec.id);
                          }}
                          variant="outline"
                          className="flex-1"
                        >
                          Dismiss
                        </Button>
                        <Button
                          size="sm"
                          className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600"
                        >
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Apply
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}