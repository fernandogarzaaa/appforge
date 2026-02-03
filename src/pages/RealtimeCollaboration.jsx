import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RealtimeCollaborationService } from '@/services/realtimeCollaboration';

export default function RealtimeCollaboration() {
  const [sessions, setSessions] = useState([]);
  const [topic, setTopic] = useState('');

  useEffect(() => {
    let active = true;
    (async () => {
      const items = await RealtimeCollaborationService.listSessions();
      if (active) setSessions(items);
    })();
    return () => {
      active = false;
    };
  }, []);

  const startSession = async () => {
    if (!topic.trim()) return;
    await RealtimeCollaborationService.startSession(topic.trim());
    setSessions(await RealtimeCollaborationService.listSessions());
    setTopic('');
  };

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Real-time Collaboration</h1>
          <p className="text-slate-600">Presence, shared sessions, and incident calls.</p>
        </div>
        <Badge variant="outline">Phase 17</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Live Collaboration</CardTitle>
          <CardDescription>Real-time incident response sessions.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input value={topic} onChange={(event) => setTopic(event.target.value)} placeholder="Session topic" />
            <Button onClick={startSession}>Start</Button>
          </div>
          <div className="space-y-2 text-sm">
            {sessions.length === 0 ? (
              <p className="text-muted-foreground">No active sessions yet.</p>
            ) : (
              sessions.map((session) => (
                <div key={session.id}>
                  <span className="font-semibold">{session.topic}</span>
                  <span className="text-slate-500"> · {new Date(session.startedAt).toLocaleString()}</span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
