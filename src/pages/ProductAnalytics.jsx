import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ProductAnalyticsService } from '@/services/productAnalytics';

export default function ProductAnalytics() {
  const [events, setEvents] = useState([]);
  const [eventName, setEventName] = useState('');
  const [eventValue, setEventValue] = useState('');
  const [eventSource, setEventSource] = useState('UI');

  useEffect(() => {
    let active = true;
    (async () => {
      const items = await ProductAnalyticsService.listEvents();
      if (active) setEvents(items);
    })();
    return () => {
      active = false;
    };
  }, []);

  const recordEvent = async () => {
    if (!eventName.trim()) return;
    await ProductAnalyticsService.recordEvent({
      name: eventName.trim(),
      value: eventValue.trim(),
      source: eventSource.trim(),
      timestamp: new Date().toISOString(),
    });
    setEvents(await ProductAnalyticsService.listEvents());
    setEventName('');
    setEventValue('');
  };

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Product Analytics</h1>
          <p className="text-slate-600">Track feature adoption and platform usage.</p>
        </div>
        <Badge variant="outline">Phase 16</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Analytics Metrics</CardTitle>
          <CardDescription>Log usage signals from the platform.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid md:grid-cols-4 gap-3">
            <Input value={eventName} onChange={(event) => setEventName(event.target.value)} placeholder="Event name" />
            <Input value={eventValue} onChange={(event) => setEventValue(event.target.value)} placeholder="Value" />
            <Input value={eventSource} onChange={(event) => setEventSource(event.target.value)} placeholder="Source" />
            <Button onClick={recordEvent}>Record</Button>
          </div>
          <div className="space-y-2 text-sm">
            {events.length === 0 ? (
              <p className="text-muted-foreground">No events recorded yet.</p>
            ) : (
              events.map((entry) => (
                <div key={entry.id}>
                  <span className="font-semibold">{entry.name}</span>
                  <span className="text-slate-500"> · {entry.value || 'n/a'}</span>
                  <span className="text-slate-400"> · {entry.source}</span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
