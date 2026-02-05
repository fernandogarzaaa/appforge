import React from 'react';
import AICapabilitiesControl from '@/components/admin/AICapabilitiesControl';

export default function AdminAIControl() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">AI Capabilities Control</h1>
          <p className="text-gray-600 mt-1">
            Manage and configure superior AI features
          </p>
        </div>
        <AICapabilitiesControl />
      </div>
    </div>
  );
}