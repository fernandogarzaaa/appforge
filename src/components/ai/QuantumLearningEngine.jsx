import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Brain, TrendingUp, Zap } from 'lucide-react';

export default function QuantumLearningEngine({ userEmail, onLearningsUpdate }) {
  const [learnings, setLearnings] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [improvement, setImprovement] = useState(null);
  const [stats, setStats] = useState({
    totalLearnings: 0,
    appliedLearnings: 0,
    avgConfidence: 0,
    patterns: [],
  });

  // Fetch user's learnings
  useEffect(() => {
    fetchLearnings();
    const interval = setInterval(fetchLearnings, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, [userEmail]);

  const fetchLearnings = async () => {
    try {
      const userLearnings = await base44.entities.Learning.filter({
        user_id: userEmail,
        applied: false,
      }, '-updated_date', 50);
      
      setLearnings(userLearnings || []);
    } catch (error) {
      console.error('Failed to fetch learnings:', error);
    }
  };

  // Process learnings with quantum engine
  const processLearnings = async () => {
    if (learnings.length === 0) return;
    
    setIsProcessing(true);
    try {
      const response = await base44.functions.invoke('processQuantumLearnings', {
        learnings: learnings.slice(0, 10), // Process top 10
        userEmail,
      });

      if (response.data) {
        setImprovement(response.data);
        
        // Mark learnings as applied
        for (const learning of learnings.slice(0, 10)) {
          await base44.entities.Learning.update(learning.id, { applied: true });
        }

        // Update stats
        setStats({
          totalLearnings: learnings.length + response.data.processedCount,
          appliedLearnings: response.data.processedCount,
          avgConfidence: response.data.avgConfidence,
          patterns: response.data.patterns,
        });

        // Notify parent
        onLearningsUpdate?.(response.data);
      }
    } catch (error) {
      console.error('Failed to process learnings:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="border-cyan-200 bg-cyan-50/30">
        <CardHeader>
          <CardTitle className="text-sm flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Brain className="w-4 h-4" />
              Quantum Learning Engine
            </span>
            <Badge variant="outline" className="bg-white">
              {learnings.length} pending
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="p-2 rounded bg-white border border-cyan-200">
              <p className="text-gray-500 font-semibold">Total Learned</p>
              <p className="text-lg font-bold text-cyan-600">{stats.totalLearnings}</p>
            </div>
            <div className="p-2 rounded bg-white border border-cyan-200">
              <p className="text-gray-500 font-semibold">Applied</p>
              <p className="text-lg font-bold text-green-600">{stats.appliedLearnings}</p>
            </div>
            <div className="p-2 rounded bg-white border border-cyan-200">
              <p className="text-gray-500 font-semibold">Confidence</p>
              <p className="text-lg font-bold text-indigo-600">
                {(stats.avgConfidence * 100).toFixed(0)}%
              </p>
            </div>
          </div>

          {stats.patterns.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-2">Learned Patterns</p>
              <div className="flex flex-wrap gap-1">
                {stats.patterns.map((pattern, idx) => (
                  <Badge key={idx} className="bg-blue-100 text-blue-800 text-xs">
                    {pattern}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <Button
            onClick={processLearnings}
            disabled={isProcessing || learnings.length === 0}
            className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700"
          >
            {isProcessing ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Zap className="w-4 h-4 mr-2" />
            )}
            Process Learnings ({learnings.length})
          </Button>

          {improvement && (
            <div className="p-3 rounded-lg bg-green-50 border border-green-200">
              <p className="text-xs font-semibold text-green-800 mb-2">✨ AI Upgraded</p>
              <p className="text-xs text-green-700">{improvement.summary}</p>
              <div className="flex gap-1 mt-2">
                <TrendingUp className="w-3 h-3 text-green-600" />
                <span className="text-xs text-green-600 font-medium">
                  +{(improvement.improvement * 100).toFixed(0)}% improvement
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}