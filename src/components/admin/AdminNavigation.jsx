import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Settings, Users, Key, Shield, BarChart3, Activity, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AdminNavigation() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const adminMenuItems = [
    {
      label: 'Dashboard',
      path: '/admin',
      icon: BarChart3,
      description: 'System overview and health'
    },
    {
      label: 'API Keys',
      path: '/admin/api-keys',
      icon: Key,
      description: 'Manage API keys'
    },
    {
      label: 'Secrets',
      path: '/admin/secrets',
      icon: Shield,
      description: 'Manage secrets and flags'
    },
    {
      label: 'System Config',
      path: '/admin/system-config',
      icon: Settings,
      description: 'Configure application'
    },
    {
      label: 'Monitoring',
      path: '/admin/monitoring',
      icon: Activity,
      description: 'Live metrics and alerts'
    },
    {
      label: 'Users',
      path: '/admin?tab=users',
      icon: Users,
      description: 'Manage user accounts'
    }
  ];

  const isActive = (path) => {
    const [pathname, search] = path.split('?');
    if (location.pathname !== pathname) return false;
    if (!search) return location.pathname === pathname && !location.search;
    return location.search === `?${search}`;
  };

  return (
    <div className="bg-white border-b border-gray-200 sticky top-16 z-40">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-blue-600" />
              <span className="font-bold text-gray-900">Admin</span>
            </div>
            
            {/* Desktop Menu */}
            <nav className="hidden md:flex gap-1">
              {adminMenuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition ${
                      isActive(item.path)
                        ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                    title={item.description}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden"
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden pb-4 space-y-2">
            {adminMenuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 w-full px-4 py-2 rounded-lg transition ${
                    isActive(item.path)
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-gray-500">{item.description}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
