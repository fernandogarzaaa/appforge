import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertCircle, CheckCircle2, Settings, Plus, Trash2, TestTube } from 'lucide-react';
import { toast } from 'sonner';

export default function QuantumBackendAdmin() {
  const [showAdd, setShowAdd] = useState(false);
  const [selectedBackend, setSelectedBackend] = useState(null);
  const [apiKey, setApiKey] = useState('');
  const queryClient = useQueryClient();

  const { data: configs = [] } = useQuery({
    queryKey: ['quantum_backend_configs'],
    queryFn: () => base44.asServiceRole.entities.QuantumBackendConfig.list()
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      return base44.asServiceRole.entities.QuantumBackendConfig.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quantum_backend_configs'] });
      toast.success('Backend configured');
      setShowAdd(false);
      setApiKey('');
    },
    onError: (err) => toast.error(err.message)
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      return base44.asServiceRole.entities.QuantumBackendConfig.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quantum_backend_configs'] });
      toast.success('Backend updated');
    },
    onError: (err) => toast.error(err.message)
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      return base44.asServiceRole.entities.QuantumBackendConfig.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quantum_backend_configs'] });
      toast.success('Backend removed');
    },
    onError: (err) => toast.error(err.message)
  });

  const testMutation = useMutation({
    mutationFn: async (config) => {
      const testCircuit = { qubits: 2, gates: [{ type: 'H', targets: [0] }, { type: 'CNOT', targets: [0, 1] }] };
      const response = await base44.functions.invoke('submitQuantumJob', {
        circuit_data: testCircuit,
        backend: config.backend_name,
        shots: 100
      });
      return response.data;
    },
    onSuccess: (data, config) => {
      queryClient.invalidateQueries({ queryKey: ['quantum_backend_configs'] });
      updateMutation.mutate({
        id: config.id,
        data: { test_status: 'success', last_tested: new Date().toISOString() }
      });
      toast.success('Backend test passed');
    },
    onError: (err, config) => {
      updateMutation.mutate({
        id: config.id,
        data: { test_status: 'failed', last_tested: new Date().toISOString() }
      });
      toast.error(`Backend test failed: ${err.message}`);
    }
  });

  const backendOptions = [
    { name: 'ibm_quantum', label: 'IBM Quantum', qubits: 127 },
    { name: 'aws_braket', label: 'AWS Braket', qubits: 30 },
    { name: 'google_cirq', label: 'Google Cirq', qubits: 54 }
  ];

  const handleCreate = async () => {
    if (!selectedBackend || !apiKey) {
      toast.error('Select backend and enter API key');
      return;
    }

    const backend = backendOptions.find(b => b.name === selectedBackend);
    createMutation.mutate({
      backend_name: selectedBackend,
      api_key: apiKey,
      is_configured: true,
      is_active: true,
      max_qubits: backend.qubits,
      test_status: 'never_tested'
    });
  };

  return (
    <div className="space-y-6">
      {/* Add Backend Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configure Quantum Backend</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Backend Provider</label>
              <div className="space-y-2">
                {backendOptions.map(backend => (
                  <button
                    key={backend.name}
                    onClick={() => setSelectedBackend(backend.name)}
                    className={`w-full p-2 rounded-lg border text-left transition-colors ${
                      selectedBackend === backend.name
                        ? 'bg-blue-50 border-blue-300'
                        : 'bg-white border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-semibold">{backend.label}</div>
                    <div className="text-xs text-gray-600">{backend.qubits} qubits</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">API Key</label>
              <input
                type="password"
                placeholder="Enter API key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
              <p className="text-xs text-gray-600 mt-1">
                Your API key will be securely encrypted and stored
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={createMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {createMutation.isPending ? 'Configuring...' : 'Configure'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Backends List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Quantum Backend Configuration
            </CardTitle>
            <Button
              onClick={() => setShowAdd(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" /> Add Backend
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {configs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>No backends configured</p>
            </div>
          ) : (
            configs.map(config => (
              <Card key={config.id} className="border">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="font-semibold">{config.backend_name}</p>
                        <Badge variant={config.is_active ? 'default' : 'secondary'}>
                          {config.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        <Badge variant={config.is_configured ? 'default' : 'secondary'}>
                          {config.is_configured ? 'Configured' : 'Not Configured'}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-3 gap-4 text-sm mt-3 mb-3 text-gray-600">
                        <div>
                          <p className="text-xs text-gray-500">Max Qubits</p>
                          <p className="font-semibold text-gray-900">{config.max_qubits}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Test Status</p>
                          <div className="flex items-center gap-1">
                            {config.test_status === 'success' ? (
                              <>
                                <CheckCircle2 className="w-3 h-3 text-green-600" />
                                <span className="text-green-600">Passed</span>
                              </>
                            ) : config.test_status === 'failed' ? (
                              <>
                                <AlertCircle className="w-3 h-3 text-red-600" />
                                <span className="text-red-600">Failed</span>
                              </>
                            ) : (
                              <span className="text-gray-600">Not Tested</span>
                            )}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Last Tested</p>
                          <p className="text-gray-900">
                            {config.last_tested ? new Date(config.last_tested).toLocaleDateString() : 'Never'}
                          </p>
                        </div>
                      </div>

                      {config.min_cost_per_job && (
                        <p className="text-xs text-gray-600">Min Cost: ${config.min_cost_per_job.toFixed(2)}</p>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs"
                        disabled={!config.is_configured || testMutation.isPending}
                        onClick={() => testMutation.mutate(config)}
                      >
                        <TestTube className="w-3 h-3" /> {testMutation.isPending ? 'Testing...' : 'Test'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs text-red-600 hover:text-red-700"
                        onClick={() => deleteMutation.mutate(config.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </CardContent>
      </Card>

      {/* Info Box */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4 text-sm text-blue-800 space-y-2">
          <p className="font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> Setup Instructions
          </p>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li>IBM Quantum: Get API key from https://quantum-computing.ibm.com</li>
            <li>AWS Braket: Use AWS credentials with braket service access</li>
            <li>Google Cirq: Configure via Google Cloud authentication</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}