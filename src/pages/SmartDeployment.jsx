import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import AIDeploymentWizard from '@/components/deployment/AIDeploymentWizard';
import { Sparkles, Rocket, CheckCircle, Clock, AlertCircle } from 'lucide-react';

export default function SmartDeployment() {
  const [showWizard, setShowWizard] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list('-updated_date')
  });

  const { data: deployments = [], isLoading } = useQuery({
    queryKey: ['deployments'],
    queryFn: () => base44.entities.AgentDeployment.list('-created_date', 10)
  });

  const getStatusIcon = (status) => {
    switch (status) {
      case 'deployed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'deploying':
        return <Clock className="w-4 h-4 text-blue-600 animate-pulse" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              AI-Powered Deployment
            </h1>
            <p className="text-gray-600 mt-1">Deploy your applications with intelligent guidance</p>
          </div>
          <Badge className="bg-gradient-to-r from-purple-500 to-blue-600 text-white">
            <Sparkles className="w-3 h-3 mr-1" />
            AI Wizard
          </Badge>
        </div>

        {showWizard ? (
          <div>
            <Button 
              variant="outline" 
              onClick={() => setShowWizard(false)}
              className="mb-4"
            >
              ← Back to Projects
            </Button>
            <AIDeploymentWizard 
              projectId={selectedProject?.id}
              projectType={selectedProject?.type || 'web-app'}
              onComplete={() => {
                setShowWizard(false);
                setSelectedProject(null);
              }}
            />
          </div>
        ) : (
          <>
            {/* Recent Deployments */}
            {deployments.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Recent Deployments</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {deployments.map((deployment) => (
                      <div 
                        key={deployment.id}
                        className="p-4 border rounded-lg flex items-center justify-between hover:bg-gray-50 transition"
                      >
                        <div className="flex items-center gap-3">
                          {getStatusIcon(deployment.status)}
                          <div>
                            <p className="font-medium">{deployment.project_id}</p>
                            <p className="text-sm text-gray-600">
                              {deployment.infrastructure_provider} · {deployment.deployment_region}
                            </p>
                          </div>
                        </div>
                        <Badge variant={deployment.status === 'deployed' ? 'default' : 'secondary'}>
                          {deployment.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Projects List */}
            <Card>
              <CardHeader>
                <CardTitle>Select Project to Deploy</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto" />
                  </div>
                ) : projects.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No projects found. Create a project first.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {projects.map((project) => (
                      <Card 
                        key={project.id}
                        className="hover:shadow-lg transition-all cursor-pointer border-2 hover:border-purple-300"
                        onClick={() => {
                          setSelectedProject(project);
                          setShowWizard(true);
                        }}
                      >
                        <CardContent className="p-6">
                          <h3 className="font-semibold text-lg mb-2">{project.name}</h3>
                          <p className="text-sm text-gray-600 mb-4">
                            {project.description || 'No description'}
                          </p>
                          <Button className="w-full bg-gradient-to-r from-purple-600 to-blue-600">
                            <Rocket className="w-4 h-4 mr-2" />
                            Deploy with AI
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}