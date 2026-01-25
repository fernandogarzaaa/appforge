import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Zap, Bug, Lightbulb, Code, CheckCircle2, AlertTriangle, Loader2, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ProjectAuditorEnhanced() {
  const [errors, setErrors] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [autoFixing, setAutoFixing] = useState(false);
  const [stats, setStats] = useState(null);

  const severityColors = {
    critical: 'bg-red-100 text-red-800 border-red-300',
    high: 'bg-orange-100 text-orange-800 border-orange-300',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    low: 'bg-blue-100 text-blue-800 border-blue-300'
  };

  const detectErrors = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('detectRealTimeErrors');
      if (response.data.errors) {
        setErrors(response.data.errors);
        setStats({
          total_issues: response.data.total_issues,
          critical: response.data.errors.filter(e => e.severity === 'critical').length,
          high: response.data.errors.filter(e => e.severity === 'high').length
        });
      }
    } catch (err) {
      console.error('Error detecting errors:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateSuggestions = async () => {
    setLoading(true);
    try {
      // This would typically take code/context, for now we'll get general suggestions
      const response = await base44.functions.invoke('suggestCodeImprovements', {
        code: errors.map(e => e.message).join('\n'),
        context: 'Real-time error detection and project auditing',
        entity_type: 'project_audit'
      });
      if (response.data.suggestions) {
        setSuggestions(response.data.suggestions);
      }
    } catch (err) {
      console.error('Error generating suggestions:', err);
    } finally {
      setLoading(false);
    }
  };

  const autoFixErrors = async () => {
    setAutoFixing(true);
    try {
      const response = await base44.functions.invoke('autoFixCodeErrors', {
        errors: errors.filter(e => e.fixable),
        auto_apply: true
      });
      
      if (response.data.fixed > 0) {
        // Remove fixed errors from display
        setErrors(errors.filter(e => !response.data.fixes.find(f => f.error_id === e.id && f.status === 'fixed')));
      }
    } catch (err) {
      console.error('Error auto-fixing:', err);
    } finally {
      setAutoFixing(false);
    }
  };

  useEffect(() => {
    detectErrors();
  }, []);

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600">{stats.critical}</div>
                <p className="text-sm text-gray-600">Critical Issues</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600">{stats.high}</div>
                <p className="text-sm text-gray-600">High Priority</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{stats.total_issues}</div>
                <p className="text-sm text-gray-600">Total Issues</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Controls */}
      <div className="flex gap-2">
        <Button 
          onClick={detectErrors}
          disabled={loading}
          variant="outline"
          className="flex items-center gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Scan Errors
        </Button>
        <Button 
          onClick={generateSuggestions}
          disabled={loading || errors.length === 0}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Lightbulb className="w-4 h-4" />
          Generate Suggestions
        </Button>
        <Button 
          onClick={autoFixErrors}
          disabled={autoFixing || errors.filter(e => e.fixable).length === 0}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
        >
          {autoFixing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
          Auto-Fix {errors.filter(e => e.fixable).length} Issues
        </Button>
      </div>

      {/* Real-Time Errors */}
      {errors.length > 0 && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              Real-Time Errors ({errors.length})
            </CardTitle>
            <CardDescription>Detected issues requiring attention</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {errors.map((error, idx) => (
              <div key={idx} className={cn(
                "p-4 rounded-lg border-2",
                severityColors[error.severity]
              )}>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1">
                    <p className="font-semibold">{error.message}</p>
                    <p className="text-xs opacity-75 mt-1">
                      {error.entity} {error.name ? `- ${error.name}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {error.fixable && (
                      <Badge className="bg-green-600 text-white">Auto-fixable</Badge>
                    )}
                    <Badge variant="outline" className="capitalize">
                      {error.severity}
                    </Badge>
                  </div>
                </div>
                
                {error.suggested_fix && (
                  <div className="bg-white bg-opacity-50 p-2 rounded text-sm border-l-2 border-current mt-2">
                    <span className="font-medium">Fix: </span>{error.suggested_fix}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Suggestions */}
      {suggestions?.suggestions && suggestions.suggestions.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-blue-600" />
              Code Improvement Suggestions ({suggestions.suggestions.length})
            </CardTitle>
            <CardDescription>{suggestions.summary}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {suggestions.suggestions.map((suggestion, idx) => (
              <div key={idx} className="p-4 border rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold">{suggestion.title}</h4>
                  <Badge>{suggestion.area}</Badge>
                </div>
                <p className="text-sm text-gray-700 mb-3">{suggestion.description}</p>
                
                {suggestion.current_code && (
                  <div className="bg-gray-100 p-3 rounded mb-2 font-mono text-xs overflow-x-auto">
                    <p className="text-gray-600 mb-1">Current:</p>
                    <pre>{suggestion.current_code}</pre>
                  </div>
                )}
                
                {suggestion.suggested_code && (
                  <div className="bg-green-50 p-3 rounded mb-2 font-mono text-xs overflow-x-auto border border-green-200">
                    <p className="text-green-700 font-medium mb-1">Suggested:</p>
                    <pre>{suggestion.suggested_code}</pre>
                  </div>
                )}
                
                {suggestion.benefit && (
                  <p className="text-xs text-gray-600">
                    <span className="font-medium">Benefit:</span> {suggestion.benefit}
                  </p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {errors.length === 0 && !loading && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-3" />
              <p className="text-lg font-semibold text-green-900">No Errors Detected</p>
              <p className="text-sm text-green-700 mt-1">Your project is healthy!</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}