import React from 'react';
import { Bell, Search, User, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function Header({ user, onLogout }) {
  const initials = user?.full_name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase() || 'U';

  return (
    <header className="h-14 bg-white/60 backdrop-blur-xl border-b border-gray-200/50 flex items-center justify-between px-4 sticky top-0 z-40">
      {/* Search */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <Input
            placeholder="Search..."
            className="pl-8 bg-gray-100/50 border-0 rounded-lg h-8 text-[13px] focus:bg-white focus:ring-1 focus:ring-gray-300 transition-all"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5">
        <Button variant="ghost" size="icon" className="relative h-8 w-8 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100/70">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-gray-900 rounded-full" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 gap-2 px-2 rounded-lg hover:bg-gray-100/70">
              <Avatar className="h-6 w-6">
                <AvatarImage src={user?.avatar} />
                <AvatarFallback className="bg-gray-900 text-white text-[10px] font-medium">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="text-left hidden sm:block">
                <p className="text-[13px] font-medium text-gray-900">{user?.full_name || 'User'}</p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 rounded-lg p-1">
            <DropdownMenuItem className="rounded-md cursor-pointer text-[13px]">
              <User className="w-3.5 h-3.5 mr-2" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem className="rounded-md cursor-pointer text-[13px]">
              <Settings className="w-3.5 h-3.5 mr-2" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={onLogout}
              className="rounded-md cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 text-[13px]"
            >
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}