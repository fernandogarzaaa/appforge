import React from 'react';
import { Button } from '@/components/ui/button';
import { LogOut, User, Search } from 'lucide-react';
import { DarkModeToggle } from '@/components/DarkModeToggle';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function Header({ user, onLogout, onSearchOpen }) {
  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex items-center justify-between">
      <div>
        <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Development Studio</h1>
        <p className="text-xs text-gray-500 dark:text-gray-400">AI-powered application builder</p>
      </div>

      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          className="text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 hidden sm:flex"
          onClick={onSearchOpen}
        >
          <Search className="w-4 h-4 mr-2" />
          <span className="hidden md:inline text-xs">Search...</span>
          <kbd className="ml-auto hidden md:inline-block px-1.5 py-0.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-800">
            ⌘K
          </kbd>
        </Button>
        <DarkModeToggle />
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">
                    {user.full_name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{user.full_name}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem className="text-xs text-gray-500 dark:text-gray-400">
                <User className="w-4 h-4 mr-2" />
                {user.email}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onLogout} className="text-red-600 dark:text-red-400">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}