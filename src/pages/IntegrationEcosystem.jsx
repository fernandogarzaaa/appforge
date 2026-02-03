import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { IntegrationEcosystemService } from '@/services/integrationEcosystem';

export default function IntegrationEcosystem() {
  const [integrations, setIntegrations] = useState([]);
  const [type, setType] = useState('Prometheus');
  const [config, setConfig] = useState('');

  useEffect(() => {
    let active = true;
    (async () => {
      const items = await IntegrationEcosystemService.listIntegrations();
      if (active) setIntegrations(items);
    })();
    return () => {
      active = false;
    };
  }, []);

  const handleConnect = async () => {
    if (!type.trim()) return;
    await IntegrationEcosystemService.connectIntegration(type.trim(), config);
    setIntegrations(await IntegrationEcosystemService.listIntegrations());
    setConfig('');
  };

  const handleDisconnect = async (id) => {
    await IntegrationEcosystemService.disconnectIntegration(id);
    setIntegrations(await IntegrationEcosystemService.listIntegrations());
  };

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Integration Ecosystem</h1>
          <p className="text-slate-600">Connect observability and incident tooling in one place.</p>
        </div>
        <Badge variant="outline">Phase 5</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Connect Integration</CardTitle>
          <CardDescription>Store configuration locally for now.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid md:grid-cols-3 gap-3">
            <Input value={type} onChange={(event) => setType(event.target.value)} placeholder="Integration type" />
            <Input value={config} onChange={(event) => setConfig(event.target.value)} placeholder="Config / token" />
            <Button onClick={handleConnect}>Connect</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Connected Integrations</CardTitle>
          <CardDescription>Active connections and status.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {integrations.length === 0 ? (
            <p className="text-muted-foreground">No integrations connected yet.</p>
          ) : (
            integrations.map((integration) => (
              <div key={integration.id} className="flex items-center justify-between">
                <div>
                  <span className="font-semibold">{integration.type}</span>
                  <span className="text-slate-500"> · {integration.status}</span>
                </div>
                <Button size="sm" variant="outline" onClick={() => handleDisconnect(integration.id)}>
                  Disconnect
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
