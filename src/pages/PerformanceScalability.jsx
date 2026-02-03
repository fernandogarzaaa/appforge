import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PerformanceScalabilityService } from '@/services/performanceScalability';

export default function PerformanceScalability() {
  const [layers, setLayers] = useState([]);
  const [layerName, setLayerName] = useState('');
  const [layerStatus, setLayerStatus] = useState('planned');

  useEffect(() => {
    let active = true;
    (async () => {
      const items = await PerformanceScalabilityService.listLayers();
      if (active) setLayers(items);
    })();
    return () => {
      active = false;
    };
  }, []);

  const addLayer = async () => {
    if (!layerName.trim()) return;
    await PerformanceScalabilityService.addLayer(layerName.trim(), layerStatus.trim() || 'planned');
    setLayers(await PerformanceScalabilityService.listLayers());
    setLayerName('');
  };

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Performance & Scalability</h1>
          <p className="text-slate-600">Edge caching, offline mode, and realtime updates.</p>
        </div>
        <Badge variant="outline">Phase 8</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Scalability Layers</CardTitle>
          <CardDescription>Track performance investments across the stack.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid md:grid-cols-3 gap-3">
            <Input value={layerName} onChange={(event) => setLayerName(event.target.value)} placeholder="Layer name" />
            <Input value={layerStatus} onChange={(event) => setLayerStatus(event.target.value)} placeholder="Status" />
            <Button onClick={addLayer}>Add Layer</Button>
          </div>
          <div className="space-y-2 text-sm">
            {layers.length === 0 ? (
              <p className="text-muted-foreground">No layers planned yet.</p>
            ) : (
              layers.map((layer) => (
                <div key={layer.id}>
                  <span className="font-semibold">{layer.name}</span>
                  <span className="text-slate-500"> · {layer.status}</span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
