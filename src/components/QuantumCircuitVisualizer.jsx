import React, { useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Trash2, RotateCcw } from 'lucide-react'

/**
 * QuantumCircuitVisualizer - Interactive quantum circuit visualization
 * Allows users to build and visualize quantum circuits with drag-and-drop gates
 */
export function QuantumCircuitVisualizer({ initialQubits = 3, onCircuitChange: _onCircuitChange }) {
  const [qubits, setQubits] = useState(initialQubits)
  const [gates, setGates] = useState([])
  const [selectedGate, setSelectedGate] = useState(null)
  const [circuitSteps, setCircuitSteps] = useState(0)

  // Quantum gate definitions
  const gateTypes = [
    { name: 'H', label: 'Hadamard', color: '#3B82F6', description: 'Superposition' },
    { name: 'X', label: 'Pauli-X', color: '#EF4444', description: 'Bit Flip' },
    { name: 'Y', label: 'Pauli-Y', color: '#F59E0B', description: 'Rotation' },
    { name: 'Z', label: 'Pauli-Z', color: '#10B981', description: 'Phase' },
    { name: 'S', label: 'S Gate', color: '#8B5CF6', description: 'Phase-90' },
    { name: 'T', label: 'T Gate', color: '#EC4899', description: 'Phase-45' },
    { name: 'CNOT', label: 'CNOT', color: '#06B6D4', description: 'Entangle', span: 2 },
    { name: 'SWAP', label: 'SWAP', color: '#14B8A6', description: 'Exchange', span: 2 },
  ]

  const addGate = useCallback((gateName) => {
    const gate = gateTypes.find(g => g.name === gateName)
    if (!gate) return

    const newGate = {
      id: `${gateName}-${Date.now()}`,
      name: gateName,
      qubit: 0,
      position: circuitSteps,
      color: gate.color,
      label: gate.label,
    }

    setGates([...gates, newGate])
    setCircuitSteps(circuitSteps + 1)
  }, [gates, circuitSteps, gateTypes])

  const removeGate = useCallback((gateId) => {
    setGates(gates.filter(g => g.id !== gateId))
  }, [gates])

  const moveGate = useCallback((gateId, newQubit) => {
    if (newQubit >= 0 && newQubit < qubits) {
      setGates(gates.map(g => 
        g.id === gateId ? { ...g, qubit: newQubit } : g
      ))
    }
  }, [gates, qubits])

  const resetCircuit = useCallback(() => {
    setGates([])
    setCircuitSteps(0)
    setSelectedGate(null)
  }, [])

  const addQubit = useCallback(() => {
    setQubits(qubits + 1)
  }, [qubits])

  const removeQubit = useCallback(() => {
    if (qubits > 1) {
      setQubits(qubits - 1)
      // Remove gates on the removed qubit
      setGates(gates.filter(g => g.qubit < qubits - 1))
    }
  }, [qubits, gates])

  // Calculate total gates and circuit depth
  const totalGates = gates.length
  const circuitDepth = gates.length > 0 ? Math.max(...gates.map(g => g.position)) + 1 : 0
  const entanglementCount = gates.filter(g => g.name === 'CNOT' || g.name === 'SWAP').length

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Quantum Circuit Designer</CardTitle>
              <CardDescription>Build and visualize quantum circuits interactively</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={resetCircuit}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Qubit Management */}
          <div className="flex items-center gap-2 pb-4 border-b">
            <span className="text-sm font-medium">Qubits: {qubits}</span>
            <Button 
              variant="outline" 
              size="sm"
              onClick={addQubit}
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={removeQubit}
              disabled={qubits === 1}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          {/* Circuit Visualization */}
          <div className="bg-slate-900 rounded-lg p-4 overflow-x-auto">
            <div className="inline-block min-w-full">
              {/* Qubit Labels and Lines */}
              {Array.from({ length: qubits }).map((_, qubitIndex) => (
                <div key={qubitIndex} className="flex items-center h-12 relative">
                  <div className="w-12 text-right pr-2">
                    <span className="text-xs font-mono text-slate-400">q{qubitIndex}</span>
                  </div>
                  <div className="flex-1 relative h-px bg-slate-700">
                    {/* Gates on this qubit */}
                    {gates
                      .filter(g => g.qubit === qubitIndex)
                      .map(gate => (
                        <div
                          key={gate.id}
                          className="absolute top-1/2 transform -translate-y-1/2 cursor-pointer group"
                          style={{
                            left: `${(gate.position / Math.max(circuitSteps, 1)) * 100}%`,
                          }}
                          onClick={() => setSelectedGate(gate.id)}
                        >
                          <div
                            className="w-10 h-10 rounded flex items-center justify-center text-white text-xs font-bold hover:opacity-80 transition-opacity"
                            style={{ backgroundColor: gate.color }}
                            title={gate.label}
                          >
                            {gate.name}
                          </div>
                          <div className="hidden group-hover:block absolute bottom-full mb-2 bg-slate-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                            {gate.label}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ))}

              {/* Circuit Steps */}
              {circuitSteps > 0 && (
                <div className="flex items-center h-8 pl-14 text-xs text-slate-500">
                  {Array.from({ length: circuitSteps }).map((_, i) => (
                    <div key={i} className="flex-1 text-center text-xs">
                      {i}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Gate Palette */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Quantum Gates</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {gateTypes.map(gate => (
                <Button
                  key={gate.name}
                  variant="outline"
                  size="sm"
                  onClick={() => addGate(gate.name)}
                  className="flex flex-col items-center gap-1 h-auto py-2"
                >
                  <span
                    className="w-8 h-8 rounded flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: gate.color }}
                  >
                    {gate.name}
                  </span>
                  <span className="text-xs">{gate.label}</span>
                  <span className="text-xs text-muted-foreground">{gate.description}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Circuit Statistics */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-500">{totalGates}</div>
              <div className="text-xs text-muted-foreground">Total Gates</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">{circuitDepth}</div>
              <div className="text-xs text-muted-foreground">Circuit Depth</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-500">{entanglementCount}</div>
              <div className="text-xs text-muted-foreground">Entanglements</div>
            </div>
          </div>

          {/* Selected Gate Info */}
          {selectedGate && gates.find(g => g.id === selectedGate) && (
            <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">Selected Gate</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeGate(selectedGate)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="text-sm space-y-1">
                <p><span className="text-muted-foreground">Gate:</span> {gates.find(g => g.id === selectedGate)?.label}</p>
                <p><span className="text-muted-foreground">Qubit:</span> {gates.find(g => g.id === selectedGate)?.qubit}</p>
              </div>
              <div className="flex gap-2">
                {Array.from({ length: qubits }).map((_, i) => (
                  <Button
                    key={i}
                    variant={gates.find(g => g.id === selectedGate)?.qubit === i ? "default" : "outline"}
                    size="sm"
                    onClick={() => moveGate(selectedGate, i)}
                  >
                    q{i}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default QuantumCircuitVisualizer
