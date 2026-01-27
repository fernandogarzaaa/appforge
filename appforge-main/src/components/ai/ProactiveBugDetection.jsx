import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Bug, TrendingUp, Zap, CheckCircle2, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ProactiveBugDetection() {
  const [detectedBugs, setDetectedBugs] = useState([]);
  const [createdTickets, setCreatedTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [confidenceScore, setConfidenceScore] = useState(0);
  const [summary, setSummary] = useState('');

  const severityColors = {
    critical: 'bg-red-100 text-red-800 border-red-300',
    high: 'bg-orange-100 text-orange-800 border-orange-300',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    low: 'bg-blue-100 text-blue-800 border-blue-300'
  };

  const severityIcons = {
    critical: <AlertCircle className="w-4 h-4" />,
    high: <AlertTriangle className="w-4 h-4" />,
    medium: <TrendingUp className="w-4 h-4" />,
    low: <Bug className="w-4 h-4" />
  };

  const analyzeBugs = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await base44.functions.invoke('analyzeBugsProactively');
      
      if (response.data.bugs) {
        setDetectedBugs(response.data.bugs);
        setConfidenceScore(response.data.confidence_score || 0);
        setSummary(response.data.summary || '');
      }
    } catch (err) {
      setError(err.message || 'Failed to analyze bugs');
    } finally {
      setLoading(false);
    }
  };

  const createTickets = async () => {
    if (detectedBugs.length === 0) return;
    
    setLoading(true);
    try {
      const response = await base44.functions.invoke('createBugTickets', {
        bugs: detectedBugs
      });

      if (response.data.tickets) {
        setCreatedTickets(response.data.tickets);
      }
    } catch (err) {
      setError(err.message || 'Failed to create tickets');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Analysis Card */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-blue-600" />
            Proactive Bug Detection
          </CardTitle>
          <CardDescription>
            AI-powered analysis of logs, feedback, and crash reports
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={analyzeBugs} 
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {loading ? 'Analyzing...' : 'Run Bug Analysis'}
          </Button>
          
          {error && (
            <div className="p-3 bg-red-100 border border-red-300 text-red-800 rounded-lg text-sm">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confidence Score */}
      {confidenceScore > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Analysis Confidence</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all"
                    style={{ width: `${confidenceScore}%` }}
                  />
                </div>
              </div>
              <span className="text-lg font-bold text-gray-900">{Math.round(confidenceScore)}%</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      {summary && (
        <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
          <CardHeader>
            <CardTitle className="text-base">Analysis Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 leading-relaxed">{summary}</p>
          </CardContent>
        </Card>
      )}

      {/* Detected Bugs */}
      {detectedBugs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bug className="w-5 h-5" />
              Detected Bugs ({detectedBugs.length})
            </CardTitle>
            <CardDescription>
              Potential issues identified by AI analysis
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {detectedBugs.map((bug, idx) => (
              <div key={idx} className={cn(
                "p-4 rounded-lg border-2",
                severityColors[bug.severity] || severityColors.medium
              )}>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-start gap-3 flex-1">
                    {severityIcons[bug.severity]}
                    <div>
                      <h4 className="font-semibold">{bug.title}</h4>
                      <p className="text-sm opacity-90 mt-1">{bug.description}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="whitespace-nowrap">
                    P{bug.priority}
                  </Badge>
                </div>

                <div className="space-y-2 text-sm">
                  {bug.affected_components && (
                    <div>
                      <span className="font-medium">Components:</span> {bug.affected_components.join(', ')}
                    </div>
                  )}
                  <div>
                    <span className="font-medium">Detection Confidence:</span> {bug.likelihood}%
                  </div>
                  {bug.suggested_fix && (
                    <div>
                      <span className="font-medium">Suggested Fix:</span> {bug.suggested_fix}
                    </div>
                  )}
                </div>
              </div>
            ))}

            <Button 
              onClick={createTickets}
              disabled={loading || createdTickets.length > 0}
              className="w-full mt-4 bg-green-600 hover:bg-green-700"
            >
              {createdTickets.length > 0 ? 'Tickets Created' : 'Create Tickets for All Bugs'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Created Tickets */}
      {createdTickets.length > 0 && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-900">
              <CheckCircle2 className="w-5 h-5" />
              Tickets Created ({createdTickets.length})
            </CardTitle>
            <CardDescription className="text-green-700">
              Automatic tickets have been created and assigned for prioritization
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {createdTickets.map((ticket, idx) => (
                <div key={idx} className="p-3 bg-white rounded-lg border border-green-200 flex items-start justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{ticket.title}</p>
                    <p className="text-xs text-gray-500">ID: {ticket.ticket_id}</p>
                  </div>
                  <Badge className={cn(
                    "text-white",
                    ticket.severity === 'critical' && 'bg-red-600',
                    ticket.severity === 'high' && 'bg-orange-600',
                    ticket.severity === 'medium' && 'bg-yellow-600',
                    ticket.severity === 'low' && 'bg-blue-600'
                  )}>
                    {ticket.severity}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}