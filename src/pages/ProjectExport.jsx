// @ts-ignore - Component uses runtime base44.functions.execute API
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Download, Upload, Github, FileJson, CheckCircle } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function ProjectExport() {
  const [projectId, setProjectId] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [importData, setImportData] = useState('');
  const [includeData, setIncludeData] = useState(false);

  // Export project
  const exportProject = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.execute('projectExportImport', {
        action: 'export',
        projectId,
        format: 'json',
        includeData
      });
      return response.data;
    },
    onSuccess: (data) => {
      // Download as JSON file
      const blob = new Blob([JSON.stringify(data.export, null, 2)], { 
        type: 'application/json' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${projectId}_export.json`;
      a.click();
    }
  });

  // Import from JSON
  const importFromJson = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.execute('projectExportImport', {
        action: 'import',
        source: 'json',
        data: JSON.parse(importData)
      });
      return response.data;
    }
  });

  // Import from GitHub
  const importFromGithub = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.execute('projectExportImport', {
        action: 'import',
        source: 'github',
        githubUrl
      });
      return response.data;
    }
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Project Export & Import</h1>
        <p className="text-muted-foreground">
          Export projects as portable JSON or import from multiple sources including GitHub.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Export */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="w-5 h-5" />
              Export Project
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Project ID</Label>
              <Input
                placeholder="Enter project ID to export"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="includeData"
                checked={includeData}
                onChange={(e) => setIncludeData(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="includeData">Include data (entities & records)</Label>
            </div>

            <Button 
              className="w-full"
              onClick={() => exportProject.mutate()}
              disabled={!projectId || exportProject.isPending}
            >
              <Download className="w-4 h-4 mr-2" />
              {exportProject.isPending ? 'Exporting...' : 'Export as JSON'}
            </Button>

            {exportProject.isSuccess && (
              <div className="flex items-center gap-2 text-green-600 text-sm">
                <CheckCircle className="w-4 h-4" />
                Project exported successfully!
              </div>
            )}

            <div className="text-sm text-muted-foreground">
              <p className="font-semibold mb-2">Export includes:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Project metadata & configuration</li>
                <li>All entities & their schemas</li>
                <li>Pages & components</li>
                <li>Serverless functions</li>
                {includeData && <li>Entity data & records</li>}
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Import */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileJson className="w-5 h-5" />
                Import from JSON
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Project JSON</Label>
                <Textarea
                  placeholder="Paste exported JSON here..."
                  value={importData}
                  onChange={(e) => setImportData(e.target.value)}
                  rows={6}
                  className="font-mono text-sm"
                />
              </div>

              <Button 
                className="w-full"
                onClick={() => importFromJson.mutate()}
                disabled={!importData || importFromJson.isPending}
              >
                <Upload className="w-4 h-4 mr-2" />
                {importFromJson.isPending ? 'Importing...' : 'Import Project'}
              </Button>

              {importFromJson.isSuccess && (
                <div className="flex items-center gap-2 text-green-600 text-sm">
                  <CheckCircle className="w-4 h-4" />
                  Project imported! ID: {importFromJson.data?.projectId}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Github className="w-5 h-5" />
                Import from GitHub
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>GitHub Repository URL</Label>
                <Input
                  placeholder="https://github.com/username/repo"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                />
              </div>

              <Button 
                className="w-full"
                onClick={() => importFromGithub.mutate()}
                disabled={!githubUrl || importFromGithub.isPending}
              >
                <Github className="w-4 h-4 mr-2" />
                {importFromGithub.isPending ? 'Importing...' : 'Import from GitHub'}
              </Button>

              {importFromGithub.isSuccess && (
                <div className="flex items-center gap-2 text-green-600 text-sm">
                  <CheckCircle className="w-4 h-4" />
                  Repository imported successfully!
                </div>
              )}

              <div className="text-sm text-muted-foreground">
                <p>Automatically detects and imports:</p>
                <ul className="list-disc list-inside space-y-1 mt-2">
                  <li>React components</li>
                  <li>API endpoints</li>
                  <li>Database schemas</li>
                  <li>Configuration files</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
