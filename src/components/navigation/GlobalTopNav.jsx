import React from 'react';
import { LogOut, User, Search } from 'lucide-react';
import { DarkModeToggle } from '@/components/DarkModeToggle';
import { NotificationBell } from '@/components/NotificationBell';
import SearchBar from '@/components/navigation/SearchBar';
import Breadcrumbs from '@/components/navigation/Breadcrumbs';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNavigation } from '@/contexts/NavigationContext';

export default function GlobalTopNav({ user, onLogout, mobileMenu, title = 'AppForge' }) {
  const { openSearch } = useNavigation();
  const MenuContent = /** @type {any} */ (DropdownMenuContent);
  const MenuItem = /** @type {any} */ (DropdownMenuItem);

  return (
    <header className="bg-white/40 dark:bg-slate-950/40 dark:border-slate-800/30 border-b border-gray-200/40 dark:border-slate-700/30 px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between backdrop-blur-xl sticky top-0 z-40 shadow-sm dark:shadow-slate-950/20">
      <div className="flex items-center gap-1 sm:gap-3 flex-1 min-w-0">
         {mobileMenu}
         <div className="min-w-0 flex-1">
           <h2 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white truncate">
             {title}
           </h2>
           <div className="hidden sm:block text-xs text-gray-500 dark:text-gray-400">
             <Breadcrumbs />
           </div>
         </div>
       </div>

      <div className="flex items-center gap-1 sm:gap-2 shrink-0 min-h-10">
         <div className="hidden sm:block">
           <SearchBar onOpen={openSearch} placeholder="Search..." />
         </div>
         <button
           onClick={openSearch}
           className="sm:hidden p-2 hover:bg-white/50 dark:hover:bg-slate-800/50 rounded-lg transition-colors min-w-9 min-h-9 flex items-center justify-center"
           aria-label="Search"
         >
           <Search className="w-4 h-4 text-gray-600 dark:text-gray-300" />
         </button>
        <DarkModeToggle />
        <NotificationBell />
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 h-9 px-2 sm:px-3 hover:bg-white/50 dark:hover:bg-slate-800/50 rounded-lg"
                >
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-indigo-600 to-indigo-700 dark:from-indigo-500 dark:to-indigo-600 flex items-center justify-center shrink-0 ring-2 ring-white/30">
                  <span className="text-white text-xs sm:text-sm font-bold">
                    {user.full_name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden md:inline truncate max-w-[120px]">
                  {user.full_name}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <MenuContent
              align="end"
              className="w-56 bg-white/90 dark:bg-slate-900/90 dark:border-slate-800/50 backdrop-blur-md border border-white/20 dark:border-slate-700/50"
            >
              <MenuItem className="text-xs text-gray-500 dark:text-gray-400 py-2">
                <User className="w-4 h-4 mr-2 shrink-0" />
                <span className="truncate">{user.email}</span>
              </MenuItem>
              <MenuItem
                onClick={onLogout}
                className="text-red-600 dark:text-red-400 dark:hover:bg-slate-800 py-2"
              >
                <LogOut className="w-4 h-4 mr-2 shrink-0" />
                Logout
              </MenuItem>
            </MenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}