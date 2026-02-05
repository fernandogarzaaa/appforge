import React from 'react';
import TemplateManagement from '@/components/admin/TemplateManagement';

export default function AdminTemplates() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Template Management</h1>
          <p className="text-gray-600 mt-1">
            Manage AI-generated project templates
          </p>
        </div>
        <TemplateManagement />
      </div>
    </div>
  );
}