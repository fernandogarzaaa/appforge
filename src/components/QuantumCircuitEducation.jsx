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

  const algorithms = [
    { name: 'Shor\'s Algorithm', description: 'Factor large numbers exponentially faster', complexity: 'O(log³N)', application: 'Cryptography Breaking' },
    { name: 'Grover\'s Algorithm', description: 'Search unsorted databases quadratically faster', complexity: 'O(√N)', application: 'Database Search' },
    { name: 'Quantum Fourier Transform', description: 'Transform quantum states into frequency domain', complexity: 'O(n²)', application: 'Period Finding' },
    { name: 'VQE', description: 'Find ground state energy of molecules', complexity: 'Hybrid', application: 'Drug Discovery' },
  ]

  const gate = gateLibrary[selectedGate]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Quantum Computing Guide
        </CardTitle>
        <CardDescription>Learn about quantum gates and concepts</CardDescription>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="gates" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
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
              <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 space-y-3">
                <div>
                  <h3 className="font-semibold text-lg">{gate.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{gate.description}</p>
                </div>

                <div>
                  <h4 className="font-semibold text-sm mb-2">Quantum Effect</h4>
                  <p className="text-sm font-mono bg-slate-100 dark:bg-slate-800 p-3 rounded">
                    {gate.effect}
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-sm mb-2">Unitary Matrix</h4>
                  <pre className="text-xs font-mono bg-slate-100 dark:bg-slate-800 p-3 rounded overflow-x-auto">
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
                    className={`bg-gradient-to-br from-${concept.color}-50 to-white dark:from-${concept.color}-950/20 dark:to-slate-900 rounded-lg p-4 border-2 border-${concept.color}-200 dark:border-${concept.color}-800/50 hover:shadow-lg transition-all cursor-pointer group`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-lg bg-${concept.color}-100 dark:bg-${concept.color}-900/50 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                        <Icon className={`h-5 w-5 text-${concept.color}-600 dark:text-${concept.color}-400`} />
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
            <div className="space-y-3">
              {algorithms.map((algo, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-base">{algo.name}</h4>
                    <Badge variant="outline" className="bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                      {algo.complexity}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{algo.description}</p>
                  <div className="flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-yellow-500" />
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      Use Case: {algo.application}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
            
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border border-blue-200 dark:border-blue-700/50 rounded-lg p-4">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                <strong>💡 Did you know?</strong> A 300-qubit quantum computer could perform more calculations simultaneously than there are atoms in the universe (≈10⁸⁰).
              </p>
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
                <pre className="bg-slate-900 text-slate-50 p-4 rounded-lg text-xs overflow-x-auto">
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
                <pre className="bg-slate-900 text-slate-50 p-4 rounded-lg text-xs overflow-x-auto">
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