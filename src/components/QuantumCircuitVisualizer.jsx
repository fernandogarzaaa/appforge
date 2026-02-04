import React, { useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2, RotateCcw, Download, Share2, Zap, Sparkles } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

/**
 * QuantumCircuitVisualizer - Interactive quantum circuit visualization
 * Allows users to build and visualize quantum circuits with drag-and-drop gates
 */
export function QuantumCircuitVisualizer({ initialQubits = 3, onCircuitChange: _onCircuitChange }) {
  const [qubits, setQubits] = useState(initialQubits)
  const [gates, setGates] = useState([])
  const [selectedGate, setSelectedGate] = useState(null)
  const [circuitSteps, setCircuitSteps] = useState(0)

  // Enhanced quantum gate definitions with more gates
  const gateTypes = [
    { name: 'H', label: 'Hadamard', color: '#3B82F6', description: 'Superposition', category: 'single' },
    { name: 'X', label: 'Pauli-X', color: '#EF4444', description: 'Bit Flip', category: 'single' },
    { name: 'Y', label: 'Pauli-Y', color: '#F59E0B', description: 'Rotation', category: 'single' },
    { name: 'Z', label: 'Pauli-Z', color: '#10B981', description: 'Phase', category: 'single' },
    { name: 'S', label: 'S Gate', color: '#8B5CF6', description: 'Phase-90', category: 'single' },
    { name: 'T', label: 'T Gate', color: '#EC4899', description: 'Phase-45', category: 'single' },
    { name: 'RX', label: 'RX', color: '#F97316', description: 'X-Rotation', category: 'single' },
    { name: 'RY', label: 'RY', color: '#84CC16', description: 'Y-Rotation', category: 'single' },
    { name: 'RZ', label: 'RZ', color: '#22D3EE', description: 'Z-Rotation', category: 'single' },
    { name: 'CNOT', label: 'CNOT', color: '#06B6D4', description: 'Entangle', span: 2, category: 'multi' },
    { name: 'SWAP', label: 'SWAP', color: '#14B8A6', description: 'Exchange', span: 2, category: 'multi' },
    { name: 'CZ', label: 'CZ', color: '#A855F7', description: 'Control-Z', span: 2, category: 'multi' },
    { name: 'Toffoli', label: 'Toffoli', color: '#F43F5E', description: 'AND Gate', span: 3, category: 'multi' },
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

  const exportCircuit = useCallback(() => {
    const qasm = `OPENQASM 2.0;\ninclude "qelib1.inc";\nqreg q[${qubits}];\ncreg c[${qubits}];\n\n${gates.map(g => `${g.name.toLowerCase()} q[${g.qubit}];`).join('\n')}\n\nmeasure q -> c;`
    navigator.clipboard.writeText(qasm)
    toast.success('QASM code copied to clipboard!')
  }, [qubits, gates])

  const shareCircuit = useCallback(() => {
    const circuitData = { qubits, gates: gates.map(g => ({ name: g.name, qubit: g.qubit, position: g.position })) }
    const encoded = btoa(JSON.stringify(circuitData))
    navigator.clipboard.writeText(`${window.location.origin}/quantum?circuit=${encoded}`)
    toast.success('Shareable link copied!')
  }, [qubits, gates])

  const loadPreset = useCallback((preset) => {
    switch (preset) {
      case 'bell':
        setQubits(2)
        setGates([
          { id: 'h-1', name: 'H', qubit: 0, position: 0, color: '#3B82F6', label: 'Hadamard' },
          { id: 'cnot-1', name: 'CNOT', qubit: 0, position: 1, color: '#06B6D4', label: 'CNOT' }
        ])
        setCircuitSteps(2)
        toast.success('Loaded Bell State circuit')
        break
      case 'ghz':
        setQubits(3)
        setGates([
          { id: 'h-1', name: 'H', qubit: 0, position: 0, color: '#3B82F6', label: 'Hadamard' },
          { id: 'cnot-1', name: 'CNOT', qubit: 0, position: 1, color: '#06B6D4', label: 'CNOT' },
          { id: 'cnot-2', name: 'CNOT', qubit: 1, position: 2, color: '#06B6D4', label: 'CNOT' }
        ])
        setCircuitSteps(3)
        toast.success('Loaded GHZ State circuit')
        break
      case 'teleport':
        setQubits(3)
        setGates([
          { id: 'h-1', name: 'H', qubit: 1, position: 0, color: '#3B82F6', label: 'Hadamard' },
          { id: 'cnot-1', name: 'CNOT', qubit: 1, position: 1, color: '#06B6D4', label: 'CNOT' },
          { id: 'cnot-2', name: 'CNOT', qubit: 0, position: 2, color: '#06B6D4', label: 'CNOT' },
          { id: 'h-2', name: 'H', qubit: 0, position: 3, color: '#3B82F6', label: 'Hadamard' }
        ])
        setCircuitSteps(4)
        toast.success('Loaded Quantum Teleportation circuit')
        break
    }
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
                onClick={exportCircuit}
                disabled={gates.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={shareCircuit}
                disabled={gates.length === 0}
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
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

          {/* Preset Circuits */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-500" />
              Famous Quantum Circuits
            </h4>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadPreset('bell')}
                className="flex flex-col items-center gap-1 h-auto py-3"
              >
                <Badge className="bg-cyan-500 text-white">Bell</Badge>
                <span className="text-xs text-muted-foreground">Entanglement</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadPreset('ghz')}
                className="flex flex-col items-center gap-1 h-auto py-3"
              >
                <Badge className="bg-purple-500 text-white">GHZ</Badge>
                <span className="text-xs text-muted-foreground">3-Qubit</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadPreset('teleport')}
                className="flex flex-col items-center gap-1 h-auto py-3"
              >
                <Badge className="bg-pink-500 text-white">Teleport</Badge>
                <span className="text-xs text-muted-foreground">Quantum</span>
              </Button>
            </div>
          </div>

          {/* Gate Palette */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              Quantum Gates
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {gateTypes.map(gate => (
                <Button
                  key={gate.name}
                  variant="outline"
                  size="sm"
                  onClick={() => addGate(gate.name)}
                  className="flex flex-col items-center gap-1 h-auto py-2 hover:scale-105 transition-transform"
                >
                  <motion.span
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.5 }}
                    className="w-8 h-8 rounded flex items-center justify-center text-white text-xs font-bold shadow-lg"
                    style={{ backgroundColor: gate.color }}
                  >
                    {gate.name}
                  </motion.span>
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