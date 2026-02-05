import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle2, XCircle, AlertTriangle, Info, Loader2, 
  Code, FileCode, RefreshCw, Sparkles, TrendingUp, Shield
} from 'lucide-react';
import { toast } from 'sonner';

export default function CodeReviewSuggestions({ projectId }) {
  const [reviewing, setReviewing] = useState(false);
  const [review, setReview] = useState(null);

  const severityConfig = {
    critical: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
    high: { icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
    medium: { icon: Info, color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' },
    low: { icon: CheckCircle2, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' }
  };

  const reviewCode = async () => {
    if (!projectId) {
      toast.error('Please select a project first');
      return;
    }

    setReviewing(true);
    try {
      // Fetch project files
      const [pages, components, entities] = await Promise.all([
        base44.entities.Page.filter({ project_id: projectId }),
        base44.entities.Component.filter({ project_id: projectId }),
        base44.entities.Entity.filter({ project_id: projectId })
      ]);

      // Prepare code samples for review
      const codeStructure = {
        pages: pages.map(p => ({ name: p.name, path: p.path, content: p.content })),
        components: components.map(c => ({ name: c.name, code: c.code })),
        entities: entities.map(e => ({ name: e.name, schema: e.schema }))
      };

      // AI code review
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Perform a comprehensive code review of this application:

**Project Structure:**
- ${pages.length} pages
- ${components.length} components
- ${entities.length} entities

**Sample Code:**
${JSON.stringify(codeStructure, null, 2).substring(0, 3000)}

Analyze and provide:
1. **Security Issues** (XSS, SQL injection risks, auth vulnerabilities)
2. **Performance Issues** (N+1 queries, memory leaks, inefficient algorithms)
3. **Code Quality** (naming, structure, maintainability)
4. **Best Practices** (React patterns, error handling, testing)
5. **Accessibility** (ARIA labels, keyboard navigation, contrast)

For each issue, provide:
- Severity (critical/high/medium/low)
- Description
- Location (file/component)
- Suggestion (specific fix)
- Example code (if applicable)`,
        response_json_schema: {
          type: "object",
          properties: {
            overall_score: { type: "number" },
            summary: { type: "string" },
            issues: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  severity: { type: "string" },
                  category: { type: "string" },
                  title: { type: "string" },
                  description: { type: "string" },
                  location: { type: "string" },
                  suggestion: { type: "string" },
                  example: { type: "string" }
                }
              }
            },
            strengths: { type: "array", items: { type: "string" } },
            recommendations: { type: "array", items: { type: "string" } }
          }
        }
      });

      setReview(response);
      toast.success('Code review completed!');
    } catch (error) {
      console.error('Code review error:', error);
      toast.error('Failed to review code');
    } finally {
      setReviewing(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                <Code className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle>AI Code Review</CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Get intelligent suggestions to improve your code
                </p>
              </div>
            </div>
            <Badge className="bg-purple-100 text-purple-700">AI-Powered</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!review ? (
            <div className="text-center py-12">
              <Sparkles className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                AI Code Review
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Get instant feedback on security, performance, code quality, 
                best practices, and accessibility issues in your codebase.
              </p>
              <Button
                onClick={reviewCode}
                disabled={reviewing || !projectId}
                className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
              >
                {reviewing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Reviewing Code...
                  </>
                ) : (
                  <>
                    <Code className="w-4 h-4 mr-2" />
                    Start Code Review
                  </>
                )}
              </Button>
            </div>
          ) : (
            <>
              {/* Overall Score */}
              <Card className="bg-gradient-to-r from-purple-50 to-pink-50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Overall Code Quality</div>
                      <div className="text-4xl font-bold text-gray-900">
                        {review.overall_score}/100
                      </div>
                    </div>
                    <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center">
                      <TrendingUp className={`w-10 h-10 ${
                        review.overall_score >= 80 ? 'text-green-600' :
                        review.overall_score >= 60 ? 'text-yellow-600' :
                        'text-red-600'
                      }`} />
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 mt-3">{review.summary}</p>
                </CardContent>
              </Card>

              {/* Strengths */}
              {review.strengths?.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-green-700 flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5" />
                      Strengths
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {review.strengths.map((strength, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                          <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                          {strength}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Issues by Severity */}
              <div className="space-y-3">
                {review.issues?.map((issue, idx) => {
                  const config = severityConfig[issue.severity] || severityConfig.medium;
                  const Icon = config.icon;

                  return (
                    <Card key={idx} className={`border-2 ${config.border}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-lg ${config.bg} flex items-center justify-center flex-shrink-0`}>
                            <Icon className={`w-5 h-5 ${config.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold text-gray-900">{issue.title}</h4>
                              <Badge className={`${config.bg} ${config.color} border-0`}>
                                {issue.severity}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {issue.category}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{issue.description}</p>
                            {issue.location && (
                              <div className="text-xs text-gray-500 mb-2">
                                📍 {issue.location}
                              </div>
                            )}
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
                              <div className="text-xs font-semibold text-blue-700 mb-1">
                                💡 Suggestion
                              </div>
                              <p className="text-sm text-gray-700">{issue.suggestion}</p>
                              {issue.example && (
                                <pre className="mt-2 text-xs bg-gray-900 text-gray-100 p-2 rounded overflow-x-auto">
                                  {issue.example}
                                </pre>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Recommendations */}
              {review.recommendations?.length > 0 && (
                <Card className="border-2 border-indigo-200 bg-indigo-50">
                  <CardHeader>
                    <CardTitle className="text-indigo-700 flex items-center gap-2">
                      <Shield className="w-5 h-5" />
                      Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {review.recommendations.map((rec, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                          <TrendingUp className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Actions */}
              <div className="flex justify-end">
                <Button onClick={reviewCode} variant="outline">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Run Again
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}