import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ReportingAnalyticsService } from '@/services/reportingAnalytics';

export default function ReportingAnalytics() {
  const [reports, setReports] = useState([]);
  const [reportName, setReportName] = useState('');
  const [cadence, setCadence] = useState('Weekly');

  useEffect(() => {
    let active = true;
    (async () => {
      const items = await ReportingAnalyticsService.listReports();
      if (active) setReports(items);
    })();
    return () => {
      active = false;
    };
  }, []);

  const scheduleReport = async () => {
    if (!reportName.trim()) return;
    await ReportingAnalyticsService.scheduleReport(reportName.trim(), cadence.trim());
    setReports(await ReportingAnalyticsService.listReports());
    setReportName('');
  };

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
        <CardContent className="space-y-3">
          <div className="grid md:grid-cols-3 gap-3">
            <Input value={reportName} onChange={(event) => setReportName(event.target.value)} placeholder="Report name" />
            <Input value={cadence} onChange={(event) => setCadence(event.target.value)} placeholder="Cadence" />
            <Button onClick={scheduleReport}>Schedule</Button>
          </div>
          <div className="space-y-2 text-sm">
            {reports.length === 0 ? (
              <p className="text-muted-foreground">No scheduled reports yet.</p>
            ) : (
              reports.map((report) => (
                <div key={report.id}>
                  <span className="font-semibold">{report.name}</span>
                  <span className="text-slate-500"> · {report.cadence}</span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
