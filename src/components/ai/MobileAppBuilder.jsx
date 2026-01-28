import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { base44 } from '@/api/base44Client';
import { 
  Smartphone, Zap, Code, Eye, Download, Loader2, 
  CheckCircle, Layers, Bell, Camera, MapPin, Share2,
  CreditCard, MessageCircle, Calendar, Settings
} from 'lucide-react';
import { toast } from 'sonner';

const appTemplates = [
  { id: 'social', name: 'Social Media App', icon: Share2, description: 'Posts, feeds, profiles, messaging' },
  { id: 'ecommerce', name: 'Shopping App', icon: CreditCard, description: 'Products, cart, checkout, orders' },
  { id: 'fitness', name: 'Fitness Tracker', icon: Calendar, description: 'Workouts, goals, progress tracking' },
  { id: 'food', name: 'Food Delivery', icon: MapPin, description: 'Restaurants, orders, GPS tracking' },
  { id: 'chat', name: 'Messaging App', icon: MessageCircle, description: 'Real-time chat, groups, media' },
  { id: 'news', name: 'News Reader', icon: Bell, description: 'Articles, categories, bookmarks' }
];

const features = [
  { id: 'auth', name: 'Authentication', icon: Settings, description: 'Login, signup, social auth' },
  { id: 'push', name: 'Push Notifications', icon: Bell, description: 'Real-time alerts and messages' },
  { id: 'camera', name: 'Camera & Photos', icon: Camera, description: 'Take photos, upload images' },
  { id: 'location', name: 'GPS & Maps', icon: MapPin, description: 'Location tracking, maps integration' },
  { id: 'payments', name: 'In-App Payments', icon: CreditCard, description: 'Xendit, PayPal integration' },
  { id: 'sharing', name: 'Social Sharing', icon: Share2, description: 'Share to social platforms' },
  { id: 'offline', name: 'Offline Mode', icon: Layers, description: 'Work without internet' },
  { id: 'chat', name: 'Real-time Chat', icon: MessageCircle, description: 'Live messaging feature' }
];

export default function MobileAppBuilder({ projectId }) {
  const [appName, setAppName] = useState('');
  const [appDescription, setAppDescription] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('both');
  const [selectedFeatures, setSelectedFeatures] = useState([]);
  const [generatedCode, setGeneratedCode] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState('builder');

  const toggleFeature = (featureId) => {
    setSelectedFeatures(prev =>
      prev.includes(featureId)
        ? prev.filter(f => f !== featureId)
        : [...prev, featureId]
    );
  };

  const generateMobileApp = async () => {
    if (!appName || !appDescription || !selectedTemplate) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsGenerating(true);
    setActiveTab('preview');

    const template = appTemplates.find(t => t.id === selectedTemplate);
    const selectedFeatureDetails = features.filter(f => selectedFeatures.includes(f.id));

    const prompt = `Generate a React Native mobile app with the following specifications:

App Name: ${appName}
Description: ${appDescription}
Template: ${template.name} - ${template.description}
Platform: ${selectedPlatform === 'both' ? 'iOS and Android' : selectedPlatform === 'ios' ? 'iOS' : 'Android'}

Features to include:
${selectedFeatureDetails.map(f => `- ${f.name}: ${f.description}`).join('\n')}

Generate:
1. Project structure overview
2. Main App.js file with navigation
3. Key screen components (Home, Profile, etc.)
4. State management setup
5. API integration patterns
6. Styling with React Native StyleSheet

Provide clean, production-ready React Native code with proper component structure, navigation using React Navigation, and modern hooks.`;

    const response = await base44.integrations.Core.InvokeLLM({
      prompt: prompt,
      add_context_from_internet: false
    });

    setGeneratedCode(response);
    setIsGenerating(false);
    toast.success('Mobile app generated successfully!');
  };

  const exportProject = () => {
    const blob = new Blob([generatedCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${appName.replace(/\s+/g, '-').toLowerCase()}-mobile-app.txt`;
    a.click();
    toast.success('Project exported!');
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="builder">
            <Code className="w-4 h-4 mr-2" />
            Builder
          </TabsTrigger>
          <TabsTrigger value="preview">
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </TabsTrigger>
        </TabsList>

        <TabsContent value="builder" className="space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">App Details</CardTitle>
              <CardDescription>Basic information about your mobile app</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">App Name *</label>
                <Input
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  placeholder="My Awesome App"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Description *</label>
                <Textarea
                  value={appDescription}
                  onChange={(e) => setAppDescription(e.target.value)}
                  placeholder="Describe what your app does and its main features..."
                  rows={4}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Target Platform</label>
                <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="both">iOS & Android</SelectItem>
                    <SelectItem value="ios">iOS Only</SelectItem>
                    <SelectItem value="android">Android Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Templates */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Choose Template *</CardTitle>
              <CardDescription>Select a template that matches your app type</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {appTemplates.map(template => (
                  <button
                    key={template.id}
                    onClick={() => setSelectedTemplate(template.id)}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      selectedTemplate === template.id
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <template.icon className={`w-8 h-8 mb-2 ${
                      selectedTemplate === template.id ? 'text-indigo-600' : 'text-gray-400'
                    }`} />
                    <div className="font-semibold text-sm mb-1">{template.name}</div>
                    <div className="text-xs text-gray-600">{template.description}</div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Features */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Features & Capabilities</CardTitle>
              <CardDescription>Select features to include in your mobile app</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {features.map(feature => (
                  <button
                    key={feature.id}
                    onClick={() => toggleFeature(feature.id)}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      selectedFeatures.includes(feature.id)
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <feature.icon className={`w-5 h-5 mt-0.5 ${
                        selectedFeatures.includes(feature.id) ? 'text-purple-600' : 'text-gray-400'
                      }`} />
                      <div className="flex-1">
                        <div className="font-semibold text-sm mb-1">{feature.name}</div>
                        <div className="text-xs text-gray-600">{feature.description}</div>
                      </div>
                      {selectedFeatures.includes(feature.id) && (
                        <CheckCircle className="w-5 h-5 text-purple-600 flex-shrink-0" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Generate Button */}
          <div className="flex gap-3">
            <Button
              onClick={generateMobileApp}
              disabled={isGenerating || !appName || !appDescription || !selectedTemplate}
              className="flex-1 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Generating App...
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5 mr-2" />
                  Generate Mobile App
                </>
              )}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="preview" className="space-y-4">
          {!generatedCode && !isGenerating ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Smartphone className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Generate an app to see the preview</p>
              </CardContent>
            </Card>
          ) : isGenerating ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Loader2 className="w-16 h-16 text-indigo-500 mx-auto mb-4 animate-spin" />
                <p className="text-gray-600 font-medium mb-2">Generating your mobile app...</p>
                <p className="text-sm text-gray-500">This may take a moment</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{appName}</CardTitle>
                      <CardDescription>React Native Mobile App</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Badge className="bg-green-600">
                        {selectedPlatform === 'both' ? 'iOS & Android' : selectedPlatform === 'ios' ? 'iOS' : 'Android'}
                      </Badge>
                      <Badge variant="outline">
                        {selectedFeatures.length} Features
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Generated Code</CardTitle>
                    <Button onClick={exportProject} size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Export Project
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto text-xs max-h-96 overflow-y-auto">
                    <code>{generatedCode}</code>
                  </pre>
                </CardContent>
              </Card>

              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <Smartphone className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-semibold text-blue-900 mb-2">Next Steps</div>
                      <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                        <li>Export the generated project files</li>
                        <li>Set up React Native development environment (Node.js, React Native CLI)</li>
                        <li>Run <code className="bg-blue-200 px-1 rounded">npx react-native init {appName.replace(/\s+/g, '')}</code></li>
                        <li>Copy the generated code into your project</li>
                        <li>Install required dependencies: <code className="bg-blue-200 px-1 rounded">npm install</code></li>
                        <li>Run on iOS: <code className="bg-blue-200 px-1 rounded">npx react-native run-ios</code></li>
                        <li>Run on Android: <code className="bg-blue-200 px-1 rounded">npx react-native run-android</code></li>
                      </ol>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}