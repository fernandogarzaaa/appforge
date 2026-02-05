import React, { useState } from 'react'
import { base44 } from '@/api/base44Client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Atom, Zap, Brain, Cpu, Activity, TrendingUp, Sparkles, Share2, BookOpen, Lightbulb 
} from 'lucide-react'
import QuantumCircuitDisplay from '@/components/QuantumCircuitDisplay'
import QuantumCircuitVisualizer from '@/components/QuantumCircuitVisualizer'
import QuantumCircuitEducation from '@/components/QuantumCircuitEducation'
import { motion } from 'framer-motion'
import { toast } from 'sonner'

export default function QuantumLab() {
  const [activeTab, setActiveTab] = useState('visualizer')
  const [simulationParams, setSimulationParams] = useState({
    qubits: 5,
    shots: 1024,
    backend: 'qasm_simulator'
  })
  const [isRunning, setIsRunning] = useState(false)

  const runQuantumSimulation = async () => {
    setIsRunning(true)
    try {
      const response = await base44.functions.invoke('quantumLLM', {
        prompt: `Execute quantum simulation with ${simulationParams.qubits} qubits and ${simulationParams.shots} shots on ${simulationParams.backend}. Return simulation results with circuit execution times and output probability distribution.`,
        add_context_from_internet: false
      })
      
      toast.success('Quantum simulation completed successfully!')
      console.log('Quantum results:', response.data)
      
      await base44.analytics.track({
        eventName: 'quantum_simulation_run',
        properties: { 
          qubits: simulationParams.qubits,
          shots: simulationParams.shots,
          backend: simulationParams.backend,
          quantum_enhanced: true
        }
      })
    } catch (error) {
      toast.error('Simulation failed: ' + error.message)
    } finally {
      setIsRunning(false)
    }
  }

  const quantumAlgorithms = [
    {
      name: 'Quantum Fourier Transform',
      description: 'Fundamental for period finding and phase estimation',
      complexity: 'O(n²)',
      qubits: 4,
      gates: 12,
      icon: Activity,
      color: 'cyan'
    },
    {
      name: 'Grover Search',
      description: 'Quadratic speedup for unstructured search',
      complexity: 'O(√N)',
      qubits: 3,
      gates: 8,
      icon: Zap,
      color: 'yellow'
    },
    {
      name: 'Quantum Teleportation',
      description: 'Transfer quantum state using entanglement',
      complexity: 'O(1)',
      qubits: 3,
      gates: 6,
      icon: Sparkles,
      color: 'purple'
    },
    {
      name: 'Variational Quantum Eigensolver',
      description: 'Find ground state energies for molecules',
      complexity: 'Hybrid',
      qubits: 6,
      gates: 15,
      icon: Brain,
      color: 'pink'
    }
  ]

  const stats = [
    { label: 'Total Qubits', value: '127', trend: '+15', icon: Atom, color: 'blue' },
    { label: 'Circuits Run', value: '2,341', trend: '+12%', icon: Cpu, color: 'purple' },
    { label: 'Success Rate', value: '98.7%', trend: '+2.1%', icon: TrendingUp, color: 'green' },
    { label: 'Avg Fidelity', value: '99.2%', trend: '+0.5%', icon: Activity, color: 'cyan' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-purple-950 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
        >
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                <Atom className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white">Quantum Lab</h1>
                <p className="text-slate-400">Build, simulate, and learn quantum circuits</p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button className="bg-cyan-600 hover:bg-cyan-700 text-white">
              <BookOpen className="h-4 w-4 mr-2" />
              Documentation
            </Button>
            <Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800">
              <Share2 className="h-4 w-4 mr-2" />
              Share Lab
            </Button>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, idx) => {
            const Icon = stat.icon
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className={`bg-gradient-to-br from-${stat.color}-900/20 to-slate-900 border-${stat.color}-700/50`}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <Icon className={`h-5 w-5 text-${stat.color}-400`} />
                      <Badge variant="outline" className={`bg-${stat.color}-500/20 text-${stat.color}-300 border-${stat.color}-500/50`}>
                        {stat.trend}
                      </Badge>
                    </div>
                    <div className="text-3xl font-bold text-white">{stat.value}</div>
                    <div className="text-sm text-slate-400 mt-1">{stat.label}</div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 bg-slate-900 border border-slate-800">
            <TabsTrigger value="visualizer" className="data-[state=active]:bg-cyan-600">
              <Cpu className="h-4 w-4 mr-2" />
              Circuit Builder
            </TabsTrigger>
            <TabsTrigger value="algorithms" className="data-[state=active]:bg-purple-600">
              <Brain className="h-4 w-4 mr-2" />
              Algorithms
            </TabsTrigger>
            <TabsTrigger value="simulation" className="data-[state=active]:bg-blue-600">
              <Play className="h-4 w-4 mr-2" />
              Simulation
            </TabsTrigger>
            <TabsTrigger value="learn" className="data-[state=active]:bg-pink-600">
              <BookOpen className="h-4 w-4 mr-2" />
              Learn
            </TabsTrigger>
          </TabsList>

          {/* Circuit Visualizer Tab */}
          <TabsContent value="visualizer" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <QuantumCircuitVisualizer initialQubits={3} />
              <QuantumCircuitDisplay />
            </div>
          </TabsContent>

          {/* Quantum Algorithms Tab */}
          <TabsContent value="algorithms" className="space-y-4">
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Brain className="h-5 w-5 text-purple-400" />
                  Famous Quantum Algorithms
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Explore groundbreaking quantum algorithms and their applications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {quantumAlgorithms.map((algo, idx) => {
                    const Icon = algo.icon
                    return (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                      >
                        <Card className={`bg-gradient-to-br from-${algo.color}-900/30 to-slate-900 border-${algo.color}-700/50 hover:border-${algo.color}-500 transition-all group cursor-pointer`}>
                          <CardContent className="p-5">
                            <div className="flex items-start gap-3 mb-3">
                              <div className={`w-10 h-10 rounded-lg bg-${algo.color}-600/20 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                <Icon className={`h-5 w-5 text-${algo.color}-400`} />
                              </div>
                              <div className="flex-1">
                                <h3 className="font-semibold text-white mb-1">{algo.name}</h3>
                                <p className="text-xs text-slate-400">{algo.description}</p>
                              </div>
                            </div>
                            <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-800">
                              <div className="text-center">
                                <div className={`text-lg font-bold text-${algo.color}-400`}>{algo.qubits}</div>
                                <div className="text-xs text-slate-500">Qubits</div>
                              </div>
                              <div className="text-center">
                                <div className={`text-lg font-bold text-${algo.color}-400`}>{algo.gates}</div>
                                <div className="text-xs text-slate-500">Gates</div>
                              </div>
                              <div className="text-center">
                                <div className="text-xs font-mono text-cyan-400 font-semibold">{algo.complexity}</div>
                                <div className="text-xs text-slate-500">Complexity</div>
                              </div>
                            </div>
                            <Badge className={`mt-3 bg-${algo.color}-600/30 text-${algo.color}-300 border-${algo.color}-600/50 w-full justify-center`}>
                              {algo.application}
                            </Badge>
                          </CardContent>
                        </Card>
                      </motion.div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Simulation Tab */}
          <TabsContent value="simulation" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-1 bg-slate-900 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-white">Simulation Settings</CardTitle>
                  <CardDescription className="text-slate-400">Configure quantum execution</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-slate-300">Number of Qubits</Label>
                    <Input
                      type="number"
                      value={simulationParams.qubits}
                      onChange={(e) => setSimulationParams({...simulationParams, qubits: parseInt(e.target.value)})}
                      min={1}
                      max={20}
                      className="bg-slate-800 border-slate-700 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Shots (Measurements)</Label>
                    <Input
                      type="number"
                      value={simulationParams.shots}
                      onChange={(e) => setSimulationParams({...simulationParams, shots: parseInt(e.target.value)})}
                      min={100}
                      max={8192}
                      step={100}
                      className="bg-slate-800 border-slate-700 text-white"
                    />
                  </div>
                  <Button
                    onClick={runQuantumSimulation}
                    disabled={isRunning}
                    className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white"
                  >
                    {isRunning ? (
                      <>
                        <Activity className="h-4 w-4 mr-2 animate-spin" />
                        Simulating...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Run Simulation
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              <div className="lg:col-span-2 space-y-6">
                <QuantumCircuitDisplay />
                
                <Card className="bg-gradient-to-br from-purple-900/30 to-slate-900 border-purple-700/50">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-purple-400" />
                      Quantum Advantage
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                          <div className="text-xs text-slate-400 mb-1">Classical Computer</div>
                          <div className="text-2xl font-bold text-slate-300">2³² steps</div>
                          <div className="text-xs text-slate-500 mt-1">~4.3 billion operations</div>
                        </div>
                        <div className="bg-gradient-to-br from-cyan-900/50 to-blue-900/50 rounded-lg p-4 border border-cyan-700/50">
                          <div className="text-xs text-cyan-400 mb-1">Quantum Computer</div>
                          <div className="text-2xl font-bold text-cyan-300">√2³² steps</div>
                          <div className="text-xs text-cyan-500 mt-1">~65,536 operations</div>
                        </div>
                      </div>
                      <div className="bg-green-900/20 border border-green-700/50 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-green-400">
                          <TrendingUp className="h-4 w-4" />
                          <span className="text-sm font-semibold">65,536× Speedup for Grover's Search</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Learning Tab */}
          <TabsContent value="learn">
            <QuantumCircuitEducation />
          </TabsContent>
        </Tabs>

        {/* Bottom Info */}
        <Card className="bg-gradient-to-r from-indigo-900/30 to-purple-900/30 border-indigo-700/50">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                  <Lightbulb className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">Ready to go deeper?</h3>
                  <p className="text-sm text-slate-400">Explore quantum machine learning and advanced algorithms</p>
                </div>
              </div>
              <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white">
                <Brain className="h-4 w-4 mr-2" />
                Quantum ML →
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}