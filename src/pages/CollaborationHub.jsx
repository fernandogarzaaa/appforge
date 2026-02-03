import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CollaborationHubService } from '@/services/collaborationHub';

export default function CollaborationHub() {
  const [warRooms, setWarRooms] = useState([]);
  const [activity, setActivity] = useState([]);
  const [roomName, setRoomName] = useState('');
  const [incidentId, setIncidentId] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    let active = true;
    (async () => {
      const [rooms, feed] = await Promise.all([
        CollaborationHubService.listWarRooms(),
        CollaborationHubService.listActivity(),
      ]);
      if (!active) return;
      setWarRooms(rooms);
      setActivity(feed);
    })();
    return () => {
      active = false;
    };
  }, []);

  const createRoom = async () => {
    if (!roomName.trim()) return;
    await CollaborationHubService.createWarRoom(roomName.trim(), incidentId.trim());
    setWarRooms(await CollaborationHubService.listWarRooms());
    setRoomName('');
    setIncidentId('');
  };

  const logActivity = async () => {
    if (!note.trim()) return;
    const entry = await CollaborationHubService.logActivity({ note: note.trim() });
    setActivity((prev) => [entry, ...prev]);
    setNote('');
  };

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Collaboration Hub</h1>
          <p className="text-slate-600">War room mode, playbooks, and team activity.</p>
        </div>
        <Badge variant="outline">Phase 6</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>War Rooms</CardTitle>
          <CardDescription>Spin up an incident war room.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid md:grid-cols-3 gap-3">
            <Input value={roomName} onChange={(event) => setRoomName(event.target.value)} placeholder="War room name" />
            <Input value={incidentId} onChange={(event) => setIncidentId(event.target.value)} placeholder="Incident ID" />
            <Button onClick={createRoom}>Create</Button>
          </div>
          <div className="space-y-2 text-sm">
            {warRooms.length === 0 ? (
              <p className="text-muted-foreground">No war rooms yet.</p>
            ) : (
              warRooms.map((room) => (
                <div key={room.id} className="flex items-center justify-between">
                  <span>{room.name} {room.incidentId && `· ${room.incidentId}`}</span>
                  <Badge variant="secondary">Active</Badge>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Activity Feed</CardTitle>
          <CardDescription>Log investigation updates.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input value={note} onChange={(event) => setNote(event.target.value)} placeholder="Add activity note" />
            <Button onClick={logActivity}>Log</Button>
          </div>
          <div className="space-y-2 text-sm">
            {activity.length === 0 ? (
              <p className="text-muted-foreground">No activity logged yet.</p>
            ) : (
              activity.map((entry) => (
                <div key={entry.id} className="text-slate-600">• {entry.note}</div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
