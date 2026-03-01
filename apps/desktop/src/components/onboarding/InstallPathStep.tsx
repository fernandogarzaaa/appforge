import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FolderOpen, Check, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface InstallPathStepProps {
  onNext: () => void;
  onBack: () => void;
}

export function InstallPathStep({ onNext, onBack }: InstallPathStepProps) {
  const [installPath, setInstallPath] = useState(getDefaultInstallPath());
  const [isValidating, setIsValidating] = useState(false);
  const [isValid, setIsValid] = useState(false);

  function getDefaultInstallPath(): string {
    // Use window.electron if available, otherwise fallback
    const home = window.electron?.getHomePath?.() || '/home/user';
    if (window.electron?.platform === 'win32') {
      return `${home}\\AppForge`;
    } else if (window.electron?.platform === 'darwin') {
      return `${home}/Applications/AppForge`;
    }
    return `${home}/appforge`;
  }

  const validatePath = async () => {
    setIsValidating(true);
    
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    if (installPath.trim().length > 0) {
      setIsValid(true);
      toast.success('Installation path validated');
    } else {
      setIsValid(false);
      toast.error('Please enter a valid path');
    }
    
    setIsValidating(false);
  };

  const handleBrowse = async () => {
    const mockPath = '/Users/user/AppForge';
    setInstallPath(mockPath);
    setIsValid(true);
  };

  const handleNext = () => {
    if (isValid) {
      onNext();
    } else {
      validatePath();
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-2">Choose Installation Location</h2>
      <p className="text-slate-400 mb-6">
        Select where AppForge and its components will be installed.
      </p>

      <div className="space-y-4">
        <div>
          <Label htmlFor="install-path" className="text-slate-300">
            Installation Path
          </Label>
          <div className="flex gap-2 mt-1.5">
            <Input
              id="install-path"
              value={installPath}
              onChange={(e) => {
                setInstallPath(e.target.value);
                setIsValid(false);
              }}
              placeholder="Enter installation path"
              className="flex-1 bg-slate-800 border-slate-700 text-white"
            />
            <Button
              variant="outline"
              onClick={handleBrowse}
              className="border-slate-700 hover:bg-slate-800"
            >
              <FolderOpen className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
          <h4 className="text-sm font-semibold text-slate-300 mb-2">What will be installed:</h4>
          <ul className="space-y-2 text-sm text-slate-400">
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              Backend services (Node.js)
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              Quantum Core engine (Rust)
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              Swarm agents (Python)
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              Configuration files and logs
            </li>
          </ul>
        </div>

        <div className="flex items-start gap-2 text-amber-400 text-sm">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <p>
            Make sure you have at least 2GB of free disk space for the full installation.
          </p>
        </div>
      </div>

      <div className="flex gap-3 mt-8">
        <Button
          variant="outline"
          onClick={onBack}
          className="flex-1 border-slate-700 hover:bg-slate-800"
        >
          Back
        </Button>
        <Button
          onClick={handleNext}
          disabled={isValidating}
          className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
        >
          {isValidating ? 'Validating...' : 'Continue'}
        </Button>
      </div>
    </div>
  );
}
