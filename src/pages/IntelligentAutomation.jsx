import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { IntelligentAutomationService } from '@/services/intelligentAutomation';

export default function IntelligentAutomation() {
  const [automations, setAutomations] = useState([]);
  const [automationName, setAutomationName] = useState('');
  const [automationStatus, setAutomationStatus] = useState('draft');

  useEffect(() => {
    let active = true;
    (async () => {
      const items = await IntelligentAutomationService.listAutomations();
      if (active) setAutomations(items);
    })();
    return () => {
      active = false;
    };
  }, []);

  const addAutomation = async () => {
    if (!automationName.trim()) return;
    await IntelligentAutomationService.addAutomation(automationName.trim(), automationStatus.trim() || 'draft');
    setAutomations(await IntelligentAutomationService.listAutomations());
    setAutomationName('');
  };

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Intelligent Automation</h1>
          <p className="text-slate-600">Automation and self-healing workflows.</p>
        </div>
        <Badge variant="outline">Phase 17</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Automation Capabilities</CardTitle>
          <CardDescription>Proactive and automated incident response.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid md:grid-cols-3 gap-3">
            <Input value={automationName} onChange={(event) => setAutomationName(event.target.value)} placeholder="Automation name" />
            <Input value={automationStatus} onChange={(event) => setAutomationStatus(event.target.value)} placeholder="Status" />
            <Button onClick={addAutomation}>Add Automation</Button>
          </div>
          <div className="space-y-2 text-sm">
            {automations.length === 0 ? (
              <p className="text-muted-foreground">No automations defined yet.</p>
            ) : (
              automations.map((automation) => (
                <div key={automation.id}>
                  <span className="font-semibold">{automation.name}</span>
                  <span className="text-slate-500"> · {automation.status}</span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
