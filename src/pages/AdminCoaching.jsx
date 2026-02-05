import React from 'react';
import CoachingSystemAdmin from '@/components/admin/CoachingSystemAdmin';

export default function AdminCoaching() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-cyan-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Coaching System</h1>
          <p className="text-gray-600 mt-1">Manage coaching and learning configurations</p>
        </div>
        <CoachingSystemAdmin />
      </div>
    </div>
  );
}