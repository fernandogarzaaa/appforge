import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

export function StandupReportGenerator() {
  const [yesterday, setYesterday] = useState('');
  const [today, setToday] = useState('');
  const [blockers, setBlockers] = useState('');
  const [report, setReport] = useState('');

  const handleGenerate = () => {
    const summary = [
      `Yesterday: ${yesterday || 'N/A'}`,
      `Today: ${today || 'N/A'}`,
      `Blockers: ${blockers || 'None'}`,
    ].join('\n');
    setReport(summary);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Standup Report</CardTitle>
        <CardDescription>Generate structured standup summaries.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea value={yesterday} onChange={(event) => setYesterday(event.target.value)} placeholder="Yesterday" rows={3} />
        <Textarea value={today} onChange={(event) => setToday(event.target.value)} placeholder="Today" rows={3} />
        <Textarea value={blockers} onChange={(event) => setBlockers(event.target.value)} placeholder="Blockers" rows={2} />
        <Button onClick={handleGenerate}>Generate</Button>
        {report && (
          <pre className="bg-slate-900 text-slate-100 text-xs p-3 rounded-lg whitespace-pre-wrap">
            {report}
          </pre>
        )}
      </CardContent>
    </Card>
  );
}
