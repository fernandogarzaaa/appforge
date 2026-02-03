import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MarketplaceExtensionsService } from '@/services/marketplaceExtensions';

export default function MarketplaceExtensions() {
  const [plugins, setPlugins] = useState([]);
  const [pluginName, setPluginName] = useState('');
  const [pluginCategory, setPluginCategory] = useState('Observability');

  useEffect(() => {
    let active = true;
    (async () => {
      const items = await MarketplaceExtensionsService.listPlugins();
      if (active) setPlugins(items);
    })();
    return () => {
      active = false;
    };
  }, []);

  const addPlugin = async () => {
    if (!pluginName.trim()) return;
    await MarketplaceExtensionsService.addPlugin(pluginName.trim(), pluginCategory.trim());
    setPlugins(await MarketplaceExtensionsService.listPlugins());
    setPluginName('');
  };

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Marketplace & Extensions</h1>
          <p className="text-slate-600">Plugins, templates, and community contributions.</p>
        </div>
        <Badge variant="outline">Phase 14</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Marketplace Catalog</CardTitle>
          <CardDescription>Track plugins and partner submissions.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid md:grid-cols-3 gap-3">
            <Input value={pluginName} onChange={(event) => setPluginName(event.target.value)} placeholder="Plugin name" />
            <Input value={pluginCategory} onChange={(event) => setPluginCategory(event.target.value)} placeholder="Category" />
            <Button onClick={addPlugin}>Add Plugin</Button>
          </div>
          <div className="space-y-2 text-sm">
            {plugins.length === 0 ? (
              <p className="text-muted-foreground">No plugins registered yet.</p>
            ) : (
              plugins.map((plugin) => (
                <div key={plugin.id}>
                  <span className="font-semibold">{plugin.name}</span>
                  <span className="text-slate-500"> · {plugin.category}</span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
