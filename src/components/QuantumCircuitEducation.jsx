import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BookOpen, Code2, Lightbulb, Atom, Cpu, Network, AlertCircle } from 'lucide-react'
import { motion } from 'framer-motion'

/**
 * QuantumCircuitEducation - Interactive quantum computing education
 */
export function QuantumCircuitEducation() {
  const [selectedGate, setSelectedGate] = useState('H')

  const gateLibrary = {
    H: {
      name: 'Hadamard Gate',
      symbol: 'H',
      description: 'Creates a superposition of quantum states',
      matrix: '1/√2 [1  1]\n      [1 -1]',
      uses: ['Superposition', 'Quantum Fourier Transform', 'Grover\'s Algorithm'],
      effect: 'Transforms |0⟩ to (|0⟩+|1⟩)/√2 and |1⟩ to (|0⟩-|1⟩)/√2',
    },
    X: {
      name: 'Pauli-X Gate',
      symbol: 'X',
      description: 'Flips the quantum state (quantum NOT)',
      matrix: '[0 1]\n[1 0]',
      uses: ['State Preparation', 'Bit Flip', 'Quantum Error Correction'],
      effect: 'Transforms |0⟩ to |1⟩ and |1⟩ to |0⟩',
    },
    Z: {
      name: 'Pauli-Z Gate',
      symbol: 'Z',
      description: 'Adds a phase to the |1⟩ state',
      matrix: '[1  0]\n[0 -1]',
      uses: ['Phase Shifts', 'Quantum Algorithms', 'Measurements'],
      effect: 'Leaves |0⟩ unchanged, transforms |1⟩ to -|1⟩',
    },
    Y: {
      name: 'Pauli-Y Gate',
      symbol: 'Y',
      description: 'Combination of X and Z rotations',
      matrix: '[0 -i]\n[i  0]',
      uses: ['Rotations', 'State Transitions', 'Quantum Walks'],
      effect: 'Rotates around the Y-axis of the Bloch sphere',
    },
    CNOT: {
      name: 'CNOT (Controlled-NOT)',
      symbol: 'CNOT',
      description: 'Creates entanglement between two qubits',
      matrix: '[1 0 0 0]\n[0 1 0 0]\n[0 0 0 1]\n[0 0 1 0]',
      uses: ['Entanglement', 'Bell States', 'Quantum Error Correction'],
      effect: 'Flips target qubit if control qubit is |1⟩',
    },
    S: {
      name: 'S Gate',
      symbol: 'S',
      description: 'Applies a 90-degree phase shift',
      matrix: '[1 0]\n[0 i]',
      uses: ['Quantum Phase Estimation', 'Quantum Algorithms'],
      effect: 'Phase shift of 90 degrees on |1⟩ state',
    },
  }

  const concepts = [
    {
      title: 'Qubits',
      description: 'Quantum bits that exist in superposition of 0 and 1',
      icon: Atom,
      color: 'cyan',
      detail: 'Unlike classical bits, qubits can represent both 0 and 1 simultaneously, exponentially increasing computational power.'
    },
    {
      title: 'Superposition',
      description: 'Quantum state that is both 0 and 1 simultaneously',
      icon: Cpu,
      color: 'purple',
      detail: 'A qubit in superposition explores multiple possibilities at once, collapsed to a single state upon measurement.'
    },
    {
      title: 'Entanglement',
      description: 'Correlation between qubits such that measuring one affects others',
      icon: Network,
      color: 'pink',
      detail: 'Entangled qubits share quantum states, enabling instant correlation regardless of distance - Einstein called it "spooky action".'
    },
    {
      title: 'Interference',
      description: 'Quantum amplitudes add and cancel to compute results',
      icon: Lightbulb,
      color: 'blue',
      detail: 'Constructive and destructive interference amplifies correct answers while canceling wrong ones in quantum algorithms.'
    },
    {
      title: 'Measurement',
      description: 'Observing a qubit collapses it to 0 or 1',
      icon: BookOpen,
      color: 'green',
      detail: 'Measurement destroys superposition, yielding classical bits. Quantum algorithms carefully delay measurement for advantage.'
    },
    {
      title: 'Decoherence',
      description: 'Loss of quantum information due to environmental noise',
      icon: AlertCircle,
      color: 'orange',
      detail: 'Qubits are fragile - they lose quantum properties from vibrations, temperature, and electromagnetic fields.'
    },
  ]

  const caseStudies = [
    {
      title: 'Drug Discovery & Molecular Simulation',
      algorithm: 'VQE (Variational Quantum Eigensolver)',
      advantage: '10,000x speedup for protein folding simulations vs classical',
      challenge: 'NISQ devices have limited qubits (~100-1000), error rates ~0.1-1%',
      realWorldImpact: 'Can model drug-protein interactions in hours instead of months',
      code: `# Simplified VQE for molecular energy
from qiskit import QuantumCircuit
import numpy as np

def vqe_ansatz(params, n_qubits=2):
    qc = QuantumCircuit(n_qubits)
    # Parameterized circuit for H2 molecule
    for i in range(n_qubits):
        qc.ry(params[i], i)
    qc.cx(0, 1)
    return qc

# Classical optimizer varies params
# Quantum evaluates energy for each param set
best_energy = minimize(evaluate_energy, initial_params)`,
      companies: 'IBM, Google, Rigetti working on drug discovery applications',
    },
    {
      title: 'Materials Science & Crystal Structure',
      algorithm: 'Quantum Phase Estimation',
      advantage: 'Predict material properties 1000x faster than DFT',
      challenge: 'Deep circuits required for accurate simulation (1000+ gates)',
      realWorldImpact: 'Design better batteries, semiconductors, superconductors',
      code: `# Quantum Phase Estimation concept
def qpe_circuit(unitary, n_counting_qubits=3):
    qc = QuantumCircuit(n_counting_qubits + 1)
    # Prepare eigenstate
    qc.h(n_counting_qubits)
    
    # Controlled unitary operations
    for i in range(n_counting_qubits):
        # Apply U^(2^i) controlled
        pass
    
    # Inverse QFT to measure phase
    return phase_in_binary`,
      companies: 'Google AI, Microsoft, IonQ researching material simulations',
    },
    {
      title: 'Financial Modeling & Risk Analysis',
      algorithm: 'Quantum Amplitude Estimation',
      advantage: '4x speedup for Monte Carlo simulations',
      challenge: 'Need 1000+ qubit systems for real portfolios, noise sensitive',
      realWorldImpact: 'Price derivatives, assess portfolio risk in seconds',
      code: `# Quantum Monte Carlo for option pricing
def qmc_circuit(n_qubits=3):
    qc = QuantumCircuit(n_qubits)
    
    # Create superposition of price paths
    for i in range(n_qubits):
        qc.h(i)
    
    # Encode random walk (simplified)
    # qc.rz(price_change, 0)
    
    # Measure probability of profit region
    return qc.measure_all()`,
      companies: 'JP Morgan, Goldman Sachs, Deutsche Bank exploring quantum finance',
    },
    {
      title: 'AI & Machine Learning Acceleration',
      algorithm: 'QAOA (Quantum Approximate Optimization)',
      advantage: '100-1000x speedup for certain optimization problems',
      challenge: 'Works on NISQ hardware but limited problem size',
      realWorldImpact: 'Optimize ML models, improve training convergence',
      code: `# QAOA for MAX-CUT problem
def qaoa_circuit(graph, beta, gamma):
    n = len(graph)
    qc = QuantumCircuit(n)
    
    # Initialization
    for i in range(n):
        qc.h(i)
    
    # Problem Hamiltonian
    for (u, v) in graph.edges:
        qc.rzz(2*gamma, u, v)
    
    # Mixer Hamiltonian
    for i in range(n):
        qc.rx(2*beta, i)
    
    return qc`,
      companies: 'IBM, Google, Amazon working on ML optimization',
    },
  ]

  const gate = gateLibrary[selectedGate]

  return (
    <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-0 shadow-xl dark:shadow-slate-950/50">
      <CardHeader className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white rounded-t-lg">
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Quantum Computing Guide
        </CardTitle>
        <CardDescription className="text-white/90">Learn about quantum gates and concepts</CardDescription>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="gates" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-white/20 dark:border-slate-700/30">
            <TabsTrigger value="gates">Gates</TabsTrigger>
            <TabsTrigger value="concepts">Concepts</TabsTrigger>
            <TabsTrigger value="algorithms">Algorithms</TabsTrigger>
            <TabsTrigger value="code">Code</TabsTrigger>
          </TabsList>

          {/* Quantum Gates Tab */}
          <TabsContent value="gates" className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {Object.entries(gateLibrary).map(([key, info]) => (
                <Button
                  key={key}
                  variant={selectedGate === key ? 'default' : 'outline'}
                  onClick={() => setSelectedGate(key)}
                  className="flex flex-col items-center gap-1 h-auto py-2"
                >
                  <span className="text-lg font-bold">{info.symbol}</span>
                  <span className="text-xs">{info.name.split(' ')[0]}</span>
                </Button>
              ))}
            </div>

            {gate && (
              <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md rounded-lg p-4 space-y-3 border border-white/20 dark:border-slate-700/30">
                <div>
                  <h3 className="font-semibold text-lg">{gate.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{gate.description}</p>
                </div>

                <div>
                  <h4 className="font-semibold text-sm mb-2">Quantum Effect</h4>
                  <p className="text-sm font-mono bg-black/10 dark:bg-black/20 p-3 rounded backdrop-blur-sm">
                    {gate.effect}
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-sm mb-2">Unitary Matrix</h4>
                  <pre className="text-xs font-mono bg-black/10 dark:bg-black/20 p-3 rounded overflow-x-auto backdrop-blur-sm">
                     {gate.matrix}
                   </pre>
                </div>

                <div>
                  <h4 className="font-semibold text-sm mb-2">Common Uses</h4>
                  <ul className="text-sm space-y-1">
                    {gate.uses.map((use, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <span className="text-xs">◆</span>
                        <span>{use}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Concepts Tab */}
          <TabsContent value="concepts" className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {concepts.map((concept, i) => {
                const Icon = concept.icon
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className={`bg-white/60 dark:bg-slate-800/60 backdrop-blur-md rounded-lg p-4 border border-white/20 dark:border-slate-700/30 hover:shadow-lg transition-all cursor-pointer group hover:bg-white/80 dark:hover:bg-slate-800/80`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                         <Icon className={`h-5 w-5 text-indigo-600 dark:text-indigo-400`} />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm mb-1">{concept.title}</h4>
                        <p className="text-xs text-muted-foreground mb-2">{concept.description}</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{concept.detail}</p>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </TabsContent>

          {/* Algorithms Tab */}
          <TabsContent value="algorithms" className="space-y-4">
            <div className="space-y-4">
              {caseStudies.map((study, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md rounded-lg border border-white/20 dark:border-slate-700/30 overflow-hidden hover:border-indigo-300 dark:hover:border-indigo-700 transition-all"
                >
                  <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <h3 className="font-bold text-base mb-1">{study.title}</h3>
                        <Badge className="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300">
                          {study.algorithm}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                       <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm rounded p-3 border border-white/20 dark:border-slate-700/20">
                         <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Quantum Advantage</p>
                         <p className="text-sm font-medium text-green-700 dark:text-green-400">{study.advantage}</p>
                       </div>
                       <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm rounded p-3 border border-white/20 dark:border-slate-700/20">
                         <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Key Challenge</p>
                         <p className="text-sm font-medium text-orange-700 dark:text-orange-400">{study.challenge}</p>
                       </div>
                     </div>

                     <div className="bg-blue-500/10 dark:bg-blue-900/20 rounded p-3 mt-3 backdrop-blur-sm border border-blue-200/30 dark:border-blue-700/30">
                       <p className="text-xs font-semibold text-blue-900 dark:text-blue-300 mb-1">Real-World Impact</p>
                       <p className="text-sm text-blue-800 dark:text-blue-200">{study.realWorldImpact}</p>
                     </div>
                  </div>

                  <div className="p-4 bg-black/40 dark:bg-black/60 backdrop-blur-md border-t border-white/10 dark:border-slate-700/20">
                    <p className="text-xs font-semibold text-slate-100 mb-2">Code Example</p>
                    <pre className="text-xs text-slate-100 overflow-x-auto whitespace-pre-wrap break-words font-mono">
                      <code>{study.code}</code>
                    </pre>
                  </div>

                  <div className="px-4 py-3 bg-white/40 dark:bg-slate-800/40 backdrop-blur-sm border-t border-white/10 dark:border-slate-700/20">
                    <p className="text-xs text-slate-700 dark:text-slate-300">
                      <strong>Organizations:</strong> {study.companies}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 dark:from-blue-950/40 dark:to-purple-950/40 backdrop-blur-sm border border-blue-300/50 dark:border-blue-700/50 rounded-lg p-4">
              <p className="text-sm text-blue-900 dark:text-blue-100 mb-2 font-semibold">
                💡 Quantum Advantage Timeline
              </p>
              <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
                <li>• <strong>2024-2025:</strong> NISQ advantage emerging in optimization & simulation</li>
                <li>• <strong>2025-2030:</strong> Fault-tolerant quantum computers with 1000+ logical qubits</li>
                <li>• <strong>2030+:</strong> Practical quantum advantage in finance, drug discovery, materials science</li>
              </ul>
            </div>
          </TabsContent>

          {/* Code Example Tab */}
          <TabsContent value="code" className="space-y-4">
            <div className="space-y-3">
              <div>
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <Code2 className="h-4 w-4" />
                  Building a Bell State
                </h4>
                <pre className="bg-black/50 dark:bg-black/70 text-slate-50 p-4 rounded-lg text-xs overflow-x-auto backdrop-blur-sm border border-white/10">
{`from qiskit import QuantumCircuit, QuantumRegister

# Create quantum circuit with 2 qubits
qc = QuantumCircuit(2, name='Bell')

# Apply Hadamard on first qubit
qc.h(0)

# Apply CNOT (control=0, target=1)
qc.cx(0, 1)

# Result: (|00⟩ + |11⟩) / √2
print(qc)`}
                </pre>
              </div>

              <div>
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <Code2 className="h-4 w-4" />
                  Creating Superposition
                </h4>
                <pre className="bg-black/50 dark:bg-black/70 text-slate-50 p-4 rounded-lg text-xs overflow-x-auto backdrop-blur-sm border border-white/10">
{`from qiskit import QuantumCircuit

# Create single qubit circuit
qc = QuantumCircuit(1, name='Superposition')

# Apply Hadamard gate
qc.h(0)

# Qubit now in state (|0⟩ + |1⟩) / √2
print(qc)`}
                </pre>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/50 rounded-lg p-3">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  💡 <strong>Tip:</strong> Use the Quantum Circuit Designer above to visualize these concepts in real-time!
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

export default QuantumCircuitEducation