import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, Lightbulb, Code, Loader2, Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const LANGUAGES = [
  'javascript', 'typescript', 'python', 'java', 'cpp', 'csharp', 'php', 'ruby',
  'go', 'rust', 'kotlin', 'swift', 'sql', 'html', 'css', 'jsx', 'tsx'
];

export default function CodeReviewPanel() {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [filename, setFilename] = useState('');
  const [loading, setLoading] = useState(false);
  const [review, setReview] = useState(null);
  const [error, setError] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const severityColors = {
    critical: 'bg-red-100 text-red-800 border-red-300',
    high: 'bg-orange-100 text-orange-800 border-orange-300',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    low: 'bg-blue-100 text-blue-800 border-blue-300'
  };

  const severityIcons = {
    critical: <AlertCircle className="w-4 h-4" />,
    high: <AlertCircle className="w-4 h-4" />,
    medium: <Lightbulb className="w-4 h-4" />,
    low: <Lightbulb className="w-4 h-4" />
  };

  const categoryEmoji = {
    'best-practice': '📝',
    'bug': '🐛',
    'performance': '⚡',
    'security': '🔒',
    'quality': '✨'
  };

  const performReview = async () => {
    if (!code.trim()) {
      setError('Please paste or enter some code to review');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await base44.functions.invoke('aiCodeReview', {
        code,
        language,
        filename: filename || 'untitled'
      });

      if (response.data.review) {
        setReview(response.data.review);
      }
    } catch (err) {
      setError(err.message || 'Failed to perform code review');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Input Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="w-5 h-5" />
            Code Review
          </CardTitle>
          <CardDescription>
            Paste your code and get AI-powered feedback on best practices, bugs, performance, and security
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Language</label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map(lang => (
                    <SelectItem key={lang} value={lang}>
                      {lang.charAt(0).toUpperCase() + lang.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Filename (optional)</label>
              <input
                type="text"
                placeholder="e.g., app.js"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Code to Review</label>
            <Textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Paste your code here..."
              className="font-mono text-sm h-48"
            />
          </div>

          <Button 
            onClick={performReview}
            disabled={loading || !code.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Reviewing...
              </>
            ) : (
              'Perform Code Review'
            )}
          </Button>

          {error && (
            <div className="p-3 bg-red-100 border border-red-300 text-red-800 rounded-lg text-sm">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review Results */}
      {review && (
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg">Review Results</CardTitle>
                <CardDescription>{filename || 'untitled'} • {language}</CardDescription>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-gray-900">{review.overall_score}</div>
                <p className="text-xs text-gray-500">Overall Score</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Summary */}
            {review.summary && (
              <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Summary</h3>
                <p className="text-gray-700 text-sm leading-relaxed">{review.summary}</p>
              </div>
            )}

            {/* Score Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Code Quality</span>
                <span className={cn(
                  "font-medium",
                  review.overall_score >= 80 ? 'text-green-600' : review.overall_score >= 60 ? 'text-yellow-600' : 'text-red-600'
                )}>
                  {review.overall_score}/100
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={cn(
                    "h-2 rounded-full transition-all",
                    review.overall_score >= 80 ? 'bg-green-500' : review.overall_score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                  )}
                  style={{ width: `${review.overall_score}%` }}
                />
              </div>
            </div>

            {/* Strengths */}
            {review.strengths && review.strengths.length > 0 && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Strengths
                </h3>
                <ul className="space-y-2">
                  {review.strengths.map((strength, idx) => (
                    <li key={idx} className="text-sm text-green-800 flex items-start gap-2">
                      <span className="text-green-600 mt-1">✓</span>
                      <span>{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Issues */}
            {review.issues && review.issues.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900">Issues Found ({review.issues.length})</h3>
                {review.issues.map((issue, idx) => (
                  <div key={idx} className={cn(
                    "p-4 rounded-lg border-2",
                    severityColors[issue.severity] || severityColors.medium
                  )}>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-start gap-3 flex-1">
                        {severityIcons[issue.severity]}
                        <div>
                          <p className="font-semibold">{categoryEmoji[issue.category]} {issue.title}</p>
                          {issue.line && <p className="text-xs opacity-75">Line {issue.line}</p>}
                        </div>
                      </div>
                      <Badge variant="outline" className="whitespace-nowrap capitalize text-xs">
                        {issue.severity}
                      </Badge>
                    </div>

                    <p className="text-sm mb-3">{issue.description}</p>

                    {issue.suggestion && (
                      <div className="bg-white bg-opacity-50 p-3 rounded border-l-2 border-current mb-3">
                        <p className="text-xs font-medium mb-1">Suggestion:</p>
                        <p className="text-sm">{issue.suggestion}</p>
                      </div>
                    )}

                    {issue.code_example && (
                      <div className="bg-gray-900 text-gray-100 p-3 rounded font-mono text-xs overflow-x-auto mb-3 relative">
                        <pre>{issue.code_example}</pre>
                        <button
                          onClick={() => copyToClipboard(issue.code_example, `code-${idx}`)}
                          className="absolute top-2 right-2 p-2 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
                          title="Copy code"
                        >
                          {copiedId === `code-${idx}` ? (
                            <Check className="w-4 h-4 text-green-400" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Improvements */}
            {review.improvements && review.improvements.length > 0 && (
              <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <h3 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4" />
                  Recommended Improvements
                </h3>
                <ul className="space-y-2">
                  {review.improvements.map((improvement, idx) => (
                    <li key={idx} className="text-sm text-purple-800 flex items-start gap-2">
                      <span className="text-purple-600 mt-1">→</span>
                      <span>{improvement}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}