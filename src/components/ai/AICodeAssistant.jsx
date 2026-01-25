import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Code, Bug, RefreshCw, Zap, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

export default function AICodeAssistant({ code, language = 'javascript', onCodeUpdate }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [suggestion, setSuggestion] = useState(null);
  const [copied, setCopied] = useState(false);

  const explainCode = async () => {
    setIsProcessing(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Explain this ${language} code in simple terms:
        
        \`\`\`${language}
        ${code}
        \`\`\`
        
        Provide:
        - simple_explanation: easy-to-understand explanation
        - key_concepts: array of main concepts used
        - complexity: (beginner, intermediate, advanced)`,
        response_json_schema: {
          type: 'object',
          properties: {
            simple_explanation: { type: 'string' },
            key_concepts: { type: 'array', items: { type: 'string' } },
            complexity: { type: 'string' }
          }
        }
      });
      
      setSuggestion({ type: 'explanation', ...result });
      toast.success('Code explained!');
    } catch (error) {
      toast.error('Failed to explain code');
    } finally {
      setIsProcessing(false);
    }
  };

  const improveCode = async () => {
    setIsProcessing(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Improve this ${language} code for better performance and readability:
        
        \`\`\`${language}
        ${code}
        \`\`\`
        
        Provide:
        - improved_code: the optimized code
        - improvements: array of what was improved
        - performance_gain: estimated performance improvement`,
        response_json_schema: {
          type: 'object',
          properties: {
            improved_code: { type: 'string' },
            improvements: { type: 'array', items: { type: 'string' } },
            performance_gain: { type: 'string' }
          }
        }
      });
      
      setSuggestion({ type: 'improvement', ...result });
      toast.success('Code improved!');
    } catch (error) {
      toast.error('Failed to improve code');
    } finally {
      setIsProcessing(false);
    }
  };

  const findBugs = async () => {
    setIsProcessing(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this ${language} code for potential bugs and issues:
        
        \`\`\`${language}
        ${code}
        \`\`\`
        
        Provide:
        - bugs_found: array of potential bugs with descriptions
        - severity: (low, medium, high, critical)
        - fixed_code: code with bugs fixed`,
        response_json_schema: {
          type: 'object',
          properties: {
            bugs_found: { type: 'array', items: { type: 'string' } },
            severity: { type: 'string' },
            fixed_code: { type: 'string' }
          }
        }
      });
      
      setSuggestion({ type: 'bugs', ...result });
      if (result.bugs_found.length === 0) {
        toast.success('No bugs found!');
      } else {
        toast.warning(`Found ${result.bugs_found.length} potential issues`);
      }
    } catch (error) {
      toast.error('Failed to analyze code');
    } finally {
      setIsProcessing(false);
    }
  };

  const generateTests = async () => {
    setIsProcessing(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate unit tests for this ${language} code:
        
        \`\`\`${language}
        ${code}
        \`\`\`
        
        Provide:
        - test_code: complete test code
        - test_framework: which framework to use
        - coverage: array of what's tested`,
        response_json_schema: {
          type: 'object',
          properties: {
            test_code: { type: 'string' },
            test_framework: { type: 'string' },
            coverage: { type: 'array', items: { type: 'string' } }
          }
        }
      });
      
      setSuggestion({ type: 'tests', ...result });
      toast.success('Tests generated!');
    } catch (error) {
      toast.error('Failed to generate tests');
    } finally {
      setIsProcessing(false);
    }
  };

  const copyCode = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="w-5 h-5 text-purple-600" />
            AI Code Assistant
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={explainCode}
              disabled={isProcessing || !code}
              variant="outline"
              size="sm"
            >
              <Code className="w-3 h-3 mr-1" />
              Explain
            </Button>
            <Button
              onClick={improveCode}
              disabled={isProcessing || !code}
              variant="outline"
              size="sm"
            >
              <Zap className="w-3 h-3 mr-1" />
              Optimize
            </Button>
            <Button
              onClick={findBugs}
              disabled={isProcessing || !code}
              variant="outline"
              size="sm"
            >
              <Bug className="w-3 h-3 mr-1" />
              Find Bugs
            </Button>
            <Button
              onClick={generateTests}
              disabled={isProcessing || !code}
              variant="outline"
              size="sm"
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Gen Tests
            </Button>
          </div>
        </CardContent>
      </Card>

      {suggestion && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                {suggestion.type === 'explanation' && 'Code Explanation'}
                {suggestion.type === 'improvement' && 'Code Improvements'}
                {suggestion.type === 'bugs' && 'Bug Analysis'}
                {suggestion.type === 'tests' && 'Generated Tests'}
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSuggestion(null)}
              >
                ✕
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {suggestion.type === 'explanation' && (
              <>
                <p className="text-sm text-gray-700">{suggestion.simple_explanation}</p>
                <div>
                  <p className="text-xs font-medium mb-2">Key Concepts:</p>
                  <div className="flex flex-wrap gap-1">
                    {suggestion.key_concepts?.map((concept, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {concept}
                      </Badge>
                    ))}
                  </div>
                </div>
                <Badge>{suggestion.complexity}</Badge>
              </>
            )}

            {suggestion.type === 'improvement' && (
              <>
                <div>
                  <p className="text-xs font-medium mb-2">Improvements:</p>
                  <ul className="text-sm space-y-1">
                    {suggestion.improvements?.map((imp, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-green-600">✓</span>
                        <span>{imp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <Badge variant="outline" className="bg-green-50 text-green-700">
                  {suggestion.performance_gain}
                </Badge>
                {suggestion.improved_code && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-medium">Optimized Code:</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          copyCode(suggestion.improved_code);
                          if (onCodeUpdate) onCodeUpdate(suggestion.improved_code);
                        }}
                      >
                        {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      </Button>
                    </div>
                    <pre className="bg-gray-900 text-gray-100 p-3 rounded text-xs overflow-x-auto">
                      {suggestion.improved_code}
                    </pre>
                  </div>
                )}
              </>
            )}

            {suggestion.type === 'bugs' && (
              <>
                {suggestion.bugs_found?.length > 0 ? (
                  <>
                    <div>
                      <p className="text-xs font-medium mb-2">Issues Found:</p>
                      <ul className="text-sm space-y-1">
                        {suggestion.bugs_found.map((bug, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-red-600">⚠</span>
                            <span>{bug}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <Badge variant="outline" className={
                      suggestion.severity === 'critical' ? 'bg-red-50 text-red-700' :
                      suggestion.severity === 'high' ? 'bg-orange-50 text-orange-700' :
                      'bg-yellow-50 text-yellow-700'
                    }>
                      Severity: {suggestion.severity}
                    </Badge>
                  </>
                ) : (
                  <p className="text-sm text-green-600">✓ No bugs found!</p>
                )}
                {suggestion.fixed_code && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-medium">Fixed Code:</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          copyCode(suggestion.fixed_code);
                          if (onCodeUpdate) onCodeUpdate(suggestion.fixed_code);
                        }}
                      >
                        {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      </Button>
                    </div>
                    <pre className="bg-gray-900 text-gray-100 p-3 rounded text-xs overflow-x-auto">
                      {suggestion.fixed_code}
                    </pre>
                  </div>
                )}
              </>
            )}

            {suggestion.type === 'tests' && (
              <>
                <Badge variant="outline">{suggestion.test_framework}</Badge>
                <div>
                  <p className="text-xs font-medium mb-2">Test Coverage:</p>
                  <ul className="text-sm space-y-1">
                    {suggestion.coverage?.map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-blue-600">✓</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                {suggestion.test_code && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-medium">Test Code:</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyCode(suggestion.test_code)}
                      >
                        {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      </Button>
                    </div>
                    <pre className="bg-gray-900 text-gray-100 p-3 rounded text-xs overflow-x-auto">
                      {suggestion.test_code}
                    </pre>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}