import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Zap,
  Play,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Download
} from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

export default function QuantumHardwareJobManager() {
  const [showSubmit, setShowSubmit] = useState(false);
  const [selectedBackend, setSelectedBackend] = useState('simulator');
  const [circuitData, setCircuitData] = useState(null);
  const [shots, setShots] = useState(1000);
  const queryClient = useQueryClient();

  // Fetch jobs
  const { data: jobs = [] } = useQuery({
    queryKey: ['quantum_jobs'],
    queryFn: () => base44.entities.QuantumJob.list('-submitted_at'),
    refetchInterval: 5000
  });

  // Submit job mutation
  const submitMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('submitQuantumJob', {
        circuit_data: circuitData || { qubits: 2, gates: [{ type: 'H', targets: [0] }] },
        backend: selectedBackend,
        shots
      });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['quantum_jobs'] });
      toast.success(`Job submitted to ${selectedBackend}`);
      setShowSubmit(false);
    },
    onError: (err) => toast.error(err.message)
  });

  // Check job status mutation
  const checkStatusMutation = useMutation({
    mutationFn: async (jobId) => {
      const response = await base44.functions.invoke('checkQuantumJobStatus', {
        job_id: jobId
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quantum_jobs'] });
    },
    onError: (err) => toast.error(err.message)
  });

  const getStatusIcon = (status) => {
    const icons = {
      queued: Clock,
      running: RefreshCw,
      completed: CheckCircle2,
      failed: AlertCircle,
      cancelled: AlertCircle
    };
    return icons[status] || Clock;
  };

  const getStatusColor = (status) => {
    const colors = {
      queued: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      running: 'bg-blue-50 border-blue-200 text-blue-800',
      completed: 'bg-green-50 border-green-200 text-green-800',
      failed: 'bg-red-50 border-red-200 text-red-800',
      cancelled: 'bg-gray-50 border-gray-200 text-gray-800'
    };
    return colors[status] || 'bg-gray-50';
  };

  const backends = [
    { id: 'simulator', name: 'Simulator', provider: 'Local', color: 'from-blue-500 to-cyan-500', qubits: 30 },
    { id: 'ibm_quantum', name: 'IBM Quantum', provider: 'IBM', color: 'from-purple-500 to-pink-500', qubits: 127 },
    { id: 'aws_braket', name: 'AWS Braket', provider: 'Amazon', color: 'from-orange-500 to-red-500', qubits: 30 },
    { id: 'google_cirq', name: 'Google Cirq', provider: 'Google', color: 'from-green-500 to-emerald-500', qubits: 54 }
  ];

  return (
    <div className="space-y-6">
      {/* Submit Dialog */}
      <Dialog open={showSubmit} onOpenChange={setShowSubmit}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Submit Quantum Circuit to Hardware</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Backend Selection */}
            <div>
              <label className="block text-sm font-medium mb-2">Select Backend</label>
              <div className="grid grid-cols-2 gap-2">
                {backends.map(backend => (
                  <button
                    key={backend.id}
                    onClick={() => setSelectedBackend(backend.id)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      selectedBackend === backend.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-sm font-semibold">{backend.name}</div>
                    <div className="text-xs text-gray-600">{backend.qubits} qubits</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Shots */}
            <div>
              <label className="block text-sm font-medium mb-1">Number of Shots</label>
              <input
                type="number"
                value={shots}
                onChange={(e) => setShots(parseInt(e.target.value))}
                min="100"
                max="10000"
                step="100"
                className="w-full px-3 py-2 border rounded-lg"
              />
              <p className="text-xs text-gray-600 mt-1">Measurement repetitions (100-10000)</p>
            </div>

            {/* Cost Info */}
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-3 text-sm text-blue-800">
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="w-4 h-4" />
                  <span className="font-semibold">Estimated Cost</span>
                </div>
                <p>
                  {selectedBackend === 'aws_braket' ? '$0.30 per job' : 'Free'}
                </p>
              </CardContent>
            </Card>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSubmit(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => submitMutation.mutate()}
              disabled={submitMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {submitMutation.isPending ? 'Submitting...' : 'Submit Job'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Jobs Dashboard */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-600" />
              Quantum Hardware Jobs
            </CardTitle>
            <Button
              onClick={() => setShowSubmit(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Play className="w-4 h-4 mr-2" /> Submit Job
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {jobs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Clock className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>No jobs submitted yet</p>
            </div>
          ) : (
            <Tabs defaultValue="all" className="space-y-4">
              <TabsList>
                <TabsTrigger value="all">All ({jobs.length})</TabsTrigger>
                <TabsTrigger value="completed">Completed ({jobs.filter(j => j.status === 'completed').length})</TabsTrigger>
                <TabsTrigger value="running">Running ({jobs.filter(j => j.status === 'running' || j.status === 'queued').length})</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-2">
                {jobs.map((job, idx) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    idx={idx}
                    getStatusIcon={getStatusIcon}
                    getStatusColor={getStatusColor}
                    onRefresh={() => checkStatusMutation.mutate(job.id)}
                  />
                ))}
              </TabsContent>

              <TabsContent value="completed" className="space-y-2">
                {jobs.filter(j => j.status === 'completed').map((job, idx) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    idx={idx}
                    getStatusIcon={getStatusIcon}
                    getStatusColor={getStatusColor}
                    onRefresh={() => checkStatusMutation.mutate(job.id)}
                  />
                ))}
              </TabsContent>

              <TabsContent value="running" className="space-y-2">
                {jobs.filter(j => j.status === 'running' || j.status === 'queued').map((job, idx) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    idx={idx}
                    getStatusIcon={getStatusIcon}
                    getStatusColor={getStatusColor}
                    onRefresh={() => checkStatusMutation.mutate(job.id)}
                  />
                ))}
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function JobCard({ job, idx, getStatusIcon, getStatusColor, onRefresh }) {
  const StatusIcon = getStatusIcon(job.status);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.05 }}
    >
      <Card className={`border ${getStatusColor(job.status)}`}>
        <CardContent className="p-4">
          <div className="space-y-3">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <StatusIcon className={`w-5 h-5 mt-0.5 ${job.status === 'running' ? 'animate-spin' : ''}`} />
                <div>
                  <p className="font-semibold">{job.backend}</p>
                  <p className="text-xs text-gray-600 mt-1">
                    {format(new Date(job.submitted_at), 'PPpp')}
                  </p>
                </div>
              </div>
              <Badge variant="outline">{job.status}</Badge>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-4 gap-2 text-xs">
              <div>
                <p className="text-gray-600">Shots</p>
                <p className="font-semibold">{job.shots}</p>
              </div>
              <div>
                <p className="text-gray-600">Qubits</p>
                <p className="font-semibold">{job.circuit_data?.qubits || 'N/A'}</p>
              </div>
              {job.execution_time_ms && (
                <div>
                  <p className="text-gray-600">Time</p>
                  <p className="font-semibold">{job.execution_time_ms}ms</p>
                </div>
              )}
              {job.cost_usd && (
                <div>
                  <p className="text-gray-600">Cost</p>
                  <p className="font-semibold">${job.cost_usd.toFixed(2)}</p>
                </div>
              )}
            </div>

            {/* Results */}
            {job.results && (
              <div className="bg-gray-50 p-2 rounded text-xs font-mono max-h-40 overflow-y-auto">
                <p className="text-gray-600 mb-1">Results:</p>
                {Object.entries(job.results.probabilities || {}).slice(0, 8).map(([outcome, prob]) => (
                  <div key={outcome}>
                    |{outcome}⟩: {(prob * 100).toFixed(1)}%
                  </div>
                ))}
              </div>
            )}

            {/* Error */}
            {job.error_message && (
              <div className="bg-red-50 p-2 rounded text-xs text-red-800">
                {job.error_message}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              {(job.status === 'running' || job.status === 'queued') && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onRefresh()}
                  className="text-xs"
                >
                  <RefreshCw className="w-3 h-3 mr-1" /> Refresh
                </Button>
              )}
              {job.results && (
                <Button size="sm" variant="outline" className="text-xs">
                  <Download className="w-3 h-3 mr-1" /> Export
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}