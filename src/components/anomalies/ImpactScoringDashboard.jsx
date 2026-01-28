import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AlertTriangle, Users, Clock } from 'lucide-react';

export default function ImpactScoringDashboard() {
  const { data: impactScores } = useQuery({
    queryKey: ['anomaly-impact-scores'],
    queryFn: () => base44.entities.AnomalyImpactScore.list('-overall_impact_score', 20)
  });

  if (!impactScores || impactScores.length === 0) {
    return <div className="p-4 text-slate-600">No impact scores calculated</div>;
  }

  // Top anomalies by impact
  const topAnomalies = impactScores.slice(0, 10);
  const criticalImpact = impactScores.filter(s => s.overall_impact_score > 80);

  // Chart data
  const impactData = topAnomalies.map((score, idx) => ({
    rank: `#${score.priority_rank || idx + 1}`,
    score: score.overall_impact_score,
    business: score.business_impact_score,
    customer: score.customer_impact_score
  }));

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-slate-600">Analyzed</p>
            <p className="text-2xl font-bold">{impactScores.length}</p>
          </CardContent>
        </Card>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-4">
            <p className="text-xs text-red-600">Critical Impact</p>
            <p className="text-2xl font-bold text-red-700">{criticalImpact.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-slate-600">Avg Impact</p>
            <p className="text-2xl font-bold">
              {Math.round(impactScores.reduce((sum, s) => sum + s.overall_impact_score, 0) / impactScores.length)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-slate-600">Avg Customers</p>
            <p className="text-2xl font-bold">
              {Math.round(impactScores.reduce((sum, s) => sum + (s.affected_customer_count || 0), 0) / impactScores.length).toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Impact Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Impact Comparison (Top 10)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={impactData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="rank" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="score" fill="#8b5cf6" name="Overall" />
              <Bar dataKey="business" fill="#3b82f6" name="Business" />
              <Bar dataKey="customer" fill="#10b981" name="Customer" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top Priority Anomalies */}
      <div className="space-y-2">
        <h3 className="font-semibold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          Top Priority Anomalies
        </h3>
        {topAnomalies.slice(0, 5).map((score, idx) => (
          <Card key={score.id} className="border-l-4 border-l-purple-500">
            <CardContent className="pt-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-semibold">#{score.priority_rank || idx + 1}</p>
                </div>
                <Badge className="bg-purple-600">{score.overall_impact_score} pts</Badge>
              </div>

              <div className="grid grid-cols-4 gap-2 text-xs mt-3">
                <div className="p-2 bg-slate-50 rounded">
                  <p className="text-slate-600">Business</p>
                  <p className="font-bold text-blue-600">{score.business_impact_score}</p>
                </div>
                <div className="p-2 bg-slate-50 rounded">
                  <p className="text-slate-600">Customer</p>
                  <p className="font-bold text-green-600">{score.customer_impact_score}</p>
                </div>
                <div className="p-2 bg-slate-50 rounded">
                  <p className="text-slate-600">Urgency</p>
                  <p className="font-bold text-orange-600">{score.urgency_score}</p>
                </div>
                <div className="p-2 bg-slate-50 rounded">
                  <p className="text-slate-600">Blast Radius</p>
                  <p className="font-bold">{score.blast_radius}</p>
                </div>
              </div>

              <div className="mt-3 text-xs text-slate-600 space-y-1">
                {score.affected_customer_count && (
                  <p className="flex items-center gap-1">
                    <Users className="w-3 h-3" /> {score.affected_customer_count.toLocaleString()} customers affected
                  </p>
                )}
                {score.time_to_critical && (
                  <p className="flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Critical in {score.time_to_critical} minutes
                  </p>
                )}
                {score.estimated_cost_per_minute && (
                  <p className="font-semibold">
                    Cost: ${score.estimated_cost_per_minute.toFixed(2)}/min
                  </p>
                )}
                {score.intervention_effectiveness && (
                  <p className="text-green-600 font-semibold">
                    Intervention could reduce by {score.intervention_effectiveness}%
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}