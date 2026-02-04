import React from 'react';
import AdminNavigation from '@/components/admin/AdminNavigation';

export default function AdminLayout({ children }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <AdminNavigation />
      {children}
    </div>
  );
}
