import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataPipelineService } from '@/services/dataPipeline';

export default function DataPipeline() {
  const [sources, setSources] = useState([]);
  const [sourceType, setSourceType] = useState('Logs');
  const [sourceConfig, setSourceConfig] = useState('');

  useEffect(() => {
    let active = true;
    (async () => {
      const items = await DataPipelineService.listSources();
      if (active) setSources(items);
    })();
    return () => {
      active = false;
    };
  }, []);

  const addSource = async () => {
    if (!sourceType.trim()) return;
    await DataPipelineService.addSource(sourceType.trim(), sourceConfig.trim());
    setSources(await DataPipelineService.listSources());
    setSourceConfig('');
  };

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Data Pipeline</h1>
          <p className="text-slate-600">Multi-source ingestion and retention strategy.</p>
        </div>
        <Badge variant="outline">Phase 9</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ingestion Sources</CardTitle>
          <CardDescription>Track data sources feeding the platform.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid md:grid-cols-3 gap-3">
            <Input value={sourceType} onChange={(event) => setSourceType(event.target.value)} placeholder="Source type" />
            <Input value={sourceConfig} onChange={(event) => setSourceConfig(event.target.value)} placeholder="Config" />
            <Button onClick={addSource}>Add Source</Button>
          </div>
          <div className="space-y-2 text-sm">
            {sources.length === 0 ? (
              <p className="text-muted-foreground">No sources configured yet.</p>
            ) : (
              sources.map((source) => (
                <div key={source.id}>
                  <span className="font-semibold">{source.type}</span>
                  {source.config ? <span className="text-slate-500"> · {source.config}</span> : null}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
