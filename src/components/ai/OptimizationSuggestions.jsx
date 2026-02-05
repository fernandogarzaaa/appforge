import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Zap, TrendingUp, Lightbulb, Loader2, Sparkles, 
  Database, Layers, Rocket, CheckCircle2 
} from 'lucide-react';
import { toast } from 'sonner';

export default function OptimizationSuggestions({ projectId }) {
  const [analyzing, setAnalyzing] = useState(false);
  const [suggestions, setSuggestions] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', label: 'All Suggestions', icon: Sparkles },
    { id: 'performance', label: 'Performance', icon: Zap },
    { id: 'architecture', label: 'Architecture', icon: Layers },
    { id: 'database', label: 'Database', icon: Database },
    { id: 'features', label: 'Features', icon: Rocket }
  ];

  const analyzeSuggestions = async () => {
    if (!projectId) {
      toast.error('Please select a project first');
      return;
    }

    setAnalyzing(true);
    try {
      // Fetch project data
      const [project, entities, pages, components] = await Promise.all([
        base44.entities.Project.filter({ id: projectId }).then(r => r[0]),
        base44.entities.Entity.filter({ project_id: projectId }),
        base44.entities.Page.filter({ project_id: projectId }),
        base44.entities.Component.filter({ project_id: projectId })
      ]);

      // AI-powered optimization analysis
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this application and suggest optimizations:

**Project:** ${project.name}
**Entities:** ${entities.map(e => e.name).join(', ')}
**Pages:** ${pages.map(p => p.name).join(', ')}
**Components:** ${components.map(c => c.name).join(', ')}

**Current Stack:**
- React + Tailwind CSS
- Base44 Backend (NoSQL)
- REST APIs

Provide comprehensive suggestions for:

1. **Performance Optimizations**
   - Code splitting strategies
   - Lazy loading opportunities
   - Caching strategies
   - Database query optimization
   - Asset optimization

2. **Architecture Improvements**
   - Component structure refactoring
   - State management patterns
   - API design enhancements
   - Scalability improvements

3. **Database Optimizations**
   - Schema improvements
   - Indexing strategies
   - Data normalization
   - Query efficiency

4. **Feature Enhancements**
   - Missing functionality
   - User experience improvements
   - Modern web capabilities (PWA, offline, etc.)
   - Integration opportunities

5. **Alternative Approaches**
   - Better libraries/tools
   - Design patterns
   - Workflow improvements

For each suggestion provide:
- Category
- Priority (high/medium/low)
- Title
- Description
- Impact (what it improves)
- Effort (easy/medium/hard)
- Implementation steps`,
        response_json_schema: {
          type: "object",
          properties: {
            overall_assessment: { type: "string" },
            optimizations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  category: { type: "string" },
                  priority: { type: "string" },
                  title: { type: "string" },
                  description: { type: "string" },
                  impact: { type: "string" },
                  effort: { type: "string" },
                  steps: { type: "array", items: { type: "string" } }
                }
              }
            }
          }
        }
      });

      setSuggestions(response);
      toast.success('Analysis complete!');
    } catch (error) {
      console.error('Optimization analysis error:', error);
      toast.error('Failed to analyze optimizations');
    } finally {
      setAnalyzing(false);
    }
  };

  const priorityConfig = {
    high: { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
    medium: { color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' },
    low: { color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' }
  };

  const effortConfig = {
    easy: { label: '⚡ Easy', color: 'text-green-700', bg: 'bg-green-50' },
    medium: { label: '⚙️ Medium', color: 'text-yellow-700', bg: 'bg-yellow-50' },
    hard: { label: '🔥 Hard', color: 'text-red-700', bg: 'bg-red-50' }
  };

  const filteredSuggestions = suggestions?.optimizations?.filter(s => 
    selectedCategory === 'all' || s.category.toLowerCase().includes(selectedCategory)
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle>Optimization & Alternative Approaches</CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  AI-powered suggestions to improve your application
                </p>
              </div>
            </div>
            <Badge className="bg-green-100 text-green-700">AI-Powered</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!suggestions ? (
            <div className="text-center py-12">
              <Lightbulb className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Get Optimization Suggestions
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                AI will analyze your app architecture, performance, database design, 
                and suggest improvements plus alternative approaches.
              </p>
              <Button
                onClick={analyzeSuggestions}
                disabled={analyzing || !projectId}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Analyze & Suggest
                  </>
                )}
              </Button>
            </div>
          ) : (
            <>
              {/* Overall Assessment */}
              <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-green-600" />
                    Overall Assessment
                  </h3>
                  <p className="text-gray-700">{suggestions.overall_assessment}</p>
                </CardContent>
              </Card>

              {/* Category Filter */}
              <div className="flex gap-2 flex-wrap">
                {categories.map(cat => {
                  const Icon = cat.icon;
                  return (
                    <Button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      variant={selectedCategory === cat.id ? 'default' : 'outline'}
                      size="sm"
                      className={selectedCategory === cat.id ? 'bg-green-600' : ''}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {cat.label}
                    </Button>
                  );
                })}
              </div>

              {/* Suggestions */}
              <div className="space-y-4">
                {filteredSuggestions?.map((opt, idx) => {
                  const pConfig = priorityConfig[opt.priority] || priorityConfig.medium;
                  const eConfig = effortConfig[opt.effort] || effortConfig.medium;

                  return (
                    <Card key={idx} className={`border-2 ${pConfig.border}`}>
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold text-gray-900">{opt.title}</h4>
                              <Badge className={`${pConfig.bg} ${pConfig.color} border-0 text-xs`}>
                                {opt.priority} priority
                              </Badge>
                            </div>
                            <Badge variant="outline" className="text-xs mb-3">
                              {opt.category}
                            </Badge>
                          </div>
                          <Badge className={`${eConfig.bg} ${eConfig.color} border-0`}>
                            {eConfig.label}
                          </Badge>
                        </div>

                        <p className="text-sm text-gray-700 mb-3">{opt.description}</p>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                          <div className="text-xs font-semibold text-blue-700 mb-1">
                            📈 Impact
                          </div>
                          <p className="text-sm text-gray-700">{opt.impact}</p>
                        </div>

                        {opt.steps?.length > 0 && (
                          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                            <div className="text-xs font-semibold text-gray-700 mb-2">
                              Implementation Steps
                            </div>
                            <ol className="text-sm text-gray-700 space-y-1">
                              {opt.steps.map((step, sidx) => (
                                <li key={sidx} className="flex items-start gap-2">
                                  <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                  <span>{step}</span>
                                </li>
                              ))}
                            </ol>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Actions */}
              <div className="flex justify-end">
                <Button onClick={analyzeSuggestions} variant="outline">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Refresh Analysis
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}