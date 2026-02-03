import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { IncidentIntelligenceService } from '@/services/incidentIntelligence';

export default function IncidentIntelligence() {
  const [question, setQuestion] = useState('');
  const [result, setResult] = useState(null);
  const [events, setEvents] = useState(() => IncidentIntelligenceService.reconstructTimeline());

  const handleQuery = () => {
    const response = IncidentIntelligenceService.queryIncident(question);
    setResult(response);
  };

  const handleSeed = () => {
    IncidentIntelligenceService.recordEvent({
      type: 'checkout',
      message: 'Checkout failed at 3pm due to payment gateway timeout',
      severity: 'high',
    });
    IncidentIntelligenceService.recordEvent({
      type: 'database',
      message: 'Database latency spike detected in us-east-1',
      severity: 'medium',
    });
    setEvents(IncidentIntelligenceService.reconstructTimeline());
  };

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Incident Intelligence</h1>
          <p className="text-slate-600">AI-powered incident queries and remediation hints.</p>
        </div>
        <Badge variant="outline">Phase 3</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ask a Question</CardTitle>
          <CardDescription>Example: Why did checkout fail at 3pm?</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask about an incident..." />
            <Button onClick={handleQuery}>Query</Button>
          </div>
          <Button variant="outline" onClick={handleSeed}>Seed Sample Events</Button>
          {result && (
            <div className="bg-slate-50 p-3 rounded-lg text-sm">
              <p className="font-semibold">{result.answer}</p>
              <div className="mt-2 space-y-1">
                {result.related.map((event) => (
                  <div key={event.id} className="text-slate-600">• {event.message}</div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Incident Timeline</CardTitle>
          <CardDescription>AI reconstructed narrative of recent events.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {events.length === 0 ? (
            <p className="text-muted-foreground">No events yet.</p>
          ) : (
            events.map((event) => (
              <div key={event.id} className="flex items-center justify-between">
                <span>{event.message}</span>
                <Badge variant="secondary">{event.severity}</Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
