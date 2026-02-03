import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EnterpriseSecurityService } from '@/services/enterpriseSecurity';

export default function EnterpriseSecurity() {
  const [controls, setControls] = useState([]);
  const [controlName, setControlName] = useState('');
  const [controlStatus, setControlStatus] = useState('planned');

  useEffect(() => {
    let active = true;
    (async () => {
      const items = await EnterpriseSecurityService.listControls();
      if (active) setControls(items);
    })();
    return () => {
      active = false;
    };
  }, []);

  const addControl = async () => {
    if (!controlName.trim()) return;
    await EnterpriseSecurityService.addControl(controlName.trim(), controlStatus.trim() || 'planned');
    setControls(await EnterpriseSecurityService.listControls());
    setControlName('');
  };

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Enterprise Security</h1>
          <p className="text-slate-600">Compliance, encryption, and security posture.</p>
        </div>
        <Badge variant="outline">Phase 15</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Security Program</CardTitle>
          <CardDescription>SOC 2 readiness and hardened controls.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid md:grid-cols-3 gap-3">
            <Input value={controlName} onChange={(event) => setControlName(event.target.value)} placeholder="Control name" />
            <Input value={controlStatus} onChange={(event) => setControlStatus(event.target.value)} placeholder="Status" />
            <Button onClick={addControl}>Add Control</Button>
          </div>
          <div className="space-y-2 text-sm">
            {controls.length === 0 ? (
              <p className="text-muted-foreground">No controls tracked yet.</p>
            ) : (
              controls.map((control) => (
                <div key={control.id}>
                  <span className="font-semibold">{control.name}</span>
                  <span className="text-slate-500"> · {control.status}</span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
