import React from 'react';
import CodeReviewPanel from '@/components/ai/CodeReviewPanel';

export default function CodeReview() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">AI Code Review</h1>
          <p className="text-gray-600 mt-1">
            Advanced code analysis with security scanning and best practices
          </p>
        </div>
        <CodeReviewPanel />
      </div>
    </div>
  );
}