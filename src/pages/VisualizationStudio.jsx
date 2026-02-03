import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { VisualizationStudioService } from '@/services/visualizationStudio';

export default function VisualizationStudio() {
  const [graphs, setGraphs] = useState([]);
  const [heatmaps, setHeatmaps] = useState([]);
  const [graphName, setGraphName] = useState('');
  const [graphType, setGraphType] = useState('Causal Graph');
  const [heatmapName, setHeatmapName] = useState('');
  const [heatmapScope, setHeatmapScope] = useState('Service Dependencies');

  useEffect(() => {
    let active = true;
    (async () => {
      const state = await VisualizationStudioService.getState();
      if (!active) return;
      setGraphs(state.graphs || []);
      setHeatmaps(state.heatmaps || []);
    })();
    return () => {
      active = false;
    };
  }, []);

  const addGraph = async () => {
    if (!graphName.trim()) return;
    const state = await VisualizationStudioService.saveGraph({
      id: `graph_${Date.now()}`,
      name: graphName.trim(),
      type: graphType.trim(),
    });
    setGraphs(state.graphs || []);
    setGraphName('');
  };

  const addHeatmap = async () => {
    if (!heatmapName.trim()) return;
    const state = await VisualizationStudioService.addHeatmap({
      id: `heatmap_${Date.now()}`,
      name: heatmapName.trim(),
      scope: heatmapScope.trim(),
    });
    setHeatmaps(state.heatmaps || []);
    setHeatmapName('');
  };

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Advanced Visualizations</h1>
          <p className="text-slate-600">3D causal graphs, time-travel debugging, and impact previews.</p>
        </div>
        <Badge variant="outline">Phase 4</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Saved Graphs</CardTitle>
          <CardDescription>Create reusable analysis views for incidents.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid md:grid-cols-3 gap-3">
            <Input value={graphName} onChange={(event) => setGraphName(event.target.value)} placeholder="Graph name" />
            <Input value={graphType} onChange={(event) => setGraphType(event.target.value)} placeholder="Graph type" />
            <Button onClick={addGraph}>Save Graph</Button>
          </div>
          <div className="space-y-2 text-sm">
            {graphs.length === 0 ? (
              <p className="text-muted-foreground">No graphs saved yet.</p>
            ) : (
              graphs.map((graph) => (
                <div key={graph.id}>
                  <span className="font-semibold">{graph.name}</span>
                  <span className="text-slate-500"> · {graph.type}</span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Heatmap Overlays</CardTitle>
          <CardDescription>Track impact intensity across services.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid md:grid-cols-3 gap-3">
            <Input value={heatmapName} onChange={(event) => setHeatmapName(event.target.value)} placeholder="Heatmap name" />
            <Input value={heatmapScope} onChange={(event) => setHeatmapScope(event.target.value)} placeholder="Scope" />
            <Button onClick={addHeatmap}>Add Heatmap</Button>
          </div>
          <div className="space-y-2 text-sm">
            {heatmaps.length === 0 ? (
              <p className="text-muted-foreground">No heatmaps created yet.</p>
            ) : (
              heatmaps.map((heatmap) => (
                <div key={heatmap.id}>
                  <span className="font-semibold">{heatmap.name}</span>
                  <span className="text-slate-500"> · {heatmap.scope}</span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
