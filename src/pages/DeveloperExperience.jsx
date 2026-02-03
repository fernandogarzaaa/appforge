import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DeveloperExperienceService } from '@/services/developerExperience';

export default function DeveloperExperience() {
  const commands = DeveloperExperienceService.listCommands();
  const sdks = DeveloperExperienceService.listSdks();

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Developer Experience</h1>
          <p className="text-slate-600">CLI, SDKs, and automation tooling.</p>
        </div>
        <Badge variant="outline">Phase 10</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>DX Toolkit</CardTitle>
          <CardDescription>Command-line workflows and SDKs.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <p className="font-semibold">CLI Commands</p>
            <div className="space-y-1 text-slate-600">
              {commands.map((command) => (
                <div key={command}>{command}</div>
              ))}
            </div>
          </div>
          <div>
            <p className="font-semibold">SDKs</p>
            <div className="space-y-1 text-slate-600">
              {sdks.map((sdk) => (
                <div key={sdk.language}>
                  {sdk.language} · {sdk.package}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
