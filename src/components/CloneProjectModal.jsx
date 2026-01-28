import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertCircle, CheckCircle2, Copy, Loader } from 'lucide-react';
import { generateCloneName, validateProjectName, getCloneSummary } from '@/lib/projectCloning';

export const CloneProjectModal = ({ open, onClose, project, onCloneSuccess }) => {
  const [step, setStep] = useState('config'); // config, progress, success
  const [cloneName, setCloneName] = useState('');
  const [error, setError] = useState('');
  const [isCloning, setIsCloning] = useState(false);
  const [progress, setProgress] = useState(0);

  // Clone options
  const [copySettings, setCopySettings] = useState(true);
  const [copyDeployments, setCopyDeployments] = useState(false);
  const [copyEnvironmentVars, setCopyEnvironmentVars] = useState(false);
  const [copyTeamMembers, setCopyTeamMembers] = useState(false);

  // Initialize name when modal opens
  useEffect(() => {
    if (open && project) {
      setCloneName(generateCloneName(project.name));
      setError('');
      setStep('config');
      setProgress(0);
    }
  }, [open, project]);

  const handleValidateName = () => {
    const validation = validateProjectName(cloneName);
    if (!validation.isValid) {
      setError(validation.error);
      return false;
    }
    setError('');
    return true;
  };

  const handleClone = async () => {
    if (!handleValidateName()) return;

    setIsCloning(true);
    setStep('progress');
    setProgress(0);

    try {
      // Simulate cloning process with progress
      const steps = [
        { duration: 400, target: 15 },
        { duration: 600, target: 35 },
        { duration: 800, target: 60 },
        { duration: 600, target: 85 },
        { duration: 400, target: 100 }
      ];

      for (const step of steps) {
        await new Promise(resolve => setTimeout(resolve, step.duration));
        setProgress(step.target);
      }

      // Simulate API call to clone project
      await new Promise(resolve => setTimeout(resolve, 500));

      // Create cloned project object
      const clonedProject = {
        id: `project_${Date.now()}`,
        name: cloneName,
        description: project.description ? `${project.description} (Cloned)` : 'Cloned project',
        framework: project.framework || 'react',
        template: project.template,
        visibility: project.visibility || 'private',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        cloned_from: project.id,
        settings: copySettings ? { ...project.settings } : {},
        environment_variables: copyEnvironmentVars ? [...(project.environment_variables || [])] : [],
        team_members: copyTeamMembers ? [...(project.team_members || [])] : [],
        deployments: copyDeployments ? [...(project.deployments || [])] : []
      };

      setStep('success');
      setProgress(100);

      // Notify parent of success
      if (onCloneSuccess) {
        onCloneSuccess(clonedProject);
      }

      // Auto-close after 3 seconds
      setTimeout(() => {
        handleClose();
      }, 3000);
    } catch (err) {
      setError(err.message || 'Failed to clone project');
      setIsCloning(false);
      setStep('config');
    }
  };

  const handleClose = () => {
    setCloneName('');
    setError('');
    setStep('config');
    setProgress(0);
    setCopySettings(true);
    setCopyDeployments(false);
    setCopyEnvironmentVars(false);
    setCopyTeamMembers(false);
    onClose();
  };

  if (!project) return null;

  const summary = getCloneSummary(project, {
    copySettings,
    copyDeployments,
    copyEnvironmentVars,
    copyTeamMembers
  });

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md dark:bg-gray-900 dark:border-gray-800">
        {step === 'config' && (
          <>
            <DialogHeader>
              <DialogTitle className="dark:text-white">Clone Project</DialogTitle>
              <DialogDescription className="dark:text-gray-400">
                Create a copy of "{project.name}" with optional settings
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Project Name Input */}
              <div>
                <Label htmlFor="clone-name" className="dark:text-gray-300">
                  New Project Name
                </Label>
                <Input
                  id="clone-name"
                  value={cloneName}
                  onChange={(e) => {
                    setCloneName(e.target.value);
                    setError('');
                  }}
                  placeholder="Enter project name"
                  className="mt-1 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-500"
                />
                {error && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {error}
                  </p>
                )}
              </div>

              {/* Clone Options */}
              <div className="space-y-3 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <h4 className="font-medium text-sm dark:text-white">What to Clone</h4>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="copy-settings"
                      checked={copySettings}
                      onCheckedChange={setCopySettings}
                      className="dark:border-gray-600"
                    />
                    <Label
                      htmlFor="copy-settings"
                      className="text-sm cursor-pointer dark:text-gray-300"
                    >
                      Project Settings
                    </Label>
                  </div>

                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="copy-env"
                      checked={copyEnvironmentVars}
                      onCheckedChange={setCopyEnvironmentVars}
                      className="dark:border-gray-600"
                    />
                    <Label
                      htmlFor="copy-env"
                      className="text-sm cursor-pointer dark:text-gray-300"
                    >
                      Environment Variables ({(project.environment_variables || []).length})
                    </Label>
                  </div>

                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="copy-team"
                      checked={copyTeamMembers}
                      onCheckedChange={setCopyTeamMembers}
                      className="dark:border-gray-600"
                    />
                    <Label
                      htmlFor="copy-team"
                      className="text-sm cursor-pointer dark:text-gray-300"
                    >
                      Team Members ({(project.team_members || []).length})
                    </Label>
                  </div>

                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="copy-deployments"
                      checked={copyDeployments}
                      onCheckedChange={setCopyDeployments}
                      className="dark:border-gray-600"
                    />
                    <Label
                      htmlFor="copy-deployments"
                      className="text-sm cursor-pointer dark:text-gray-300"
                    >
                      Deployment History ({(project.deployments || []).length})
                    </Label>
                  </div>
                </div>
              </div>

              {/* Clone Summary */}
              <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-lg p-3 text-sm">
                <p className="dark:text-blue-300">
                  <strong>Clone Summary:</strong> {summary.itemsToClone.join(', ')} • {summary.size}
                </p>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isCloning}
                className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Cancel
              </Button>
              <Button
                onClick={handleClone}
                disabled={isCloning || !cloneName.trim()}
                className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700"
              >
                <Copy className="w-4 h-4 mr-2" />
                Clone Project
              </Button>
            </DialogFooter>
          </>
        )}

        {step === 'progress' && (
          <div className="space-y-4 py-6">
            <DialogHeader>
              <DialogTitle className="dark:text-white">Cloning Project...</DialogTitle>
            </DialogHeader>

            <div className="space-y-2">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium dark:text-gray-300">{cloneName}</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">{progress}%</span>
              </div>
              <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 dark:bg-blue-500 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400 py-4">
              <Loader className="w-4 h-4 animate-spin" />
              Creating your project clone...
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="space-y-4 py-6 text-center">
            <div className="flex justify-center">
              <CheckCircle2 className="w-12 h-12 text-green-500" />
            </div>
            <h3 className="text-lg font-semibold dark:text-white">Project Cloned!</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              "<strong>{cloneName}</strong>" has been created successfully.
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
              Closing in 3 seconds...
            </p>
            <Button
              onClick={handleClose}
              className="w-full mt-4 bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700"
            >
              Open Project
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CloneProjectModal;
