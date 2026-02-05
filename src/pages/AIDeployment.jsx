import React from 'react';
import AIDeploymentWizard from '@/components/deployment/AIDeploymentWizard';

export default function AIDeployment() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-green-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">AI Deployment Wizard</h1>
          <p className="text-gray-600 mt-1">
            Automated infrastructure setup with CI/CD and monitoring
          </p>
        </div>
        <AIDeploymentWizard />
      </div>
    </div>
  );
}