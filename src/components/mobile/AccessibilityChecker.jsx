import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, CheckCircle, AlertTriangle, XCircle, RefreshCw, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AccessibilityChecker({ app }) {
  const [issues, setIssues] = useState([]);
  const [score, setScore] = useState(null);
  const [loading, setLoading] = useState(false);

  const checkAccessibility = async () => {
    setLoading(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Perform comprehensive accessibility audit on this mobile app:

App Configuration:
${JSON.stringify(app, null, 2)}

Check for:
1. Color contrast ratios (WCAG AA standards - 4.5:1 for normal text, 3:1 for large text)
2. Touch target sizes (minimum 44x44 points)
3. Text readability and font sizes
4. Screen reader compatibility
5. Keyboard navigation support
6. Focus indicators
7. Alt text for images
8. Semantic structure
9. Error messaging clarity
10. Platform-specific accessibility features

Provide:
- Overall accessibility score (0-100)
- List of specific issues with severity (critical, warning, info)
- Recommendations for fixes

Return as JSON: {
  "score": 85,
  "issues": [
    {"severity": "critical|warning|info", "category": "...", "message": "...", "fix": "..."}
  ],
  "summary": "..."
}`,
        response_json_schema: {
          type: "object",
          properties: {
            score: { type: "number" },
            issues: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  severity: { type: "string" },
                  category: { type: "string" },
                  message: { type: "string" },
                  fix: { type: "string" }
                }
              }
            },
            summary: { type: "string" }
          }
        }
      });

      setScore(response.score || 0);
      setIssues(response.issues || []);
      toast.success('Accessibility audit complete!');
    } catch (error) {
      toast.error('Failed to run accessibility check');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAccessibility();
  }, []);

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      default:
        return <CheckCircle className="w-5 h-5 text-blue-500" />;
    }
  };

  const severityColors = {
    critical: 'border-red-300 bg-red-50',
    warning: 'border-yellow-300 bg-yellow-50',
    info: 'border-blue-300 bg-blue-50'
  };

  return (
    <div className="space-y-6">
      {/* Score Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-600" />
              Accessibility Score
            </CardTitle>
            <Button onClick={checkAccessibility} disabled={loading} variant="outline" size="sm">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {score !== null ? (
            <div className="flex items-center gap-6">
              <div className="relative w-32 h-32">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle cx="64" cy="64" r="56" stroke="#e5e7eb" strokeWidth="8" fill="none" />
                  <circle
                    cx="64" cy="64" r="56"
                    stroke={score >= 90 ? '#10b981' : score >= 70 ? '#f59e0b' : '#ef4444'}
                    strokeWidth="8" fill="none"
                    strokeDasharray={`${2 * Math.PI * 56}`}
                    strokeDashoffset={`${2 * Math.PI * 56 * (1 - score / 100)}`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-3xl font-bold">{score}</span>
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-1">
                  {score >= 90 ? 'Excellent' : score >= 70 ? 'Good' : score >= 50 ? 'Fair' : 'Needs Improvement'}
                </h3>
                <p className="text-sm text-gray-600">
                  {issues.filter(i => i.severity === 'critical').length} critical issues found
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-500" />
              <p className="text-sm text-gray-500">Running accessibility audit...</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Issues List */}
      {issues.length > 0 && (
        <div className="space-y-3">
          {issues.map((issue, idx) => (
            <Card key={idx} className={`border-2 ${severityColors[issue.severity]}`}>
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  {getSeverityIcon(issue.severity)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold">{issue.message}</h4>
                      <Badge variant="outline" className="capitalize">
                        {issue.category}
                      </Badge>
                    </div>
                    <div className="bg-white bg-opacity-60 p-3 rounded border-l-2 border-current">
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Fix: </span>
                        {issue.fix}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {issues.length === 0 && score !== null && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="py-12 text-center">
            <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-600" />
            <h3 className="text-xl font-bold text-green-900 mb-2">Perfect Accessibility!</h3>
            <p className="text-green-700">No accessibility issues detected in your app</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}