import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Package, FileCode, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function OfflineAgentExporter({ agent, onClose }) {
  const [exporting, setExporting] = useState(false);
  const [exportType, setExportType] = useState('desktop');
  const [exportStatus, setExportStatus] = useState(null);

  const exportAgent = async () => {
    setExporting(true);
    setExportStatus(null);

    try {
      // Generate the export package
      const response = await base44.functions.invoke('exportAgentOffline', {
        agent_id: agent.id,
        export_type: exportType
      });

      if (response.data.success) {
        setExportStatus({ type: 'success', message: 'Export ready!' });
        
        // Download the package
        const blob = new Blob([JSON.stringify(response.data.package, null, 2)], { 
          type: 'application/json' 
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${agent.agent_name.replace(/\s+/g, '_')}_offline_${exportType}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();

        // Also download README
        if (response.data.readme) {
          const readmeBlob = new Blob([response.data.readme], { type: 'text/markdown' });
          const readmeUrl = window.URL.createObjectURL(readmeBlob);
          const readmeLink = document.createElement('a');
          readmeLink.href = readmeUrl;
          readmeLink.download = `${agent.agent_name.replace(/\s+/g, '_')}_README.md`;
          document.body.appendChild(readmeLink);
          readmeLink.click();
          window.URL.revokeObjectURL(readmeUrl);
          readmeLink.remove();
        }
      }
    } catch (error) {
      console.error('Export error:', error);
      setExportStatus({ 
        type: 'error', 
        message: error.message || 'Export failed' 
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <Card className="border-blue-200 bg-blue-50/30">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Download className="w-4 h-4" />
          Download Offline Agent
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-xs text-gray-600 mb-3">
            Export your agent for offline use. Choose a format:
          </p>

          <div className="space-y-2">
            {/* Desktop App - RECOMMENDED */}
            <button
              onClick={() => setExportType('desktop')}
              className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                exportType === 'desktop'
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-green-300'
              }`}
            >
              <div className="flex items-start gap-2">
                <Package className="w-5 h-5 mt-0.5 text-green-600" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold">Desktop Application</p>
                    <Badge className="bg-green-600 text-white">RECOMMENDED</Badge>
                  </div>
                  <p className="text-xs text-gray-600 mb-2">
                    Complete desktop app with installer - just click and use! Perfect for beginners.
                  </p>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="outline" className="text-xs">✨ Easy Setup</Badge>
                    <Badge variant="outline" className="text-xs">🖥️ Windows/Mac/Linux</Badge>
                    <Badge variant="outline" className="text-xs">🔒 100% Private</Badge>
                    <Badge variant="outline" className="text-xs">📦 All-in-One</Badge>
                  </div>
                </div>
              </div>
            </button>

            {/* Standalone Format */}
            <button
              onClick={() => setExportType('standalone')}
              className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                exportType === 'standalone'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              <div className="flex items-start gap-2">
                <Package className="w-4 h-4 mt-0.5 text-blue-600" />
                <div className="flex-1">
                  <p className="font-semibold text-sm">Standalone Package</p>
                  <p className="text-xs text-gray-600">
                    Complete agent package with local LLM support (Ollama, LM Studio)
                  </p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    <Badge variant="outline" className="text-xs">No API Keys</Badge>
                    <Badge variant="outline" className="text-xs">100% Private</Badge>
                  </div>
                </div>
              </div>
            </button>

            {/* API Integration */}
            <button
              onClick={() => setExportType('api')}
              className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                exportType === 'api'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              <div className="flex items-start gap-2">
                <FileCode className="w-4 h-4 mt-0.5 text-purple-600" />
                <div className="flex-1">
                  <p className="font-semibold text-sm">API Integration</p>
                  <p className="text-xs text-gray-600">
                    Export for integration with OpenAI, Anthropic, or other APIs
                  </p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    <Badge variant="outline" className="text-xs">Cloud Ready</Badge>
                    <Badge variant="outline" className="text-xs">API Key Required</Badge>
                  </div>
                </div>
              </div>
            </button>

            {/* Python Script */}
            <button
              onClick={() => setExportType('python')}
              className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                exportType === 'python'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              <div className="flex items-start gap-2">
                <FileCode className="w-4 h-4 mt-0.5 text-green-600" />
                <div className="flex-1">
                  <p className="font-semibold text-sm">Python Script</p>
                  <p className="text-xs text-gray-600">
                    Ready-to-run Python script for local or server deployment
                  </p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    <Badge variant="outline" className="text-xs">CLI Ready</Badge>
                    <Badge variant="outline" className="text-xs">Server Deploy</Badge>
                  </div>
                </div>
              </div>
            </button>
          </div>
        </div>

        {exportStatus && (
          <div className={`p-3 rounded-lg border flex items-start gap-2 ${
            exportStatus.type === 'success' 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            {exportStatus.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" />
            )}
            <div className="flex-1">
              <p className="text-sm font-semibold">
                {exportStatus.type === 'success' ? 'Success!' : 'Error'}
              </p>
              <p className="text-xs">{exportStatus.message}</p>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
            disabled={exporting}
          >
            Close
          </Button>
          <Button
            onClick={exportAgent}
            disabled={exporting}
            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600"
          >
            {exporting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Export
              </>
            )}
          </Button>
        </div>

        {exportType === 'desktop' ? (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-xs text-green-900">
              <strong>✨ Perfect for beginners!</strong> The desktop app includes:
              <br/>• Click-to-install setup wizard
              <br/>• Beautiful chat interface (no coding needed)
              <br/>• Built-in local AI (works offline)
              <br/>• Automatic updates
            </p>
          </div>
        ) : (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-xs text-amber-900">
              <strong>Note:</strong> Exported agents can run completely offline with local LLMs 
              like Ollama or LM Studio. No internet connection required after setup.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}