import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Brain, TrendingUp, Star, Clock, Zap, Target,
  Sparkles, ArrowRight, Loader2, BarChart3
} from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function PersonalizationEngine({ user }) {
  const [preferences, setPreferences] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [insights, setInsights] = useState(null);

  useEffect(() => {
    if (user?.email) {
      loadUserPreferences();
    }
  }, [user]);

  const loadUserPreferences = async () => {
    const prefs = await base44.entities.UserPreference.filter({ user_email: user.email });
    if (prefs.length > 0) {
      setPreferences(prefs[0]);
      setInsights(prefs[0].ai_insights);
      setRecommendations(prefs[0].ai_insights?.recommendations || []);
    } else {
      // Create initial preference record
      const newPref = await base44.entities.UserPreference.create({
        user_email: user.email,
        preferences: {
          theme: 'light',
          favorite_templates: [],
          preferred_features: []
        },
        behavior_data: {
          pages_visited: [],
          features_used: [],
          search_history: [],
          time_spent: {},
          clicks: []
        }
      });
      setPreferences(newPref);
    }
  };

  const trackBehavior = async (action, data) => {
    if (!preferences) return;

    const updatedBehavior = { ...preferences.behavior_data };
    
    switch (action) {
      case 'page_visit':
        updatedBehavior.pages_visited = [
          ...(updatedBehavior.pages_visited || []),
          { page: data.page, timestamp: new Date().toISOString() }
        ].slice(-50);
        break;
      case 'feature_use':
        updatedBehavior.features_used = [
          ...(updatedBehavior.features_used || []),
          data.feature
        ];
        break;
      case 'search':
        updatedBehavior.search_history = [
          ...(updatedBehavior.search_history || []),
          data.query
        ].slice(-30);
        break;
    }

    await base44.entities.UserPreference.update(preferences.id, {
      behavior_data: updatedBehavior
    });
  };

  const analyzeWithAI = async () => {
    if (!preferences) return;

    setIsAnalyzing(true);

    const behaviorSummary = {
      pagesVisited: preferences.behavior_data?.pages_visited?.length || 0,
      featuresUsed: [...new Set(preferences.behavior_data?.features_used || [])],
      searchHistory: preferences.behavior_data?.search_history || []
    };

    const prompt = `Analyze this user's behavior and provide personalized insights:

User Activity:
- Pages visited: ${behaviorSummary.pagesVisited}
- Features used: ${behaviorSummary.featuresUsed.join(', ')}
- Recent searches: ${behaviorSummary.searchHistory.slice(-10).join(', ')}

Provide a JSON response with:
{
  "user_type": "developer/designer/business/beginner" (based on behavior),
  "skill_level": "beginner/intermediate/advanced",
  "interests": ["array of identified interests"],
  "recommendations": [
    {
      "title": "recommendation title",
      "description": "why this is recommended",
      "action": "suggested action",
      "priority": "high/medium/low"
    }
  ],
  "suggested_features": ["features they haven't tried but might like"],
  "learning_path": ["ordered list of next steps"]
}

Be specific and actionable. Focus on helping them build better apps.`;

    const response = await base44.integrations.Core.InvokeLLM({
      prompt: prompt,
      response_json_schema: {
        type: "object",
        properties: {
          user_type: { type: "string" },
          skill_level: { type: "string" },
          interests: { type: "array", items: { type: "string" } },
          recommendations: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                description: { type: "string" },
                action: { type: "string" },
                priority: { type: "string" }
              }
            }
          },
          suggested_features: { type: "array", items: { type: "string" } },
          learning_path: { type: "array", items: { type: "string" } }
        }
      }
    });

    setInsights(response);
    setRecommendations(response.recommendations || []);

    await base44.entities.UserPreference.update(preferences.id, {
      ai_insights: response,
      last_analyzed: new Date().toISOString()
    });

    setIsAnalyzing(false);
    toast.success('AI analysis complete!');
  };

  if (!preferences) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Loader2 className="w-12 h-12 text-gray-300 mx-auto mb-4 animate-spin" />
          <p className="text-gray-500">Loading personalization...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-lg">AI Personalization Engine</h3>
                <p className="text-sm text-gray-600">Tailored experience based on your behavior</p>
              </div>
            </div>
            <Button 
              onClick={analyzeWithAI} 
              disabled={isAnalyzing}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Analyze Now
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Insights */}
      {insights && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-2">
                <Target className="w-5 h-5 text-blue-600" />
                <span className="text-sm text-gray-600">User Type</span>
              </div>
              <div className="text-2xl font-bold text-gray-900 capitalize">{insights.user_type}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-2">
                <BarChart3 className="w-5 h-5 text-purple-600" />
                <span className="text-sm text-gray-600">Skill Level</span>
              </div>
              <div className="text-2xl font-bold text-gray-900 capitalize">{insights.skill_level}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-2">
                <Star className="w-5 h-5 text-orange-600" />
                <span className="text-sm text-gray-600">Interests</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{insights.interests?.length || 0}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Personalized Recommendations */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              Personalized Recommendations
            </CardTitle>
            <CardDescription>AI-powered suggestions based on your activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recommendations.map((rec, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Card className="border-2 hover:border-indigo-200 transition-all">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant={rec.priority === 'high' ? 'default' : 'outline'}
                              className={rec.priority === 'high' ? 'bg-red-600' : rec.priority === 'medium' ? 'bg-orange-500' : 'bg-blue-500'}>
                              {rec.priority} priority
                            </Badge>
                            <h4 className="font-semibold">{rec.title}</h4>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">{rec.description}</p>
                          <Button size="sm" variant="outline">
                            {rec.action}
                            <ArrowRight className="w-3 h-3 ml-2" />
                          </Button>
                        </div>
                        <Zap className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Suggested Features */}
      {insights?.suggested_features && insights.suggested_features.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Features You Might Like</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {insights.suggested_features.map((feature, idx) => (
                <Badge key={idx} variant="outline" className="text-sm">
                  {feature}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Learning Path */}
      {insights?.learning_path && insights.learning_path.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-600" />
              Your Learning Path
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {insights.learning_path.map((step, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-semibold flex-shrink-0">
                    {idx + 1}
                  </div>
                  <p className="text-sm text-gray-700">{step}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Behavior Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Your Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-2xl font-bold text-indigo-600">
                {preferences.behavior_data?.pages_visited?.length || 0}
              </div>
              <div className="text-xs text-gray-600">Pages Visited</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {[...new Set(preferences.behavior_data?.features_used || [])].length}
              </div>
              <div className="text-xs text-gray-600">Features Used</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {preferences.behavior_data?.search_history?.length || 0}
              </div>
              <div className="text-xs text-gray-600">Searches</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {preferences.preferences?.favorite_templates?.length || 0}
              </div>
              <div className="text-xs text-gray-600">Favorites</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Export tracking function for use in other components
export const trackUserBehavior = async (userEmail, action, data) => {
  const prefs = await base44.entities.UserPreference.filter({ user_email: userEmail });
  if (prefs.length === 0) return;

  const preference = prefs[0];
  const updatedBehavior = { ...preference.behavior_data };
  
  switch (action) {
    case 'page_visit':
      updatedBehavior.pages_visited = [
        ...(updatedBehavior.pages_visited || []),
        { page: data.page, timestamp: new Date().toISOString() }
      ].slice(-50);
      break;
    case 'feature_use':
      updatedBehavior.features_used = [
        ...(updatedBehavior.features_used || []),
        data.feature
      ];
      break;
    case 'search':
      updatedBehavior.search_history = [
        ...(updatedBehavior.search_history || []),
        data.query
      ].slice(-30);
      break;
    case 'click':
      updatedBehavior.clicks = [
        ...(updatedBehavior.clicks || []),
        { element: data.element, timestamp: new Date().toISOString() }
      ].slice(-100);
      break;
  }

  await base44.entities.UserPreference.update(preference.id, {
    behavior_data: updatedBehavior
  });
};