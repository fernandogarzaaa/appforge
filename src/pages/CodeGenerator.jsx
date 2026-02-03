import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles } from 'lucide-react';

export default function CodeGenerator() {
  const [description, setDescription] = useState('');
  const [language, setLanguage] = useState('typescript');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/aiGenerateRestAPI', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ description, language }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to generate API');
      }

      setResult(data);
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">AI API Generator</h1>
          <p className="text-slate-600">Describe an API and generate a ready-to-review scaffold.</p>
        </div>
        <Badge variant="outline" className="gap-2">
          <Sparkles className="w-4 h-4" />
          Phase 2
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Request</CardTitle>
          <CardDescription>Provide a clear description of the resource and actions.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Example: Create a tasks API with CRUD endpoints and validation for title, status, dueDate..."
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={5}
          />
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-slate-700" htmlFor="language">
                Output Language
              </label>
              <select
                id="language"
                value={language}
                onChange={(event) => setLanguage(event.target.value)}
                className="border border-slate-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="typescript">TypeScript</option>
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
              </select>
            </div>
            <Button onClick={handleGenerate} disabled={loading || description.trim().length < 8}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Generate API
            </Button>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Output</CardTitle>
            <CardDescription>{result.message}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700">Endpoints</p>
              <div className="grid gap-2">
                {result.functions?.map((endpoint, index) => (
                  <div key={`${endpoint.method}-${endpoint.path}-${index}`} className="flex items-center gap-3 text-sm">
                    <Badge variant="secondary">{endpoint.method}</Badge>
                    <span className="font-mono text-slate-700">{endpoint.path}</span>
                    <span className="text-slate-500">{endpoint.description}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700 mb-2">Generated Code</p>
              <pre className="bg-slate-900 text-slate-100 text-xs p-4 rounded-lg overflow-auto">
                {result.code}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
