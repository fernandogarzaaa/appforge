import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BookOpen, Code2 } from 'lucide-react'

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
      icon: '⚛️',
    },
    {
      title: 'Superposition',
      description: 'Quantum state that is both 0 and 1 simultaneously',
      icon: '🌀',
    },
    {
      title: 'Entanglement',
      description: 'Correlation between qubits such that measuring one affects others',
      icon: '🔗',
    },
    {
      title: 'Interference',
      description: 'Quantum amplitudes add and cancel to compute results',
      icon: '〰️',
    },
    {
      title: 'Measurement',
      description: 'Observing a qubit collapses it to 0 or 1',
      icon: '📊',
    },
    {
      title: 'Phase',
      description: 'Complex number describing quantum state evolution',
      icon: '📐',
    },
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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="gates">Quantum Gates</TabsTrigger>
            <TabsTrigger value="concepts">Concepts</TabsTrigger>
            <TabsTrigger value="code">Code Example</TabsTrigger>
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
              {concepts.map((concept, i) => (
                <div
                  key={i}
                  className="bg-slate-50 dark:bg-slate-900 rounded-lg p-3 border border-slate-200 dark:border-slate-700"
                >
                  <div className="text-2xl mb-2">{concept.icon}</div>
                  <h4 className="font-semibold text-sm">{concept.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1">{concept.description}</p>
                </div>
              ))}
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
