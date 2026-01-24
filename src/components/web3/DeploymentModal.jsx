import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Rocket, CheckCircle, XCircle, Loader2, Wallet, 
  Fuel, ExternalLink, Copy, AlertTriangle
} from 'lucide-react';
import NetworkBadge from './NetworkBadge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const deploymentSteps = [
  { id: 'connect', label: 'Connect Wallet', description: 'Connecting to your wallet' },
  { id: 'compile', label: 'Compile Contract', description: 'Compiling Solidity code' },
  { id: 'estimate', label: 'Estimate Gas', description: 'Calculating deployment cost' },
  { id: 'sign', label: 'Sign Transaction', description: 'Waiting for signature' },
  { id: 'deploy', label: 'Deploy', description: 'Broadcasting transaction' },
  { id: 'confirm', label: 'Confirm', description: 'Waiting for confirmation' },
];

const networkExplorers = {
  ethereum: 'https://etherscan.io',
  polygon: 'https://polygonscan.com',
  bsc: 'https://bscscan.com',
  arbitrum: 'https://arbiscan.io',
  optimism: 'https://optimistic.etherscan.io',
  base: 'https://basescan.org',
  avalanche: 'https://snowtrace.io',
};

export default function DeploymentModal({ 
  open, 
  onOpenChange, 
  contract, 
  wallet,
  onDeploymentComplete,
  onConnectWallet
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const [status, setStatus] = useState('idle'); // idle, deploying, success, error
  const [error, setError] = useState(null);
  const [gasEstimate, setGasEstimate] = useState(null);
  const [deployedAddress, setDeployedAddress] = useState(null);
  const [txHash, setTxHash] = useState(null);

  useEffect(() => {
    if (open) {
      setCurrentStep(0);
      setStatus('idle');
      setError(null);
      setGasEstimate(null);
      setDeployedAddress(null);
      setTxHash(null);
    }
  }, [open]);

  const simulateDeployment = async () => {
    if (!wallet) {
      onConnectWallet?.();
      return;
    }

    setStatus('deploying');
    setError(null);

    // Step 1: Connect (already connected)
    setCurrentStep(0);
    await new Promise(r => setTimeout(r, 500));

    // Step 2: Compile
    setCurrentStep(1);
    await new Promise(r => setTimeout(r, 1500));

    // Step 3: Estimate Gas
    setCurrentStep(2);
    await new Promise(r => setTimeout(r, 1000));
    const estimatedGas = (Math.random() * 0.05 + 0.01).toFixed(4);
    setGasEstimate(estimatedGas);

    // Step 4: Sign Transaction
    setCurrentStep(3);
    await new Promise(r => setTimeout(r, 2000));

    // Step 5: Deploy
    setCurrentStep(4);
    await new Promise(r => setTimeout(r, 1500));
    const mockTxHash = '0x' + Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('');
    setTxHash(mockTxHash);

    // Step 6: Confirm
    setCurrentStep(5);
    await new Promise(r => setTimeout(r, 2000));

    // Generate mock contract address
    const mockAddress = '0x' + Array.from({length: 40}, () => Math.floor(Math.random() * 16).toString(16)).join('');
    setDeployedAddress(mockAddress);
    setStatus('success');

    // Call completion handler
    onDeploymentComplete?.({
      contract_address: mockAddress,
      tx_hash: mockTxHash,
      gas_used: estimatedGas,
      status: 'deployed',
      deployed_at: new Date().toISOString(),
    });
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const openExplorer = (type, hash) => {
    const baseUrl = networkExplorers[contract?.network] || networkExplorers.ethereum;
    const path = type === 'tx' ? `/tx/${hash}` : `/address/${hash}`;
    window.open(baseUrl + path, '_blank');
  };

  const progress = status === 'success' ? 100 : (currentStep / deploymentSteps.length) * 100;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Rocket className="w-5 h-5" />
            Deploy Contract
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          {/* Contract Info */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl mb-6">
            <div>
              <p className="font-medium">{contract?.name}</p>
              <p className="text-sm text-gray-500">{contract?.template || 'Custom'}</p>
            </div>
            <NetworkBadge network={contract?.network} />
          </div>

          {/* Wallet Status */}
          {!wallet && status === 'idle' && (
            <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl mb-6">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <div className="flex-1">
                <p className="font-medium text-amber-800">Wallet not connected</p>
                <p className="text-sm text-amber-600">Connect your wallet to deploy</p>
              </div>
              <Button 
                onClick={onConnectWallet}
                className="bg-amber-500 hover:bg-amber-600 text-white rounded-xl"
              >
                <Wallet className="w-4 h-4 mr-2" />
                Connect
              </Button>
            </div>
          )}

          {/* Deployment Progress */}
          {status === 'deploying' && (
            <div className="space-y-4">
              <Progress value={progress} className="h-2" />
              <div className="space-y-2">
                {deploymentSteps.map((step, index) => (
                  <div 
                    key={step.id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg transition-all",
                      index === currentStep && "bg-indigo-50",
                      index < currentStep && "opacity-60"
                    )}
                  >
                    {index < currentStep ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : index === currentStep ? (
                      <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                    )}
                    <div className="flex-1">
                      <p className={cn(
                        "font-medium",
                        index === currentStep ? "text-indigo-700" : "text-gray-700"
                      )}>
                        {step.label}
                      </p>
                      {index === currentStep && (
                        <p className="text-sm text-gray-500">{step.description}</p>
                      )}
                    </div>
                    {step.id === 'estimate' && gasEstimate && index <= currentStep && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Fuel className="w-3 h-3" />
                        {gasEstimate} ETH
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Success State */}
          {status === 'success' && (
            <div className="space-y-4">
              <div className="flex flex-col items-center py-6">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Deployment Successful!</h3>
                <p className="text-gray-500 text-center mt-1">
                  Your contract has been deployed to {contract?.network}
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">Contract Address</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-sm font-mono truncate">{deployedAddress}</code>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => copyToClipboard(deployedAddress)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => openExplorer('address', deployedAddress)}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">Transaction Hash</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-sm font-mono truncate">{txHash}</code>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => copyToClipboard(txHash)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => openExplorer('tx', txHash)}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {gasEstimate && (
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <span className="text-sm text-gray-600">Gas Used</span>
                    <span className="font-mono font-medium">{gasEstimate} ETH</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Error State */}
          {status === 'error' && (
            <div className="flex flex-col items-center py-6">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <XCircle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Deployment Failed</h3>
              <p className="text-red-600 text-center mt-1">{error}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          {status === 'idle' && (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">
                Cancel
              </Button>
              <Button
                onClick={simulateDeployment}
                disabled={!wallet}
                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl"
              >
                <Rocket className="w-4 h-4 mr-2" />
                Deploy Now
              </Button>
            </>
          )}
          {status === 'deploying' && (
            <Button disabled className="rounded-xl">
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Deploying...
            </Button>
          )}
          {(status === 'success' || status === 'error') && (
            <Button onClick={() => onOpenChange(false)} className="rounded-xl">
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}