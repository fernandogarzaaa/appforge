import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function ReportingAnalytics() {
  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Reporting & Analytics</h1>
          <p className="text-slate-600">Executive summaries, SLAs, and scheduled reports.</p>
        </div>
        <Badge variant="outline">Phase 12</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Report Suite</CardTitle>
          <CardDescription>Automated insights for stakeholders.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>• Executive Summaries</p>
          <p>• SLA Tracking</p>
          <p>• Team Performance</p>
          <p>• Cost Attribution</p>
          <p>• PDF / Excel Exports</p>
          <p>• Scheduled Reports</p>
        </CardContent>
      </Card>
    </div>
  );
}
