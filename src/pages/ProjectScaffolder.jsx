import React from 'react';
import ProjectScaffolder from '@/components/ai/ProjectScaffolder';
import { createPageUrl } from '@/utils';
import { useNavigate } from 'react-router-dom';

export default function ProjectScaffolderPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        <ProjectScaffolder
          onProjectCreated={(projectId) => {
            setTimeout(() => {
              navigate(createPageUrl('Projects'));
            }, 2000);
          }}
        />
      </div>
    </div>
  );
}