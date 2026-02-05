import React from 'react';
import AIAgentControlComponent from '@/components/admin/AIAgentControl';

export default function AIAgentControl() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-purple-950/30">
      <div className="mx-auto p-8 max-w-[1400px]">
        <AIAgentControlComponent />
      </div>
    </div>
  );
}