import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkles, Copy, Check, Code2, Database, FileCode, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function CodeGeneratorPanel({ isOpen, onClose, entity, page }) {
  const [selectedCodeType, setSelectedCodeType] = useState('crud_component');
  const [generatedCode, setGeneratedCode] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const codeTypes = [
    { id: 'crud_component', label: 'CRUD Component', icon: FileCode, description: 'Full list with create/edit/delete' },
    { id: 'form_component', label: 'Form Component', icon: FileCode, description: 'Input form with validation' },
    { id: 'api_endpoints', label: 'API Endpoints', icon: Code2, description: 'REST API handlers' },
    { id: 'service_class', label: 'Service Class', icon: Database, description: 'Business logic wrapper' }
  ];

  const handleGenerate = async () => {
    if (!entity && !page) {
      toast.error('Please select an entity or page');
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      const response = await base44.functions.invoke('generateEntityBoilerplate', {
        entity_name: entity?.name || page?.name,
        entity_schema: entity?.schema || page?.structure,
        code_type: selectedCodeType
      });

      if (response.data.success) {
        setGeneratedCode(response.data);
        toast.success('Code generated successfully!');
      } else {
        throw new Error(response.data.error);
      }
    } catch (err) {
      setError(err.message || 'Failed to generate code');
      toast.error('Failed to generate code');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (code) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            AI Code Generator
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Code Type Selection */}
          {!generatedCode && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-3">Select Code Type</h3>
                <div className="grid grid-cols-2 gap-3">
                  {codeTypes.map(type => (
                    <button
                      key={type.id}
                      onClick={() => setSelectedCodeType(type.id)}
                      className={`p-4 rounded-lg border-2 transition-all text-left ${
                        selectedCodeType === type.id
                          ? 'border-purple-600 bg-purple-50'
                          : 'border-gray-200 hover:border-purple-200'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <type.icon className="w-5 h-5 mt-1" />
                        <div>
                          <p className="font-semibold text-sm">{type.label}</p>
                          <p className="text-xs text-gray-600">{type.description}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <div className="text-sm text-red-700">{error}</div>
                </div>
              )}

              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm font-semibold mb-2">Generating for:</p>
                <Badge className="bg-purple-100 text-purple-900">
                  {entity?.name || page?.name || 'Selection'}
                </Badge>
              </div>

              <Button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Code
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Generated Code Display */}
          {generatedCode && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{generatedCode.code_type}</h3>
                  <p className="text-sm text-gray-600">{generatedCode.entity_name}</p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setGeneratedCode(null)}
                >
                  Generate Different
                </Button>
              </div>

              {generatedCode.explanation && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4 text-sm text-blue-900">
                    {generatedCode.explanation}
                  </CardContent>
                </Card>
              )}

              <Tabs defaultValue="code" className="space-y-3">
                <TabsList>
                  <TabsTrigger value="code">Code</TabsTrigger>
                  <TabsTrigger value="imports">Imports</TabsTrigger>
                </TabsList>

                <TabsContent value="code" className="space-y-3">
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(generatedCode.code)}
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {copied ? 'Copied' : 'Copy'}
                    </Button>
                  </div>
                  <div className="bg-gray-900 rounded-lg overflow-hidden max-h-96 overflow-y-auto">
                    <pre className="p-4 text-sm text-gray-100 font-mono whitespace-pre-wrap break-words">
                      <code>{generatedCode.code}</code>
                    </pre>
                  </div>
                </TabsContent>

                <TabsContent value="imports">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    {generatedCode.imports && generatedCode.imports.length > 0 ? (
                      <div className="space-y-2">
                        {generatedCode.imports.map((imp, i) => (
                          <p key={i} className="font-mono text-sm text-gray-700">{imp}</p>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-600">No additional imports required</p>
                    )}
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex gap-2">
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
                <Button
                  onClick={() => copyToClipboard(generatedCode.code)}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600"
                >
                  Copy to Clipboard
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}