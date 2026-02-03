import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MonetizationService } from '@/services/monetization';

export default function Monetization() {
  const [tiers, setTiers] = useState([]);
  const [tierName, setTierName] = useState('');
  const [tierLimits, setTierLimits] = useState('');

  useEffect(() => {
    let active = true;
    (async () => {
      const items = await MonetizationService.listTiers();
      if (active) setTiers(items);
    })();
    return () => {
      active = false;
    };
  }, []);

  const addTier = async () => {
    if (!tierName.trim()) return;
    await MonetizationService.addTier(tierName.trim(), tierLimits.trim());
    setTiers(await MonetizationService.listTiers());
    setTierName('');
    setTierLimits('');
  };

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Freemium Model</h1>
          <p className="text-slate-600">Define tiers, limits, and entitlements.</p>
        </div>
        <Badge variant="outline">Phase 13</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tier Structure</CardTitle>
          <CardDescription>Configure subscription tiers and limits.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid md:grid-cols-3 gap-3">
            <Input value={tierName} onChange={(event) => setTierName(event.target.value)} placeholder="Tier name" />
            <Input value={tierLimits} onChange={(event) => setTierLimits(event.target.value)} placeholder="Limits" />
            <Button onClick={addTier}>Add Tier</Button>
          </div>
          <div className="space-y-2 text-sm">
            {tiers.length === 0 ? (
              <p className="text-muted-foreground">No tiers configured yet.</p>
            ) : (
              tiers.map((tier) => (
                <div key={tier.id}>
                  <span className="font-semibold">{tier.name}</span>
                  {tier.limits ? <span className="text-slate-500"> · {tier.limits}</span> : null}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
