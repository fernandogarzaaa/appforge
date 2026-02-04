import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Send } from 'lucide-react';

export default function AgentFeedbackCollector({ agentId, agentName }) {
  const [rating, setRating] = useState(0);
  const [comments, setComments] = useState('');
  const [qualityScores, setQualityScores] = useState({
    accuracy: 0,
    relevance: 0,
    clarity: 0,
    usefulness: 0
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      alert('Please provide a rating');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await base44.functions.invoke('processAgentFeedback', {
        agentId,
        rating,
        comments,
        responseQuality: qualityScores
      });

      if (response.data?.success) {
        setSubmitted(true);
        setTimeout(() => {
          setRating(0);
          setComments('');
          setQualityScores({ accuracy: 0, relevance: 0, clarity: 0, usefulness: 0 });
          setSubmitted(false);
        }, 2000);
      }
    } catch (error) {
      console.error('Submission error:', error);
      alert('Failed to submit feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-4 text-center">
          <p className="text-sm font-semibold text-green-800">✓ Thank you! Your feedback helps improve {agentName}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <MessageSquare className="w-4 h-4" />
          Rate Agent Response
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Overall Rating */}
        <div>
          <label className="text-xs font-semibold block mb-2">Overall Rating</label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                onClick={() => setRating(value)}
                className={`flex-1 py-2 rounded-lg transition-all ${
                  rating === value
                    ? 'bg-amber-500 text-white scale-105'
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                {value}
              </button>
            ))}
          </div>
        </div>

        {/* Quality Dimensions */}
        <div className="space-y-2">
          <label className="text-xs font-semibold block">Quality Dimensions</label>
          {Object.keys(qualityScores).map((dimension) => (
            <div key={dimension} className="flex items-center justify-between">
              <span className="text-xs capitalize">{dimension}</span>
              <div className="flex gap-1">
                {[0, 1, 2, 3].map((val) => (
                  <button
                    key={val}
                    onClick={() =>
                      setQualityScores({ ...qualityScores, [dimension]: val })
                    }
                    className={`w-6 h-6 rounded text-xs font-semibold transition-all ${
                      qualityScores[dimension] === val
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200'
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Comments */}
        <div>
          <label className="text-xs font-semibold block mb-1">Additional Comments (Optional)</label>
          <textarea
            placeholder="What could be improved?"
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            className="w-full px-2 py-1.5 text-xs border rounded-lg h-16"
          />
        </div>

        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || rating === 0}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600"
        >
          <Send className="w-3 h-3 mr-1" />
          {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
        </Button>
      </CardContent>
    </Card>
  );
}