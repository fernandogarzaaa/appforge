import React, { useEffect, useMemo, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useViewMode } from '@/contexts/ViewModeContext';

const ACTION_COLORS = {
  created: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200',
  modified: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200',
  deleted: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-200',
};

const formatInitials = (name = '') =>
  name
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

export default function AuditLog({ logs = [], filterBy = {}, className }) {
  const { isBeginnerMode } = useViewMode();
  const [actionFilter, setActionFilter] = useState(filterBy.action || 'all');
  const [userFilter, setUserFilter] = useState(filterBy.user || '');
  const [startDate, setStartDate] = useState(filterBy.startDate || '');
  const [endDate, setEndDate] = useState(filterBy.endDate || '');

  useEffect(() => {
    if (filterBy.action) setActionFilter(filterBy.action);
    if (filterBy.user !== undefined) setUserFilter(filterBy.user);
    if (filterBy.startDate !== undefined) setStartDate(filterBy.startDate);
    if (filterBy.endDate !== undefined) setEndDate(filterBy.endDate);
  }, [filterBy]);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesAction = actionFilter === 'all' || log.action === actionFilter;
      const matchesUser = !userFilter || log.user?.name?.toLowerCase().includes(userFilter.toLowerCase());

      const logDate = log.timestamp ? new Date(log.timestamp) : null;
      const matchesStart = startDate ? logDate && logDate >= new Date(startDate) : true;
      const matchesEnd = endDate ? logDate && logDate <= new Date(endDate) : true;

      return matchesAction && matchesUser && matchesStart && matchesEnd;
    });
  }, [logs, actionFilter, userFilter, startDate, endDate]);

  return (
    <Card className={cn("border-spectrum-indigo-100/60", className)}>
      <CardHeader className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <CardTitle>Audit Log</CardTitle>
          <Badge className="bg-spectrum-indigo-100 text-spectrum-indigo-700 dark:bg-spectrum-indigo-500/20 dark:text-spectrum-indigo-200">
            {filteredLogs.length} entries
          </Badge>
        </div>

        <div className={cn("grid gap-3", isBeginnerMode ? "grid-cols-1" : "grid-cols-1 md:grid-cols-4")}
        >
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Action</Label>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger aria-label="Filter by action">
                <SelectValue placeholder="All actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All actions</SelectItem>
                <SelectItem value="created">Created</SelectItem>
                <SelectItem value="modified">Modified</SelectItem>
                <SelectItem value="deleted">Deleted</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {!isBeginnerMode && (
            <>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">User</Label>
                <Input
                  value={userFilter}
                  onChange={(event) => setUserFilter(event.target.value)}
                  placeholder="Filter by user"
                  aria-label="Filter by user"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Start date</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                  aria-label="Filter by start date"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">End date</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(event) => setEndDate(event.target.value)}
                  aria-label="Filter by end date"
                />
              </div>
            </>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {filteredLogs.length === 0 ? (
          <div className="text-sm text-muted-foreground">No activity found.</div>
        ) : (
          <div className="relative space-y-6 pl-6">
            <div className="absolute left-2 top-0 h-full w-px bg-border" aria-hidden="true" />
            {filteredLogs.map((log) => (
              <div key={log.id || `${log.action}-${log.timestamp}`} className="relative">
                <span
                  className="absolute -left-[5px] top-2 h-3 w-3 rounded-full bg-spectrum-indigo-500"
                  aria-hidden="true"
                />
                <div className="flex flex-col gap-3 rounded-xl border bg-background p-4 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        {log.user?.avatar && <AvatarImage src={log.user.avatar} alt={log.user.name} />}
                        <AvatarFallback>{formatInitials(log.user?.name || 'User')}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {log.user?.name || 'System'}
                        </p>
                        <p className="text-xs text-muted-foreground">{log.description || log.action}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={cn("capitalize", ACTION_COLORS[log.action] || ACTION_COLORS.modified)}>
                        {log.action || 'modified'}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {log.timestamp
                          ? formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })
                          : 'Just now'}
                      </span>
                    </div>
                  </div>
                  {log.metadata && !isBeginnerMode && (
                    <pre className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
                      {JSON.stringify(log.metadata, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}