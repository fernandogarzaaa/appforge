import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Star, MessageSquare } from 'lucide-react';

export default function FeedbackSummary({ feedback = [] }) {
  if (feedback.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Feedback Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 py-6 text-center">No feedback collected yet</p>
        </CardContent>
      </Card>
    );
  }

  const avgAccuracy = (feedback.reduce((sum, f) => sum + (f.accuracy_rating || 0), 0) / feedback.length).toFixed(1);
  const helpfulCount = feedback.filter(f => f.is_helpful).length;
  const helpfulRate = ((helpfulCount / feedback.length) * 100).toFixed(0);

  const ratingDistribution = [1, 2, 3, 4, 5].map(rating => ({
    rating,
    count: feedback.filter(f => f.accuracy_rating === rating).length
  }));

  const feedbackByType = ['insight', 'task', 'prediction'].map(type => ({
    type,
    count: feedback.filter(f => f.feedback_type === type).length
  }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Star className="w-6 h-6 mx-auto text-yellow-500 mb-2" />
              <p className="text-2xl font-bold">{avgAccuracy}/5</p>
              <p className="text-xs text-gray-500">Avg Accuracy</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Badge className="mx-auto mb-2 bg-green-600">{helpfulRate}%</Badge>
              <p className="text-2xl font-bold">{helpfulCount}</p>
              <p className="text-xs text-gray-500">Helpful</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <MessageSquare className="w-6 h-6 mx-auto text-blue-500 mb-2" />
              <p className="text-2xl font-bold">{feedback.length}</p>
              <p className="text-xs text-gray-500">Total Feedback</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Rating Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={ratingDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="rating" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#6366f1" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Feedback by Type</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={feedbackByType}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ type, count }) => `${type}: ${count}`}
                  outerRadius={60}
                  fill="#8884d8"
                  dataKey="count"
                >
                  <Cell fill="#6366f1" />
                  <Cell fill="#8b5cf6" />
                  <Cell fill="#ec4899" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {feedback.filter(f => f.corrective_feedback).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Recent Feedback</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 max-h-48 overflow-y-auto">
            {feedback
              .filter(f => f.corrective_feedback)
              .slice(-5)
              .reverse()
              .map((f, idx) => (
                <div key={idx} className="p-2 bg-gray-50 rounded text-xs border-l-2 border-l-indigo-500">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold capitalize">{f.feedback_type}</span>
                    <span className="text-yellow-500">{'⭐'.repeat(f.accuracy_rating)}</span>
                  </div>
                  <p className="text-gray-600">{f.corrective_feedback}</p>
                </div>
              ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}