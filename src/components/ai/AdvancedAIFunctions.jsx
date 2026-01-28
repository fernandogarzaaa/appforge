import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Wand2, Image, FileText, Languages, Code2, 
  MessageSquare, Search, Mic, Video, PenTool,
  Loader2, Sparkles, Download, Copy, Check
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const AI_FUNCTIONS = [
  { id: 'image_gen', name: 'Image Generation', icon: Image, description: 'Generate images from text prompts', color: 'from-pink-500 to-rose-500' },
  { id: 'code_gen', name: 'Code Generation', icon: Code2, description: 'Generate code from descriptions', color: 'from-blue-500 to-cyan-500' },
  { id: 'text_summary', name: 'Text Summarization', icon: FileText, description: 'Summarize long documents', color: 'from-green-500 to-emerald-500' },
  { id: 'translation', name: 'Translation', icon: Languages, description: 'Translate between languages', color: 'from-purple-500 to-indigo-500' },
  { id: 'chatbot', name: 'Chatbot Builder', icon: MessageSquare, description: 'Create custom AI chatbots', color: 'from-orange-500 to-amber-500' },
  { id: 'seo', name: 'SEO Optimizer', icon: Search, description: 'Optimize content for search', color: 'from-teal-500 to-cyan-500' },
  { id: 'voice', name: 'Voice to Text', icon: Mic, description: 'Transcribe audio content', color: 'from-red-500 to-pink-500' },
  { id: 'video_script', name: 'Video Script', icon: Video, description: 'Generate video scripts', color: 'from-violet-500 to-purple-500' },
  { id: 'content_writer', name: 'Content Writer', icon: PenTool, description: 'Generate marketing content', color: 'from-yellow-500 to-orange-500' },
];

export default function AdvancedAIFunctions() {
  const [selectedFunction, setSelectedFunction] = useState(null);
  const [input, setInput] = useState('');
  const [additionalParams, setAdditionalParams] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const runFunction = async () => {
    if (!selectedFunction || !input.trim()) {
      toast.error('Select a function and provide input');
      return;
    }

    setIsProcessing(true);
    setResult(null);

    const prompts = {
      image_gen: `Generate a detailed image prompt for: ${input}. Return JSON with: {prompt: detailed_prompt, style: art_style, mood: mood_description}`,
      code_gen: `Generate production-ready code for: ${input}. Return JSON with: {language: string, code: string, explanation: string, dependencies: array}`,
      text_summary: `Summarize the following text concisely: ${input}. Return JSON with: {summary: string, key_points: array, word_count: number}`,
      translation: `Translate to ${additionalParams.targetLang || 'Spanish'}: ${input}. Return JSON with: {original: string, translated: string, language: string}`,
      chatbot: `Design a chatbot for: ${input}. Return JSON with: {name: string, personality: string, greeting: string, sample_responses: array, intents: array}`,
      seo: `Optimize this content for SEO: ${input}. Return JSON with: {title: string, meta_description: string, keywords: array, suggestions: array, score: number}`,
      voice: `Process this transcription request: ${input}. Return JSON with: {transcription: string, confidence: number, timestamps: array}`,
      video_script: `Write a video script for: ${input}. Return JSON with: {title: string, hook: string, sections: array, call_to_action: string, duration_estimate: string}`,
      content_writer: `Write marketing content for: ${input}. Return JSON with: {headline: string, body: string, cta: string, variations: array}`,
    };

    const response = await base44.integrations.Core.InvokeLLM({
      prompt: prompts[selectedFunction],
      add_context_from_internet: ['seo', 'content_writer'].includes(selectedFunction),
      response_json_schema: {
        type: 'object',
        properties: {
          prompt: { type: 'string' },
          code: { type: 'string' },
          summary: { type: 'string' },
          translated: { type: 'string' },
          name: { type: 'string' },
          title: { type: 'string' },
          headline: { type: 'string' },
          body: { type: 'string' },
          key_points: { type: 'array' },
          keywords: { type: 'array' },
          suggestions: { type: 'array' },
          sections: { type: 'array' },
          variations: { type: 'array' },
          score: { type: 'number' },
          explanation: { type: 'string' },
        }
      }
    });

    // For image generation, actually generate the image
    if (selectedFunction === 'image_gen' && response.prompt) {
      const imageResult = await base44.integrations.Core.GenerateImage({
        prompt: response.prompt
      });
      response.image_url = imageResult.url;
    }

    setResult(response);
    setIsProcessing(false);
    toast.success('Processing complete!');
  };

  const copyResult = () => {
    const text = typeof result === 'object' ? JSON.stringify(result, null, 2) : result;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Copied!');
  };

  const currentFn = AI_FUNCTIONS.find(f => f.id === selectedFunction);

  return (
    <div className="space-y-4">
      {/* Function Grid */}
      <div className="grid grid-cols-3 gap-2">
        {AI_FUNCTIONS.map((fn) => {
          const Icon = fn.icon;
          return (
            <button
              key={fn.id}
              onClick={() => {
                setSelectedFunction(fn.id);
                setResult(null);
              }}
              className={cn(
                "p-3 rounded-xl border text-left transition-all",
                selectedFunction === fn.id
                  ? "border-indigo-500 bg-indigo-50"
                  : "border-gray-200 hover:bg-gray-50"
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center mb-2",
                fn.color
              )}>
                <Icon className="w-4 h-4 text-white" />
              </div>
              <p className="font-medium text-sm">{fn.name}</p>
              <p className="text-xs text-gray-500 mt-0.5">{fn.description}</p>
            </button>
          );
        })}
      </div>

      {/* Input Section */}
      {selectedFunction && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <Card className={cn("rounded-xl bg-gradient-to-br border-0", currentFn.color.replace('from-', 'from-').replace('to-', 'to-') + '/10')}>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3 mb-3">
                <currentFn.icon className="w-5 h-5" />
                <span className="font-semibold">{currentFn.name}</span>
              </div>
              <p className="text-sm text-gray-600">{currentFn.description}</p>
            </CardContent>
          </Card>

          <div>
            <Label className="text-sm text-gray-600 mb-1.5 block">Input</Label>
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                selectedFunction === 'image_gen' ? "Describe the image you want to generate..."
                : selectedFunction === 'code_gen' ? "Describe the code you need..."
                : selectedFunction === 'translation' ? "Enter text to translate..."
                : "Enter your input..."
              }
              className="h-28 rounded-xl resize-none"
            />
          </div>

          {selectedFunction === 'translation' && (
            <div>
              <Label className="text-sm text-gray-600 mb-1.5 block">Target Language</Label>
              <Input
                value={additionalParams.targetLang || ''}
                onChange={(e) => setAdditionalParams({ ...additionalParams, targetLang: e.target.value })}
                placeholder="e.g., Spanish, French, Japanese"
                className="h-10 rounded-xl"
              />
            </div>
          )}

          <Button
            onClick={runFunction}
            disabled={isProcessing || !input.trim()}
            className={cn(
              "w-full h-11 text-white rounded-xl bg-gradient-to-r",
              currentFn.color
            )}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4 mr-2" />
                Run {currentFn.name}
              </>
            )}
          </Button>

          {/* Results */}
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="rounded-xl">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      Result
                    </CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyResult}
                      className="rounded-lg"
                    >
                      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="max-h-[300px]">
                    {/* Image Result */}
                    {result.image_url && (
                      <div className="mb-4">
                        <img 
                          src={result.image_url} 
                          alt="Generated" 
                          className="rounded-xl w-full"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2 rounded-lg"
                          onClick={() => window.open(result.image_url, '_blank')}
                        >
                          <Download className="w-3 h-3 mr-1" />
                          Download
                        </Button>
                      </div>
                    )}

                    {/* Code Result */}
                    {result.code && (
                      <div className="space-y-2">
                        <Badge>{result.language}</Badge>
                        <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 text-sm overflow-x-auto">
                          <code>{result.code}</code>
                        </pre>
                        {result.explanation && (
                          <p className="text-sm text-gray-600 mt-2">{result.explanation}</p>
                        )}
                      </div>
                    )}

                    {/* Summary Result */}
                    {result.summary && (
                      <div className="space-y-3">
                        <p className="text-sm">{result.summary}</p>
                        {result.key_points?.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-gray-500 mb-1">Key Points:</p>
                            <ul className="list-disc list-inside text-sm space-y-1">
                              {result.key_points.map((point, i) => (
                                <li key={i}>{point}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Translation Result */}
                    {result.translated && (
                      <div className="space-y-2">
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <p className="text-xs text-gray-500 mb-1">Original</p>
                          <p className="text-sm">{result.original}</p>
                        </div>
                        <div className="p-3 bg-indigo-50 rounded-lg">
                          <p className="text-xs text-indigo-500 mb-1">{result.language}</p>
                          <p className="text-sm">{result.translated}</p>
                        </div>
                      </div>
                    )}

                    {/* SEO Result */}
                    {result.keywords && (
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-1">SEO Score</p>
                          <Badge className={result.score > 70 ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}>
                            {result.score}/100
                          </Badge>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-1">Title</p>
                          <p className="text-sm font-medium">{result.title}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-1">Keywords</p>
                          <div className="flex flex-wrap gap-1">
                            {result.keywords.map((kw, i) => (
                              <Badge key={i} variant="outline" className="text-xs">{kw}</Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Content Writer Result */}
                    {result.headline && (
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-1">Headline</p>
                          <p className="font-semibold">{result.headline}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-1">Body</p>
                          <p className="text-sm">{result.body}</p>
                        </div>
                        {result.cta && (
                          <div>
                            <p className="text-xs font-medium text-gray-500 mb-1">Call to Action</p>
                            <Badge className="bg-indigo-100 text-indigo-700">{result.cta}</Badge>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Video Script Result */}
                    {result.sections && (
                      <div className="space-y-3">
                        <div>
                          <p className="font-semibold">{result.title}</p>
                          <p className="text-xs text-gray-500">{result.duration_estimate}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-1">Hook</p>
                          <p className="text-sm italic">{result.hook}</p>
                        </div>
                        <div className="space-y-2">
                          {result.sections.map((section, i) => (
                            <div key={i} className="p-2 bg-gray-50 rounded-lg">
                              <p className="text-sm">{section}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </motion.div>
      )}
    </div>
  );
}