import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { 
  Github, GitBranch, GitCommit, 
  FolderTree, File, RefreshCw, Check,
  Loader2, Code, ExternalLink, Lock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { featureFlags } from '@/utils/featureFlags';

export default function GitHubIntegration({ projectId, isLocked = false, onUpgrade }) {
  const [repoUrl, setRepoUrl] = useState('');
  const [branch, setBranch] = useState('main');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [commitMessage, setCommitMessage] = useState('');
  const [showCommitDialog, setShowCommitDialog] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const { githubIntegration } = featureFlags;
  const integrationEnabled = githubIntegration;

  const connectRepo = async () => {
    if (!integrationEnabled) {
      toast.error('GitHub integration is not configured.');
      return;
    }
    if (!repoUrl) {
      toast.error('Enter a repository URL');
      return;
    }
    setIsConnecting(true);
    toast.error('GitHub integration backend is not configured for this deployment.');
    setIsConnecting(false);
  };

  const loadFile = async (file) => {
    if (file.type === 'folder') return;
    setSelectedFile(file);
    if (!integrationEnabled) {
      toast.error('GitHub integration is not configured.');
      return;
    }
    setFileContent('');
    toast.error('File loading requires a configured GitHub integration.');
  };

  const syncChanges = async () => {
    if (!integrationEnabled) {
      toast.error('GitHub integration is not configured.');
      return;
    }
    toast.error('Sync requires a configured GitHub integration.');
  };

  const commitChanges = async () => {
    if (!integrationEnabled) {
      toast.error('GitHub integration is not configured.');
      return;
    }
    if (!commitMessage.trim()) {
      toast.error('Enter a commit message');
      return;
    }
    setShowCommitDialog(false);
    toast.error('Commit requires a configured GitHub integration.');
    setCommitMessage('');
  };

  const renderFileTree = (items, depth = 0) => {
    return items.map((item) => (
      <div key={item.path}>
        <button
          onClick={() => loadFile(item)}
          className={cn(
            "w-full flex items-center gap-2 py-1.5 px-2 text-sm hover:bg-gray-100 rounded-lg transition-colors",
            selectedFile?.path === item.path && "bg-indigo-50 text-indigo-700"
          )}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
        >
          {item.type === 'folder' ? (
            <FolderTree className="w-4 h-4 text-yellow-500" />
          ) : (
            <File className="w-4 h-4 text-gray-400" />
          )}
          <span>{item.path.split('/').pop()}</span>
        </button>
        {item.children && renderFileTree(item.children, depth + 1)}
      </div>
    ));
  };

  if (isLocked) {
    return (
      <Card className="rounded-xl border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <Lock className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">GitHub Integration</h3>
          <p className="text-gray-500 text-center text-sm mb-4 max-w-xs">
            Connect your GitHub repository to edit code directly. Available on Pro plan and above.
          </p>
          <Button onClick={onUpgrade} className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl">
            Upgrade to Pro
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!isConnected) {
    return (
      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Github className="w-5 h-5" />
            Connect GitHub Repository
          </CardTitle>
          <CardDescription>
            Link your repository to edit code and sync changes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!integrationEnabled && (
            <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-3 text-sm text-gray-600">
              GitHub integration is disabled. Enable `VITE_GITHUB_INTEGRATION` after configuring the backend.
            </div>
          )}
          <div>
            <Label className="text-sm text-gray-600 mb-1.5 block">Repository URL</Label>
            <Input
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="https://github.com/username/repo"
              className="h-11 rounded-xl"
              disabled={!integrationEnabled}
            />
          </div>
          <div>
            <Label className="text-sm text-gray-600 mb-1.5 block">Branch</Label>
            <Input
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              placeholder="main"
              className="h-11 rounded-xl"
              disabled={!integrationEnabled}
            />
          </div>
          <Button
            onClick={connectRepo}
            disabled={isConnecting || !integrationEnabled}
            className="w-full h-11 bg-gray-900 hover:bg-gray-800 text-white rounded-xl"
          >
            {isConnecting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Github className="w-4 h-4 mr-2" />
            )}
            {isConnecting ? 'Connecting...' : 'Connect Repository'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Connection Status */}
      <Card className="rounded-xl">
        <CardContent className="py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Github className="w-5 h-5" />
              <div>
                <p className="font-medium text-sm">{repoUrl.replace('https://github.com/', '')}</p>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <GitBranch className="w-3 h-3" />
                  {branch}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-green-100 text-green-700">
                <Check className="w-3 h-3 mr-1" />
                Connected
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={syncChanges}
                disabled={isSyncing}
                className="rounded-lg"
              >
                {isSyncing ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <RefreshCw className="w-3 h-3" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* File Browser & Editor */}
      <div className="grid grid-cols-3 gap-4 h-[400px]">
        {/* File Tree */}
        <Card className="rounded-xl col-span-1">
          <CardHeader className="py-3">
            <CardTitle className="text-sm">Files</CardTitle>
          </CardHeader>
          <ScrollArea className="h-[340px]">
            <div className="px-2 pb-2">
              {renderFileTree(files)}
            </div>
          </ScrollArea>
        </Card>

        {/* Code Editor */}
        <Card className="rounded-xl col-span-2">
          <CardHeader className="py-3 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Code className="w-4 h-4" />
              <CardTitle className="text-sm">
                {selectedFile ? selectedFile.path : 'Select a file'}
              </CardTitle>
            </div>
            {selectedFile && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCommitDialog(true)}
                  className="rounded-lg"
                >
                  <GitCommit className="w-3 h-3 mr-1" />
                  Commit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`${repoUrl}/blob/${branch}/${selectedFile.path}`, '_blank')}
                  className="rounded-lg"
                >
                  <ExternalLink className="w-3 h-3" />
                </Button>
              </div>
            )}
          </CardHeader>
          <div className="h-[340px] bg-[#1e1e1e] rounded-b-xl overflow-hidden">
            {selectedFile ? (
              <Textarea
                value={fileContent}
                onChange={(e) => setFileContent(e.target.value)}
                className="w-full h-full font-mono text-sm bg-transparent text-gray-200 border-0 rounded-none resize-none focus-visible:ring-0 p-4"
                spellCheck={false}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                Select a file to edit
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Commit Dialog */}
      <Dialog open={showCommitDialog} onOpenChange={setShowCommitDialog}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GitCommit className="w-5 h-5" />
              Commit Changes
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label className="text-sm text-gray-600 mb-1.5 block">Commit Message</Label>
            <Textarea
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              placeholder="Describe your changes..."
              className="rounded-xl resize-none h-24"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCommitDialog(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button onClick={commitChanges} className="bg-gray-900 text-white rounded-xl">
              <GitCommit className="w-4 h-4 mr-2" />
              Commit & Push
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
