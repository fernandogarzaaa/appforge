import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Trash2, Download, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';

interface LogsWidgetProps {
  expanded?: boolean;
  maxHeight?: string;
  filter?: 'service' | 'agent';
}

export function LogsWidget({ expanded = false, maxHeight = '200px', filter }: LogsWidgetProps) {
  const { logs, clearLogs } = useAppStore();
  const [levelFilter, setLevelFilter] = useState<'all' | 'info' | 'warn' | 'error'>('all');

  const filteredLogs = logs.filter((log) => {
    if (levelFilter !== 'all' && log.level !== levelFilter) return false;
    if (filter === 'service' && !log.source.toLowerCase().includes('service')) return false;
    if (filter === 'agent' && !log.source.toLowerCase().includes('agent')) return false;
    return true;
  });

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      case 'warn':
        return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      default:
        return <Info className="w-4 h-4 text-blue-400" />;
    }
  };

  const getLevelBadge = (level: string) => {
    switch (level) {
      case 'error':
        return (
          <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-[10px]">
            ERROR
          </Badge>
        );
      case 'warn':
        return (
          <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px]">
            WARN
          </Badge>
        );
      default:
        return (
          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-[10px]">
            INFO
          </Badge>
        );
    }
  };

  const handleClear = () => {
    clearLogs();
    toast.success('Logs cleared');
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `appforge-logs-${new Date().toISOString()}.json`;
    a.click();
    toast.success('Logs exported');
  };

  return (
    <Card className={`bg-slate-900/50 border-slate-700/50 ${expanded ? 'col-span-full' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-700/50 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-slate-400" />
            </div>
            <div>
              <CardTitle className="text-lg text-slate-100">System Logs</CardTitle>
              <p className="text-sm text-slate-500">{filteredLogs.length} entries</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="text-slate-400 hover:text-slate-200"
              onClick={handleExport}
            >
              <Download className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-slate-400 hover:text-red-400"
              onClick={handleClear}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Filter buttons */}
        <div className="flex gap-2 mt-3">
          {(['all', 'info', 'warn', 'error'] as const).map((level) => (
            <Button
              key={level}
              variant="ghost"
              size="sm"
              onClick={() => setLevelFilter(level)}
              className={`text-xs ${
                levelFilter === level
                  ? 'bg-slate-700 text-slate-200'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {level.charAt(0).toUpperCase() + level.slice(1)}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className={expanded ? 'h-96' : ''} style={{ maxHeight: expanded ? undefined : maxHeight }}>
          <div className="space-y-2">
            {filteredLogs.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No logs to display</p>
              </div>
            ) : (
              filteredLogs.slice(0, expanded ? 100 : 10).map((log, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-2 bg-slate-800/30 rounded-lg text-sm"
                >
                  {getLevelIcon(log.level)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {getLevelBadge(log.level)}
                      <span className="text-xs text-slate-500">
                        {log.timestamp.toLocaleTimeString()}
                      </span>
                      <span className="text-xs text-slate-600">[{log.source}]</span>
                    </div>
                    <p className="text-slate-300 break-words">{log.message}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
