import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Rocket, Server, Database, Lock, Activity, FileCode, Download } from 'lucide-react';

export default function AIDeploymentWizard({ projectId }) {
  const [description, setDescription] = useState('');
  const [generating, setGenerating] = useState(false);
  const [config, setConfig] = useState(null);

  const handleGenerate = async () => {
    if (!description.trim()) {
      alert('Please describe your deployment needs');
      return;
    }

    setGenerating(true);
    try {
      const response = await base44.functions.invoke('generateDeploymentConfig', {
        deployment_description: description,
        project_id: projectId
      });

      setConfig(response.data.config);
    } catch (error) {
      console.error('Failed to generate config:', error);
      alert('Failed to generate deployment: ' + error.message);
    } finally {
      setGenerating(false);
    }
  };

  const downloadFile = (content, filename) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Rocket className="w-5 h-5 text-green-600" />
            AI Deployment Wizard
          </CardTitle>
          <p className="text-sm text-gray-600">
            Describe your deployment needs and get instant infrastructure setup
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="e.g., Deploy this Node.js app to AWS with PostgreSQL database, auto-scaling, CI/CD via GitHub Actions, SSL certificate, and CloudWatch monitoring"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="min-h-[120px]"
          />

          <Button
            onClick={handleGenerate}
            disabled={generating}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating Configuration...
              </>
            ) : (
              <>
                <Rocket className="w-4 h-4 mr-2" />
                Generate Deployment Config
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {config && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Deployment Plan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-700">{config.deployment_plan?.summary}</p>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <Server className="w-6 h-6 mx-auto mb-1 text-blue-600" />
                  <div className="text-sm font-semibold">{config.infrastructure?.provider}</div>
                  <div className="text-xs text-gray-600">Provider</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-lg font-bold text-green-600">{config.deployment_plan?.estimated_cost}</div>
                  <div className="text-xs text-gray-600">Est. Cost</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-lg font-bold text-purple-600">{config.deployment_plan?.setup_time}</div>
                  <div className="text-xs text-gray-600">Setup Time</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Configuration Files</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="cicd">
                <TabsList className="grid grid-cols-5 w-full">
                  <TabsTrigger value="cicd">CI/CD</TabsTrigger>
                  <TabsTrigger value="docker">Docker</TabsTrigger>
                  <TabsTrigger value="database">Database</TabsTrigger>
                  <TabsTrigger value="scripts">Scripts</TabsTrigger>
                  <TabsTrigger value="env">Env Vars</TabsTrigger>
                </TabsList>

                <TabsContent value="cicd" className="space-y-3 mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">CI/CD Pipeline</h4>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => downloadFile(config.ci_cd_pipeline?.config_file, '.github/workflows/deploy.yml')}
                    >
                      <Download className="w-3 h-3 mr-1" />
                      Download
                    </Button>
                  </div>
                  <pre className="text-xs bg-gray-900 text-gray-100 p-4 rounded overflow-auto max-h-96">
                    {config.ci_cd_pipeline?.config_file}
                  </pre>
                </TabsContent>

                <TabsContent value="docker" className="space-y-3 mt-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">Dockerfile</h4>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => downloadFile(config.docker_config?.dockerfile, 'Dockerfile')}
                      >
                        <Download className="w-3 h-3 mr-1" />
                        Download
                      </Button>
                    </div>
                    <pre className="text-xs bg-gray-900 text-gray-100 p-4 rounded overflow-auto max-h-60">
                      {config.docker_config?.dockerfile}
                    </pre>
                  </div>
                  {config.docker_config?.docker_compose && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold">docker-compose.yml</h4>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => downloadFile(config.docker_config?.docker_compose, 'docker-compose.yml')}
                        >
                          <Download className="w-3 h-3 mr-1" />
                          Download
                        </Button>
                      </div>
                      <pre className="text-xs bg-gray-900 text-gray-100 p-4 rounded overflow-auto max-h-60">
                        {config.docker_config?.docker_compose}
                      </pre>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="database" className="space-y-3 mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">Migration Script</h4>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => downloadFile(config.database_setup?.migration_script, 'migration.sql')}
                    >
                      <Download className="w-3 h-3 mr-1" />
                      Download
                    </Button>
                  </div>
                  <pre className="text-xs bg-gray-900 text-gray-100 p-4 rounded overflow-auto max-h-80">
                    {config.database_setup?.migration_script}
                  </pre>
                </TabsContent>

                <TabsContent value="scripts" className="space-y-3 mt-4">
                  {config.deployment_scripts?.map((script, idx) => (
                    <div key={idx}>
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="font-semibold">{script.name}</h4>
                          <p className="text-xs text-gray-600">{script.description}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => downloadFile(script.script, `${script.name}.sh`)}
                        >
                          <Download className="w-3 h-3 mr-1" />
                          Download
                        </Button>
                      </div>
                      <pre className="text-xs bg-gray-900 text-gray-100 p-4 rounded overflow-auto max-h-60">
                        {script.script}
                      </pre>
                    </div>
                  ))}
                </TabsContent>

                <TabsContent value="env" className="mt-4">
                  <div className="space-y-2">
                    {config.environment_variables?.map((env, idx) => (
                      <div key={idx} className="p-3 bg-gray-50 rounded border">
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="font-mono text-sm font-semibold">{env.key}</span>
                            {env.required && <Badge className="ml-2 text-xs bg-red-600">Required</Badge>}
                          </div>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">{env.description}</p>
                        {env.example && (
                          <code className="text-xs bg-white px-2 py-1 rounded block mt-1">
                            Example: {env.example}
                          </code>
                        )}
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Setup Instructions</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-2">
                {config.instructions?.map((step, idx) => (
                  <li key={idx} className="flex gap-2">
                    <span className="font-semibold text-blue-600">{idx + 1}.</span>
                    <span className="text-gray-700">{step}</span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}