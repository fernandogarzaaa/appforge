import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Zap, Cloud, Server } from 'lucide-react';
import { toast } from 'sonner';

export default function QuantumHardwareConnect() {
  const [showConnect, setShowConnect] = useState(false);
  const [selectedBackend, setSelectedBackend] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [apiToken, setApiToken] = useState('');

  const backends = [
    {
      id: 'ibm_quantum',
      name: 'IBM Quantum',
      provider: 'IBM',
      qubits: 127,
      status: 'available',
      description: 'Access IBM quantum processors',
      icon: Cloud,
      color: 'from-blue-500 to-cyan-500'
    },
    {
      id: 'aws_braket',
      name: 'AWS Braket',
      provider: 'Amazon',
      qubits: 30,
      status: 'coming_soon',
      description: 'Quantum computing service',
      icon: Zap,
      color: 'from-orange-500 to-red-500'
    },
    {
      id: 'google_cirq',
      name: 'Google Cirq',
      provider: 'Google',
      qubits: 54,
      status: 'available',
      description: 'Google quantum framework',
      icon: Server,
      color: 'from-purple-500 to-pink-500'
    }
  ];

  const handleConnect = async (apiToken) => {
    if (!selectedBackend) {
      toast.error('Please select a backend');
      return;
    }

    if (!apiToken?.trim()) {
      toast.error('API token is required');
      return;
    }

    setIsConnecting(true);
    try {
      const configs = await base44.entities.QuantumBackendConfig.filter({
        backend_name: selectedBackend.id
      });

      const existingConfig = configs[0];

      if (existingConfig) {
        await base44.entities.QuantumBackendConfig.update(existingConfig.id, {
          api_key: apiToken,
          is_configured: true,
          last_tested: new Date().toISOString(),
          test_status: 'never_tested'
        });
      } else {
        await base44.entities.QuantumBackendConfig.create({
          backend_name: selectedBackend.id,
          api_key: apiToken,
          is_configured: true,
          is_active: true,
          max_qubits: selectedBackend.qubits,
          default_shots: 1000,
          last_tested: new Date().toISOString(),
          test_status: 'never_tested'
        });
      }

      toast.success(`Connected to ${selectedBackend.name}`);
      setShowConnect(false);
    } catch (err) {
      toast.error(`Connection failed: ${err.message}`);
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Cloud className="w-5 h-5 text-blue-600" />
              Quantum Hardware Backends
            </span>
            <Button size="sm" onClick={() => setShowConnect(true)}>
              Connect Backend
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {backends.map(backend => (
              <div
                key={backend.id}
                className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                  selectedBackend?.id === backend.id
                    ? 'border-blue-600 bg-blue-100'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
                onClick={() => setSelectedBackend(backend)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${backend.color} flex items-center justify-center`}>
                    <backend.icon className="w-5 h-5 text-white" />
                  </div>
                  <Badge variant={backend.status === 'available' ? 'default' : 'secondary'}>
                    {backend.status === 'available' ? 'Available' : 'Coming Soon'}
                  </Badge>
                </div>
                <h3 className="font-semibold text-sm mb-1">{backend.name}</h3>
                <p className="text-xs text-gray-600 mb-2">{backend.provider}</p>
                <p className="text-xs text-gray-500">{backend.qubits} qubits</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showConnect} onOpenChange={setShowConnect}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect to Quantum Backend</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {selectedBackend && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm font-semibold mb-2">Selected: {selectedBackend.name}</p>
                <p className="text-xs text-gray-600 mb-3">{selectedBackend.description}</p>
                <div className="space-y-2 text-xs">
                  <div>Provider: <span className="font-semibold">{selectedBackend.provider}</span></div>
                  <div>Qubits: <span className="font-semibold">{selectedBackend.qubits}</span></div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-sm font-semibold">API Token</label>
              <input
                type="password"
                placeholder="Enter your API token"
                value={apiToken}
                onChange={(e) => setApiToken(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>

            <Button
              onClick={() => handleConnect(apiToken)}
              disabled={isConnecting || !selectedBackend || !apiToken.trim()}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600"
            >
              {isConnecting ? 'Connecting...' : 'Connect'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}