import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Image as ImageIcon, Wand2, Download, 
  Copy, RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

export default function MediaStudio() {
  const [generating, setGenerating] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('realistic');
  const [mediaType, setMediaType] = useState('image');
  const [generatedMedia, setGeneratedMedia] = useState([]);
  const [referenceImages, setReferenceImages] = useState([]);

  const generateMedia = async () => {
    if (!prompt.trim()) {
      toast.error('Enter a description');
      return;
    }

    setGenerating(true);
    try {
      const stylePrompts = {
        realistic: 'photorealistic, high quality, detailed',
        artistic: 'artistic, creative, stylized',
        cartoon: 'cartoon style, vibrant colors, illustrated',
        sketch: 'pencil sketch, hand-drawn, artistic',
        '3d': '3D render, modern, clean',
        abstract: 'abstract art, creative, unique'
      };

      const enhancedPrompt = `${prompt}, ${stylePrompts[style]}`;

      const result = await base44.integrations.Core.GenerateImage({
        prompt: enhancedPrompt,
        existing_image_urls: referenceImages.length > 0 ? referenceImages : undefined
      });

      setGeneratedMedia([{
        url: result.url,
        prompt: prompt,
        style: style,
        date: new Date().toISOString()
      }, ...generatedMedia]);

      toast.success('Media generated successfully!');
    } catch (error) {
      toast.error('Failed to generate media');
    } finally {
      setGenerating(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setReferenceImages([...referenceImages, file_url]);
      toast.success('Reference image uploaded');
    } catch (error) {
      toast.error('Failed to upload image');
    }
  };

  const downloadMedia = (url) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = `generated-${Date.now()}.png`;
    a.click();
    toast.success('Downloaded');
  };

  const copyUrl = (url) => {
    navigator.clipboard.writeText(url);
    toast.success('URL copied to clipboard');
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">AI Media Studio</h1>
        <p className="text-gray-500">Generate stunning images and videos with AI</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Controls */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Generation Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Media Type</Label>
                <Select value={mediaType} onValueChange={setMediaType}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="image">Image</SelectItem>
                    <SelectItem value="video">Video (Coming Soon)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Prompt</Label>
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe what you want to create..."
                  rows={4}
                  className="mt-2"
                />
              </div>

              <div>
                <Label>Style</Label>
                <Select value={style} onValueChange={setStyle}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="realistic">Realistic</SelectItem>
                    <SelectItem value="artistic">Artistic</SelectItem>
                    <SelectItem value="cartoon">Cartoon</SelectItem>
                    <SelectItem value="sketch">Sketch</SelectItem>
                    <SelectItem value="3d">3D Render</SelectItem>
                    <SelectItem value="abstract">Abstract</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Reference Images (Optional)</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="mt-2"
                />
                {referenceImages.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {referenceImages.map((url, i) => (
                      <div key={i} className="relative">
                        <img src={url} className="w-16 h-16 object-cover rounded" />
                        <button
                          onClick={() => setReferenceImages(referenceImages.filter((_, idx) => idx !== i))}
                          className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Button onClick={generateMedia} disabled={generating} className="w-full">
                {generating ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4 mr-2" />
                    Generate
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Quick Prompts */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-sm">Quick Prompts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                'Professional headshot',
                'Product mockup',
                'Abstract background',
                'Logo design',
                'Social media banner',
                'Marketing illustration'
              ].map((p, i) => (
                <Button
                  key={i}
                  variant="outline"
                  size="sm"
                  onClick={() => setPrompt(p)}
                  className="w-full text-xs justify-start"
                >
                  {p}
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Gallery */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Generated Media</CardTitle>
                <Badge variant="outline">{generatedMedia.length} items</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {generatedMedia.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {generatedMedia.map((media, i) => (
                    <Card key={i} className="overflow-hidden">
                      <div className="aspect-square bg-gray-100">
                        <img 
                          src={media.url} 
                          alt={media.prompt}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <CardContent className="p-3">
                        <p className="text-xs text-gray-600 mb-2 line-clamp-2">{media.prompt}</p>
                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => downloadMedia(media.url)}
                            className="flex-1 text-xs"
                          >
                            <Download className="w-3 h-3 mr-1" />
                            Download
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyUrl(media.url)}
                            className="flex-1 text-xs"
                          >
                            <Copy className="w-3 h-3 mr-1" />
                            Copy URL
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <ImageIcon className="w-16 h-16 text-gray-300 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No media yet</h3>
                  <p className="text-gray-500">Describe what you want to create and click Generate</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}