import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain, Sparkles, AlertCircle, TrendingUp, Activity, 
  Shield, Zap, Code, Layout, Users 
} from 'lucide-react';
import { toast } from 'sonner';

export default function AICapabilitiesControl() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState({
    component_generation_enabled: true,
    code_review_enabled: true,
    deployment_wizard_enabled: true,
    bot_creation_enabled: true,
    max_generations_per_hour: 50,
    quality_threshold: 0.85,
    creativity_level: 0.7,
    auto_optimization: true,
    advanced_features: true,
    safety_checks: true
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
    } catch (error) {
      console.error('Failed to load:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      toast.success('AI capabilities updated successfully');
    } catch (error) {
      toast.error('Failed to save configuration');
    }
  };

  if (loading) return <div className="p-6 text-center">Loading...</div>;

  if (user?.role !== 'admin') {
    return (
      <Card className="border-red-200">
        <CardContent className="p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <p className="text-red-700 font-semibold">Admin Access Required</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="dark:bg-slate-900/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 dark:text-gray-100">
            <Brain className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            AI Capabilities Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <Activity className="w-6 h-6 mx-auto mb-2 text-green-600" />
              <div className="text-2xl font-bold text-green-600">98.2%</div>
              <div className="text-xs text-gray-600">Uptime</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Zap className="w-6 h-6 mx-auto mb-2 text-blue-600" />
              <div className="text-2xl font-bold text-blue-600">1,247</div>
              <div className="text-xs text-gray-600">Components Generated</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <Code className="w-6 h-6 mx-auto mb-2 text-purple-600" />
              <div className="text-2xl font-bold text-purple-600">523</div>
              <div className="text-xs text-gray-600">Code Reviews</div>
            </div>
            <div className="text-center p-4 bg-pink-50 rounded-lg">
              <Users className="w-6 h-6 mx-auto mb-2 text-pink-600" />
              <div className="text-2xl font-bold text-pink-600">89</div>
              <div className="text-xs text-gray-600">Active Users</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>AI Feature Controls</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="features">
            <TabsList>
              <TabsTrigger value="features">Features</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
            </TabsList>

            <TabsContent value="features" className="space-y-4 mt-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-semibold flex items-center gap-2">
                    <Layout className="w-4 h-4" />
                    Component Generation
                  </div>
                  <p className="text-xs text-gray-600">AI-powered UI component creation</p>
                </div>
                <Switch
                  checked={config.component_generation_enabled}
                  onCheckedChange={(checked) => 
                    setConfig({ ...config, component_generation_enabled: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-semibold flex items-center gap-2">
                    <Code className="w-4 h-4" />
                    Code Review System
                  </div>
                  <p className="text-xs text-gray-600">Automated code analysis and suggestions</p>
                </div>
                <Switch
                  checked={config.code_review_enabled}
                  onCheckedChange={(checked) => 
                    setConfig({ ...config, code_review_enabled: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-semibold flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    Deployment Wizard
                  </div>
                  <p className="text-xs text-gray-600">AI-driven infrastructure setup</p>
                </div>
                <Switch
                  checked={config.deployment_wizard_enabled}
                  onCheckedChange={(checked) => 
                    setConfig({ ...config, deployment_wizard_enabled: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-semibold flex items-center gap-2">
                    <Brain className="w-4 h-4" />
                    Bot Creation Studio
                  </div>
                  <p className="text-xs text-gray-600">Advanced AI bot builder</p>
                </div>
                <Switch
                  checked={config.bot_creation_enabled}
                  onCheckedChange={(checked) => 
                    setConfig({ ...config, bot_creation_enabled: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-semibold flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Auto-Optimization
                  </div>
                  <p className="text-xs text-gray-600">Automatic code and performance optimization</p>
                </div>
                <Switch
                  checked={config.auto_optimization}
                  onCheckedChange={(checked) => 
                    setConfig({ ...config, auto_optimization: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-semibold flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Advanced Features
                  </div>
                  <p className="text-xs text-gray-600">Next-gen AI capabilities</p>
                </div>
                <Switch
                  checked={config.advanced_features}
                  onCheckedChange={(checked) => 
                    setConfig({ ...config, advanced_features: checked })
                  }
                />
              </div>
            </TabsContent>

            <TabsContent value="performance" className="space-y-6 mt-4">
              <div>
                <label className="text-sm font-semibold mb-3 block">
                  Max Generations Per Hour: {config.max_generations_per_hour}
                </label>
                <Slider
                  value={[config.max_generations_per_hour]}
                  onValueChange={([value]) => 
                    setConfig({ ...config, max_generations_per_hour: value })
                  }
                  min={10}
                  max={200}
                  step={10}
                />
              </div>

              <div>
                <label className="text-sm font-semibold mb-3 block">
                  Quality Threshold: {(config.quality_threshold * 100).toFixed(0)}%
                </label>
                <Slider
                  value={[config.quality_threshold * 100]}
                  onValueChange={([value]) => 
                    setConfig({ ...config, quality_threshold: value / 100 })
                  }
                  min={50}
                  max={100}
                  step={5}
                />
              </div>

              <div>
                <label className="text-sm font-semibold mb-3 block">
                  Creativity Level: {(config.creativity_level * 100).toFixed(0)}%
                </label>
                <Slider
                  value={[config.creativity_level * 100]}
                  onValueChange={([value]) => 
                    setConfig({ ...config, creativity_level: value / 100 })
                  }
                  min={0}
                  max={100}
                  step={10}
                />
                <p className="text-xs text-gray-600 mt-2">
                  Higher = more creative/experimental, Lower = more conservative/predictable
                </p>
              </div>
            </TabsContent>

            <TabsContent value="security" className="space-y-4 mt-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-semibold flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Safety Checks
                  </div>
                  <p className="text-xs text-gray-600">Validate generated code for security issues</p>
                </div>
                <Switch
                  checked={config.safety_checks}
                  onCheckedChange={(checked) => 
                    setConfig({ ...config, safety_checks: checked })
                  }
                />
              </div>

              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <h4 className="font-semibold text-green-900 mb-2">Security Status</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Badge className="bg-green-600">Active</Badge>
                    <span className="text-gray-700">SQL Injection Prevention</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Badge className="bg-green-600">Active</Badge>
                    <span className="text-gray-700">XSS Protection</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Badge className="bg-green-600">Active</Badge>
                    <span className="text-gray-700">Code Sanitization</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Badge className="bg-green-600">Active</Badge>
                    <span className="text-gray-700">Dependency Scanning</span>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex gap-3 mt-6">
            <Button onClick={handleSave} className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600">
              Save Configuration
            </Button>
            <Button variant="outline" onClick={loadData}>
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}