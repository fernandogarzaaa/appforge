import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Activity, CheckCircle2, Clock } from 'lucide-react';
import { useAppStore } from '@/stores/appStore';

interface AgentActivityWidgetProps {
  expanded?: boolean;
}

export function AgentActivityWidget({ expanded = false }: AgentActivityWidgetProps) {
  const { agents } = useAppStore();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'busy':
        return 'bg-amber-500';
      case 'idle':
        return 'bg-blue-500';
      default:
        return 'bg-slate-500';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
            Active
          </Badge>
        );
      case 'busy':
        return (
          <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
            Busy
          </Badge>
        );
      case 'idle':
        return (
          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
            Idle
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="border-slate-600 text-slate-400">
            Offline
          </Badge>
        );
    }
  };

  const activeAgents = agents.filter((a) => a.status === 'active' || a.status === 'busy').length;
  const totalTasks = agents.reduce((sum: number, a) => sum + a.tasksCompleted, 0);

  return (
    <Card className={`bg-slate-900/50 border-slate-700/50 ${expanded ? 'col-span-full' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <CardTitle className="text-lg text-slate-100">Swarm Agents</CardTitle>
              <p className="text-sm text-slate-500">
                {activeAgents} active · {totalTasks} tasks completed
              </p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className={`grid gap-3 ${expanded ? 'grid-cols-1 md:grid-cols-2' : ''}`}>
          {agents.map((agent) => (
            <div
              key={agent.id}
              className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700/50"
            >
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${getStatusColor(agent.status)}`} />
                <div>
                  <p className="font-medium text-slate-200">{agent.name}</p>
                  <p className="text-xs text-slate-500">{agent.role}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="flex items-center gap-1 text-xs text-slate-400">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>{agent.tasksCompleted}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <Clock className="w-3 h-3" />
                    <span>{agent.lastActivity.toLocaleTimeString()}</span>
                  </div>
                </div>
                {getStatusBadge(agent.status)}
              </div>
            </div>
          ))}
        </div>

        {expanded && (
          <div className="mt-4 pt-4 border-t border-slate-700/50">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-slate-800/50 rounded-lg">
                <Activity className="w-5 h-5 text-blue-400 mx-auto mb-1" />
                <p className="text-2xl font-bold text-slate-200">{activeAgents}</p>
                <p className="text-xs text-slate-500">Active Agents</p>
              </div>
              <div className="text-center p-3 bg-slate-800/50 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-green-400 mx-auto mb-1" />
                <p className="text-2xl font-bold text-slate-200">{totalTasks}</p>
                <p className="text-xs text-slate-500">Tasks Done</p>
              </div>
              <div className="text-center p-3 bg-slate-800/50 rounded-lg">
                <Clock className="w-5 h-5 text-amber-400 mx-auto mb-1" />
                <p className="text-2xl font-bold text-slate-200">99.9%</p>
                <p className="text-xs text-slate-500">Uptime</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
