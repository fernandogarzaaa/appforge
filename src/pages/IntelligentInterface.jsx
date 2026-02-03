import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { IntelligentInterfaceService } from '@/services/intelligentInterface';

export default function IntelligentInterface() {
  const widgets = IntelligentInterfaceService.listWidgets();
  const tours = IntelligentInterfaceService.listTours();

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Intelligent Interface</h1>
          <p className="text-slate-600">Power-user UX enhancements and mobile access.</p>
        </div>
        <Badge variant="outline">Phase 11</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>UX Enhancements</CardTitle>
          <CardDescription>Command palette, dashboards, and guided tours.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <p className="font-semibold">Widgets</p>
            <div className="space-y-1 text-slate-600">
              {widgets.map((widget) => (
                <div key={widget}>{widget}</div>
              ))}
            </div>
          </div>
          <div>
            <p className="font-semibold">Guided Tours</p>
            <div className="space-y-1 text-slate-600">
              {tours.map((tour) => (
                <div key={tour}>{tour}</div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
