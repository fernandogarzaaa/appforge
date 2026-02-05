import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Sparkles, Download, Copy, CheckCircle, Upload } from 'lucide-react';
import { toast } from 'sonner';

export default function SuperiorAIStudio() {
  const [description, setDescription] = useState('');
  const [componentType, setComponentType] = useState('auto');
  const [wireframeFile, setWireframeFile] = useState(null);
  const [wireframeUrl, setWireframeUrl] = useState('');
  const [generating, setGenerating] = useState(false);
  const [component, setComponent] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setWireframeFile(file);
    
    try {
      const response = await base44.integrations.Core.UploadFile({ file });
      setWireframeUrl(response.file_url);
      toast.success('Wireframe uploaded successfully');
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('Failed to upload wireframe');
    }
  };

  const handleGenerate = async () => {
   if (!description.trim()) {
     toast.error('Please describe the component you want');
     return;
   }

   setGenerating(true);
   try {
     const response = await base44.functions.invoke('generateUIComponent', {
       description,
       component_type: componentType,
       wireframe_url: wireframeUrl || undefined
     });

     const componentData = response.data?.component || response.data;
     setComponent(componentData);
     toast.success('Component generated successfully!');
   } catch (error) {
     console.error('Generation failed:', error);
     toast.error('Failed to generate component: ' + error.message);
   } finally {
     setGenerating(false);
   }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(component.component_code);
    setCopied(true);
    toast.success('Code copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadComponent = () => {
    const blob = new Blob([component.component_code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${component.component_name}.jsx`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Component downloaded');
  };

  return (
    <div className="space-y-6">
      <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            Superior AI Component Generator
          </CardTitle>
          <p className="text-sm text-gray-600">
            Generate production-ready React components from descriptions or wireframes
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-2 block">
              Component Type
            </label>
            <select
              value={componentType}
              onChange={(e) => setComponentType(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="auto">Auto-detect</option>
              <option value="dashboard">Dashboard</option>
              <option value="form">Form</option>
              <option value="table">Data Table</option>
              <option value="card">Card/List</option>
              <option value="chart">Chart/Graph</option>
              <option value="navigation">Navigation</option>
              <option value="modal">Modal/Dialog</option>
              <option value="layout">Layout</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700 mb-2 block">
              Describe Your Component
            </label>
            <Textarea
              placeholder="e.g., 'A dashboard with revenue charts, recent orders table, and quick stats cards. Use purple gradient theme with dark mode support. Include filters for date range and export button.'"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[150px]"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700 mb-2 block">
              Upload Wireframe/Design (Optional)
            </label>
            <div className="flex gap-2">
              <label className="flex-1">
                <div className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition">
                  <Upload className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-600">
                    {wireframeFile ? wireframeFile.name : 'Click to upload wireframe'}
                  </p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </label>
            </div>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={generating}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600"
            size="lg"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating Component...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Component
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {component && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{component.component_name}</CardTitle>
                <p className="text-sm text-gray-600 mt-1">{component.description}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={copyCode}>
                  {copied ? <CheckCircle className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
                  {copied ? 'Copied!' : 'Copy'}
                </Button>
                <Button variant="outline" size="sm" onClick={downloadComponent}>
                  <Download className="w-4 h-4 mr-1" />
                  Download
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="code">
              <TabsList>
                <TabsTrigger value="code">Code</TabsTrigger>
                <TabsTrigger value="usage">Usage</TabsTrigger>
                <TabsTrigger value="details">Details</TabsTrigger>
              </TabsList>

              <TabsContent value="code" className="mt-4">
                <pre className="text-xs bg-gray-900 text-gray-100 p-4 rounded overflow-auto max-h-[600px]">
                  {component.component_code}
                </pre>
              </TabsContent>

              <TabsContent value="usage" className="mt-4 space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">How to Use</h4>
                  <pre className="text-xs bg-gray-900 text-gray-100 p-4 rounded overflow-auto">
                    {component.usage_example}
                  </pre>
                </div>

                {component.props?.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Props</h4>
                    <div className="space-y-2">
                      {component.props.map((prop, idx) => (
                        <div key={idx} className="p-3 bg-gray-50 rounded border">
                          <div className="flex items-center gap-2 mb-1">
                            <code className="text-sm font-semibold">{prop.name}</code>
                            <Badge variant="outline" className="text-xs">{prop.type}</Badge>
                            {prop.required && <Badge className="text-xs bg-red-600">Required</Badge>}
                          </div>
                          <p className="text-xs text-gray-600">{prop.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="font-semibold mb-2">Integration Notes</h4>
                  <p className="text-sm text-gray-700">{component.integration_notes}</p>
                </div>
              </TabsContent>

              <TabsContent value="details" className="mt-4 space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Features</h4>
                  <div className="flex flex-wrap gap-2">
                    {component.features?.map((feature, idx) => (
                      <Badge key={idx} variant="outline">{feature}</Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Dependencies</h4>
                  <div className="flex flex-wrap gap-2">
                    {component.dependencies?.map((dep, idx) => (
                      <Badge key={idx} className="bg-blue-600">{dep}</Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Accessibility</h4>
                  <ul className="space-y-1">
                    {component.accessibility_features?.map((feature, idx) => (
                      <li key={idx} className="text-sm text-gray-700">✓ {feature}</li>
                    ))}
                  </ul>
                </div>

                {component.data_requirements?.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Data Requirements</h4>
                    <ul className="space-y-1">
                      {component.data_requirements.map((req, idx) => (
                        <li key={idx} className="text-sm text-gray-700">• {req}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Badge className={component.responsive ? 'bg-green-600' : 'bg-gray-600'}>
                    {component.responsive ? 'Fully Responsive' : 'Fixed Width'}
                  </Badge>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}