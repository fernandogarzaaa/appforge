import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Bell,
  User,
  LogOut,
  Settings,
  Minus,
  Square,
  X,
  Sun,
} from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { toast } from 'sonner';

export function Header() {
  const { services, shutdownApp } = useAppStore();
  const [notifications] = useState(3);

  const runningServices = services.filter((s) => s.status === 'running').length;

  const handleMinimize = () => {
    window.electron?.minimize?.();
  };

  const handleMaximize = () => {
    window.electron?.maximize?.();
  };

  const handleClose = async () => {
    await shutdownApp();
    window.electron?.close?.();
  };

  const handleLogout = () => {
    toast.info('Logout functionality coming soon');
  };

  return (
    <header className="h-16 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-6">
      {/* Left side - Status */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${runningServices > 0 ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
          <span className="text-sm text-slate-400">
            {runningServices} service{runningServices !== 1 ? 's' : ''} running
          </span>
        </div>
        <Badge variant="outline" className="border-slate-700 text-slate-400">
          v3.0.0
        </Badge>
      </div>

      {/* Right side - Actions */}
      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="text-slate-400 hover:text-slate-200"
          onClick={() => toast.info('Theme toggle coming soon')}
        >
          <Sun className="w-4 h-4" />
        </Button>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative text-slate-400 hover:text-slate-200">
              <Bell className="w-4 h-4" />
              {notifications > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center text-white">
                  {notifications}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 bg-slate-900 border-slate-700">
            <DropdownMenuLabel className="text-slate-200">Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-slate-700" />
            <div className="max-h-64 overflow-auto">
              <DropdownMenuItem className="text-slate-400 cursor-pointer">
                <div className="flex flex-col">
                  <span className="text-sm">Swarm agent completed task</span>
                  <span className="text-xs text-slate-500">2 minutes ago</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem className="text-slate-400 cursor-pointer">
                <div className="flex flex-col">
                  <span className="text-sm">Quantum engine initialized</span>
                  <span className="text-xs text-slate-500">5 minutes ago</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem className="text-slate-400 cursor-pointer">
                <div className="flex flex-col">
                  <span className="text-sm">Backend service started</span>
                  <span className="text-xs text-slate-500">10 minutes ago</span>
                </div>
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-200">
              <User className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-slate-900 border-slate-700">
            <DropdownMenuLabel className="text-slate-200">My Account</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-slate-700" />
            <DropdownMenuItem className="text-slate-400 cursor-pointer" onClick={handleLogout}>
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem className="text-slate-400 cursor-pointer" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Window controls */}
        <div className="flex items-center gap-1 ml-4 border-l border-slate-700 pl-4">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-slate-400 hover:text-slate-200"
            onClick={handleMinimize}
          >
            <Minus className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-slate-400 hover:text-slate-200"
            onClick={handleMaximize}
          >
            <Square className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-slate-400 hover:text-red-400 hover:bg-red-500/10"
            onClick={handleClose}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
