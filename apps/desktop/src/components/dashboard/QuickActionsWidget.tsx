import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, Square, RefreshCw, Terminal, Settings, Bug, Zap, RotateCcw } from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { toast } from 'sonner';

export function QuickActionsWidget() {
  const { services, startService, stopService } = useAppStore();

  const allRunning = services.every((s) => s.status === 'running');

  const handleStartAll = async () => {
    toast.promise(
      Promise.all(services.map((s) => startService(s.name))),
      {
        loading: 'Starting all services...',
        success: 'All services started',
        error: 'Failed to start some services',
      }
    );
  };

  const handleStopAll = async () => {
    toast.promise(
      Promise.all(services.map((s) => stopService(s.name))),
      {
        loading: 'Stopping all services...',
        success: 'All services stopped',
        error: 'Failed to stop some services',
      }
    );
  };

  const actions = [
    {
      label: allRunning ? 'Stop All' : 'Start All',
      icon: allRunning ? Square : Play,
      onClick: allRunning ? handleStopAll : handleStartAll,
      className: allRunning
        ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
        : 'bg-green-500/20 text-green-400 hover:bg-green-500/30',
    },
    {
      label: 'Restart',
      icon: RefreshCw,
      onClick: () => toast.info('Restart functionality coming soon'),
      className: 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30',
    },
    {
      label: 'Terminal',
      icon: Terminal,
      onClick: () => toast.info('Terminal opening soon'),
      className: 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30',
    },
    {
      label: 'Settings',
      icon: Settings,
      onClick: () => toast.info('Settings panel coming soon'),
      className: 'bg-slate-500/20 text-slate-400 hover:bg-slate-500/30',
    },
    {
      label: 'Debug',
      icon: Bug,
      onClick: () => toast.info('Debug mode activated'),
      className: 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30',
    },
    {
      label: 'Reset',
      icon: RotateCcw,
      onClick: () => toast.info('Reset functionality coming soon'),
      className: 'bg-red-500/20 text-red-400 hover:bg-red-500/30',
    },
  ];

  return (
    <Card className="bg-slate-900/50 border-slate-700/50">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
            <Zap className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <CardTitle className="text-lg text-slate-100">Quick Actions</CardTitle>
            <p className="text-sm text-slate-500">Common operations</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2">
          {actions.map((action) => (
            <Button
              key={action.label}
              variant="ghost"
              onClick={action.onClick}
              className={`w-full justify-start gap-2 ${action.className}`}
            >
              <action.icon className="w-4 h-4" />
              {action.label}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
