import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function CollaborationHub() {
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
          <CardTitle>Collaboration Features</CardTitle>
          <CardDescription>Coordinate incident response across teams.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>• War Room Mode</p>
          <p>• Incident Playbooks</p>
          <p>• Knowledge Base</p>
          <p>• Team Activity Feed</p>
          <p>• Mentions and Comments</p>
        </CardContent>
      </Card>
    </div>
  );
}
