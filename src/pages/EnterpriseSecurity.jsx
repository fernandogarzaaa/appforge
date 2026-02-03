import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function EnterpriseSecurity() {
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
        <CardContent className="space-y-2 text-sm">
          <p>• SOC 2 Compliance</p>
          <p>• Data Encryption</p>
          <p>• IP Whitelisting</p>
          <p>• Secrets Management</p>
          <p>• Compliance Reports</p>
          <p>• Penetration Testing</p>
        </CardContent>
      </Card>
    </div>
  );
}
