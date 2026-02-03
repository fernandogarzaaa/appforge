import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function IntegrationEcosystem() {
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
          <CardTitle>Priority Integrations</CardTitle>
          <CardDescription>Prometheus, PagerDuty, Slack, Kubernetes, and more.</CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-2 text-sm">
          <p>• Prometheus / Grafana</p>
          <p>• PagerDuty / Opsgenie</p>
          <p>• Slack / Teams</p>
          <p>• Kubernetes</p>
          <p>• Datadog / New Relic</p>
          <p>• Terraform / CloudFormation</p>
          <p>• GitHub / GitLab</p>
          <p>• Jira</p>
        </CardContent>
      </Card>
    </div>
  );
}
