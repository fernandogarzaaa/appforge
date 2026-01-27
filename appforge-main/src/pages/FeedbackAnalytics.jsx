import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { MessageSquare, TrendingUp, RefreshCw, CheckCircle } from 'lucide-react';
import FeedbackSummary from '@/components/feedback/FeedbackSummary';

export default function FeedbackAnalytics() {
  const queryClient = useQueryClient();
  const [filterType, setFilterType] = useState('all');
  const [isRetraining, setIsRetraining] = useState(false);

  const { data: feedback = [] } = useQuery({
    queryKey: ['feedback'],
    queryFn: () => base44.entities.AIFeedback.list('-created_date', 200)
  });

  const retainModelMutation = useMutation({
    mutationFn: async () => {
      const lowRatedFeedback = feedback.filter(f => f.accuracy_rating <= 2);
      
      if (lowRatedFeedback.length === 0) {
        throw new Error('No low-rated feedback to learn from');
      }

      const improvements = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this feedback from AI outputs and suggest model improvements:
${JSON.stringify(lowRatedFeedback.slice(0, 10), null, 2)}

Provide:
1. Common patterns in the mistakes
2. Specific improvements to the model logic
3. Additional features or context needed
4. Training data recommendations
5. Validation metrics to monitor`,
        response_json_schema: {
          type: "object",
          properties: {
            common_patterns: { type: "array", items: { type: "string" } },
            improvements: { type: "array", items: { type: "string" } },
            new_features: { type: "array", items: { type: "string" } },
            training_recommendations: { type: "array", items: { type: "string" } }
          }
        }
      });

      // Mark feedback as incorporated
      for (const fb of lowRatedFeedback.slice(0, 5)) {
        await base44.entities.AIFeedback.update(fb.id, {
          feedback_status: 'incorporated'
        });
      }

      return improvements;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedback'] });
      toast.success('Model improvement analysis complete!');
    },
    onError: (error) => {
      toast.error('Retraining failed: ' + error.message);
    }
  });

  const filteredFeedback = filterType === 'all' 
    ? feedback 
    : feedback.filter(f => f.feedback_type === filterType);

  const newFeedback = feedback.filter(f => f.feedback_status === 'new').length;
  const incorporatedFeedback = feedback.filter(f => f.feedback_status === 'incorporated').length;

  return (
    <div className="h-screen flex flex-col p-6 bg-gray-50">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <MessageSquare className="w-8 h-8 text-indigo-600" />
            Feedback Analytics & Model Retraining
          </h1>
          <p className="text-gray-500">Improve AI models with user feedback</p>
        </div>
        <Button 
          onClick={() => retainModelMutation.mutate()} 
          disabled={isRetraining || newFeedback === 0}
          className="gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          {isRetraining ? 'Analyzing...' : 'Analyze & Improve'}
        </Button>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <MessageSquare className="w-8 h-8 mx-auto text-indigo-600 mb-2" />
              <div className="text-2xl font-bold">{feedback.length}</div>
              <div className="text-sm text-gray-500">Total Feedback</div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-600">
          <CardContent className="pt-6">
            <div className="text-center">
              <Badge className="mx-auto mb-2 bg-blue-600">{newFeedback}</Badge>
              <div className="text-2xl font-bold">New</div>
              <div className="text-sm text-gray-500">Awaiting Review</div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-600">
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle className="w-8 h-8 mx-auto text-green-600 mb-2" />
              <div className="text-2xl font-bold">{incorporatedFeedback}</div>
              <div className="text-sm text-gray-500">Incorporated</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <TrendingUp className="w-8 h-8 mx-auto text-purple-600 mb-2" />
              <div className="text-2xl font-bold">
                {feedback.length > 0 ? ((incorporatedFeedback / feedback.length) * 100).toFixed(0) : 0}%
              </div>
              <div className="text-sm text-gray-500">Improvement Rate</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Charts */}
      <div className="mb-6">
        <FeedbackSummary feedback={filteredFeedback} />
      </div>

      {/* Detailed Feedback List */}
      <div className="flex-1 overflow-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Feedback Details</h2>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="insight">Insights</SelectItem>
              <SelectItem value="task">Tasks</SelectItem>
              <SelectItem value="prediction">Predictions</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {filteredFeedback.map((fb) => (
            <Card key={fb.id} className={fb.feedback_status === 'incorporated' ? 'bg-green-50' : ''}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-sm capitalize">{fb.feedback_type}</CardTitle>
                    <div className="flex gap-2 mt-1">
                      {[1, 2, 3, 4, 5].map(i => (
                        <span key={i} className={i <= fb.accuracy_rating ? 'text-yellow-400' : 'text-gray-300'}>
                          ★
                        </span>
                      ))}
                    </div>
                  </div>
                  <Badge variant={fb.feedback_status === 'incorporated' ? 'default' : 'secondary'}>
                    {fb.feedback_status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">Usefulness:</span>
                  <span className="font-semibold">
                    {fb.usefulness_rating === 1 ? '👍' : fb.usefulness_rating === -1 ? '👎' : '—'}
                  </span>
                </div>
                {fb.corrective_feedback && (
                  <div className="bg-gray-50 p-2 rounded text-xs border-l-2 border-l-indigo-500">
                    <p className="font-semibold mb-1">Feedback:</p>
                    <p className="text-gray-600">{fb.corrective_feedback}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredFeedback.length === 0 && (
          <div className="text-center py-12">
            <MessageSquare className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">No {filterType === 'all' ? '' : filterType + ' '} feedback yet</p>
          </div>
        )}
      </div>
    </div>
  );
}