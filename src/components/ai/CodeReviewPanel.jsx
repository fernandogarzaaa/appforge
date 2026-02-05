import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Loader2, Shield, CheckCircle2, Zap, Code, 
  Bug, Lock, TrendingUp, AlertCircle 
} from 'lucide-react';

export default function CodeReviewPanel() {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [fileName, setFileName] = useState('');
  const [reviewing, setReviewing] = useState(false);
  const [review, setReview] = useState(null);

  const handleReview = async () => {
    if (!code.trim()) {
      alert('Please enter code to review');
      return;
    }

    setReviewing(true);
    try {
      const response = await base44.functions.invoke('reviewCode', {
        code,
        language,
        file_name: fileName,
        review_type: 'comprehensive'
      });

      setReview(response.data.review);
    } catch (error) {
      console.error('Review failed:', error);
      alert('Code review failed: ' + error.message);
    } finally {
      setReviewing(false);
    }
  };

  const getSeverityColor = (severity) => {
    const colors = {
      critical: 'bg-red-600',
      high: 'bg-orange-600',
      medium: 'bg-yellow-600',
      low: 'bg-blue-600'
    };
    return colors[severity] || 'bg-gray-600';
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            AI Code Review
          </CardTitle>
          <p className="text-sm text-gray-600">
            Comprehensive code analysis with bug detection, security scanning, and best practices
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">
                Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="javascript">JavaScript</option>
                <option value="typescript">TypeScript</option>
                <option value="python">Python</option>
                <option value="java">Java</option>
                <option value="go">Go</option>
                <option value="rust">Rust</option>
                <option value="cpp">C++</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">
                File Name (Optional)
              </label>
              <Input
                placeholder="e.g., app.js"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700 mb-2 block">
              Code to Review
            </label>
            <Textarea
              placeholder="Paste your code here..."
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="min-h-[300px] font-mono text-sm"
            />
          </div>

          <Button
            onClick={handleReview}
            disabled={reviewing || !code.trim()}
            className="w-full bg-gradient-to-r from-blue-600 to-cyan-600"
          >
            {reviewing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing Code...
              </>
            ) : (
              <>
                <Shield className="w-4 h-4 mr-2" />
                Run Code Review
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {review && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Review Results</CardTitle>
              <div className="flex gap-2">
                <Badge className={`${getSeverityColor('high')} text-white`}>
                  {review.language_detected}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Scores */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className={`text-3xl font-bold ${getScoreColor(review.overall_score)}`}>
                  {review.overall_score}
                </div>
                <div className="text-sm text-gray-600">Overall Score</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className={`text-3xl font-bold ${getScoreColor(review.complexity_score)}`}>
                  {review.complexity_score}
                </div>
                <div className="text-sm text-gray-600">Complexity</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className={`text-3xl font-bold ${getScoreColor(review.maintainability_score)}`}>
                  {review.maintainability_score}
                </div>
                <div className="text-sm text-gray-600">Maintainability</div>
              </div>
            </div>

            {/* Summary */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-gray-700">{review.summary}</p>
            </div>

            {/* Issues Tabs */}
            <Tabs defaultValue="critical">
              <TabsList className="grid grid-cols-5 w-full">
                <TabsTrigger value="critical">
                  Critical ({review.critical_issues?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="security">
                  Security ({review.security_issues?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="performance">
                  Performance ({review.performance_issues?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="quality">
                  Quality ({review.code_quality?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="improvements">
                  Improve ({review.improvements?.length || 0})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="critical" className="space-y-3 mt-4">
                {review.critical_issues?.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-green-600" />
                    No critical issues found!
                  </div>
                ) : (
                  review.critical_issues?.map((issue, idx) => (
                    <IssueCard key={idx} issue={issue} icon={Bug} />
                  ))
                )}
              </TabsContent>

              <TabsContent value="security" className="space-y-3 mt-4">
                {review.security_issues?.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Shield className="w-12 h-12 mx-auto mb-2 text-green-600" />
                    No security issues detected!
                  </div>
                ) : (
                  review.security_issues?.map((issue, idx) => (
                    <IssueCard key={idx} issue={issue} icon={Lock} />
                  ))
                )}
              </TabsContent>

              <TabsContent value="performance" className="space-y-3 mt-4">
                {review.performance_issues?.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Zap className="w-12 h-12 mx-auto mb-2 text-green-600" />
                    No performance issues found!
                  </div>
                ) : (
                  review.performance_issues?.map((issue, idx) => (
                    <IssueCard key={idx} issue={issue} icon={Zap} />
                  ))
                )}
              </TabsContent>

              <TabsContent value="quality" className="space-y-3 mt-4">
                {review.code_quality?.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-green-600" />
                    Code quality looks great!
                  </div>
                ) : (
                  review.code_quality?.map((issue, idx) => (
                    <IssueCard key={idx} issue={issue} icon={Code} />
                  ))
                )}
              </TabsContent>

              <TabsContent value="improvements" className="space-y-3 mt-4">
                {review.improvements?.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No suggestions at this time
                  </div>
                ) : (
                  review.improvements?.map((issue, idx) => (
                    <IssueCard key={idx} issue={issue} icon={TrendingUp} />
                  ))
                )}
              </TabsContent>
            </Tabs>

            {/* Best Practices */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <h4 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Followed Best Practices
                </h4>
                <ul className="space-y-1">
                  {review.best_practices?.followed?.map((practice, idx) => (
                    <li key={idx} className="text-sm text-green-800">• {practice}</li>
                  ))}
                </ul>
              </div>
              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <h4 className="font-semibold text-red-900 mb-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Violated Best Practices
                </h4>
                <ul className="space-y-1">
                  {review.best_practices?.violated?.map((practice, idx) => (
                    <li key={idx} className="text-sm text-red-800">• {practice}</li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function IssueCard({ issue, icon: Icon }) {
  const getSeverityColor = (severity) => {
    const colors = {
      critical: 'border-red-500 bg-red-50',
      high: 'border-orange-500 bg-orange-50',
      medium: 'border-yellow-500 bg-yellow-50',
      low: 'border-blue-500 bg-blue-50'
    };
    return colors[severity] || 'border-gray-500 bg-gray-50';
  };

  return (
    <div className={`p-4 rounded-lg border-l-4 ${getSeverityColor(issue.severity)}`}>
      <div className="flex items-start gap-3">
        <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <h4 className="font-semibold text-gray-900">{issue.title}</h4>
            <Badge variant="outline" className="text-xs">
              {issue.severity}
            </Badge>
          </div>
          {issue.line && (
            <Badge variant="outline" className="text-xs mb-2">
              Line {issue.line}
            </Badge>
          )}
          <p className="text-sm text-gray-700 mb-2">{issue.description}</p>
          <div className="mt-3 p-3 bg-white rounded border">
            <p className="text-xs font-semibold text-gray-700 mb-1">💡 Fix:</p>
            <p className="text-sm text-gray-800">{issue.fix}</p>
            {issue.code_example && (
              <pre className="mt-2 text-xs bg-gray-900 text-gray-100 p-2 rounded overflow-auto">
                {issue.code_example}
              </pre>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}