import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, Square, RefreshCw, Server } from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { toast } from 'sonner';

interface ServiceStatusWidgetProps {
  expanded?: boolean;
}

export function ServiceStatusWidget({ expanded = false }: ServiceStatusWidgetProps) {
  const { services, startService, stopService } = useAppStore();

  const handleToggleService = async (service: typeof services[0]) => {
    try {
      if (service.status === 'running') {
        await stopService(service.name);
        toast.success(`${service.name} stopped`);
      } else {
        await startService(service.name);
        toast.success(`${service.name} started`);
      }
    } catch (error) {
      toast.error(`Failed to ${service.status === 'running' ? 'stop' : 'start'} ${service.name}`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-green-500';
      case 'starting':
        return 'bg-amber-500 animate-pulse';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-slate-500';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'running':
        return (
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
            Running
          </Badge>
        );
      case 'starting':
        return (
          <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
            Starting...
          </Badge>
        );
      case 'error':
        return (
          <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
            Error
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="border-slate-600 text-slate-400">
            Stopped
          </Badge>
        );
    }
  };

  const runningCount = services.filter((s) => s.status === 'running').length;

  return (
    <Card className={`bg-slate-900/50 border-slate-700/50 ${expanded ? 'col-span-full' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Server className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-lg text-slate-100">Services</CardTitle>
              <p className="text-sm text-slate-500">
                {runningCount} of {services.length} running
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-slate-400 hover:text-slate-200"
            onClick={() => toast.info('Refreshing service status...')}
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className={`grid gap-3 ${expanded ? 'grid-cols-1 md:grid-cols-2' : ''}`}>
          {services.map((service) => (
            <div
              key={service.name}
              className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700/50"
            >
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${getStatusColor(service.status)}`} />
                <div>
                  <p className="font-medium text-slate-200">{service.name}</p>
                  {service.pid && (
                    <p className="text-xs text-slate-500">PID: {service.pid}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                {getStatusBadge(service.status)}
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-8 w-8 ${
                    service.status === 'running'
                      ? 'text-red-400 hover:text-red-300 hover:bg-red-500/10'
                      : 'text-green-400 hover:text-green-300 hover:bg-green-500/10'
                  }`}
                  onClick={() => handleToggleService(service)}
                  disabled={service.status === 'starting'}
                >
                  {service.status === 'running' ? (
                    <Square className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )
                  }
                </Button>
              </div>
            </div>
          ))}
        </div>

        {expanded && (
          <div className="mt-4 pt-4 border-t border-slate-700/50">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Total Memory Usage</span>
              <span className="text-slate-300">
                {(services.filter((s) => s.status === 'running').length * 150).toFixed(0)} MB
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
