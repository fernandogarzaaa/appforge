import React, { useState, useCallback } from 'react'
import { Plus, Trash2, Play, Download, RotateCw, Zap } from 'lucide-react'
import {
  createCircuit, addGate, removeGate, getCircuitDepth, getGateCount,
  getGateCountsByType, validateCircuit, exportToOpenQASM,
  QuantumGates, QuantumAlgorithms
} from '@/utils/quantumComputing'
import { simulateCircuit } from '@/utils/quantumSimulator'

/**
 * Quantum Circuit Builder Component
 * Allows interactive creation and manipulation of quantum circuits
 */
export default function QuantumCircuitBuilder() {
  const [numQubits, setNumQubits] = useState(3)
  const [circuit, setCircuit] = useState(createCircuit(3, { name: 'My Quantum Circuit' }))
  const [selectedAlgorithm, setSelectedAlgorithm] = useState('bell')
  const [algorithmParams, setAlgorithmParams] = useState({ numPairs: 2 })
  const [simulationResults, setSimulationResults] = useState(null)
  const [_activeTab, _setActiveTab] = useState('builder')
  const [showGateHelp, setShowGateHelp] = useState(false)

  // Gate insertion functions
  const insertGate = useCallback((gateFn, ...args) => {
    const gate = gateFn(...args)
    setCircuit(prev => addGate({ ...prev }, gate))
  }, [])

  const handleClearCircuit = useCallback(() => {
    setCircuit(createCircuit(numQubits, { name: circuit.metadata.name }))
    setSimulationResults(null)
  }, [numQubits, circuit.metadata.name])

  const handleRemoveGate = useCallback((index) => {
    setCircuit(prev => removeGate({ ...prev }, index))
  }, [])

  const handleChangeQubits = useCallback((newCount) => {
    setNumQubits(newCount)
    setCircuit(createCircuit(newCount, { name: circuit.metadata.name }))
    setSimulationResults(null)
  }, [circuit.metadata.name])

  // Algorithm generation
  const handleLoadAlgorithm = useCallback(() => {
    let newCircuit = null

    switch (selectedAlgorithm) {
      case 'bell':
        newCircuit = QuantumAlgorithms.bellStateGenerator(algorithmParams.numPairs).circuit
        break
      case 'grover':
        newCircuit = QuantumAlgorithms.groversAlgorithm(algorithmParams.numQubits, 1).circuit
        break
      case 'deutsch':
        newCircuit = QuantumAlgorithms.deutschJozsaAlgorithm(algorithmParams.numQubits).circuit
        break
      case 'qft':
        newCircuit = QuantumAlgorithms.quantumFourierTransform(algorithmParams.numQubits).circuit
        break
      default:
        return
    }

    if (newCircuit) {
      setCircuit(newCircuit)
      setNumQubits(newCircuit.numQubits)
      setSimulationResults(null)
    }
  }, [selectedAlgorithm, algorithmParams])

  // Simulation
  const handleSimulate = useCallback(() => {
    const validation = validateCircuit(circuit)
    if (!validation.valid) {
      alert('Circuit validation failed:\n' + validation.errors.join('\n'))
      return
    }

    const results = simulateCircuit(circuit, 1000)
    setSimulationResults(results)
  }, [circuit])

  // Export
  const handleExportQASM = useCallback(() => {
    const qasm = exportToOpenQASM(circuit)
    const element = document.createElement('a')
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(qasm))
    element.setAttribute('download', `${circuit.metadata.name}.qasm`)
    element.style.display = 'none'
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }, [circuit])

  const handleExportJSON = useCallback(() => {
    const json = JSON.stringify(circuit, null, 2)
    const element = document.createElement('a')
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(json))
    element.setAttribute('download', `${circuit.metadata.name}.json`)
    element.style.display = 'none'
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }, [circuit])

  // Visualization helpers
  const gateCountsByType = getGateCountsByType(circuit)
  const circuitDepth = getCircuitDepth(circuit)
  const totalGates = getGateCount(circuit)

  // Gate palette
  const gatePalette = [
    { label: 'H', fn: (q) => QuantumGates.Hadamard(q), category: 'Single-Qubit', color: 'bg-blue-500' },
    { label: 'X', fn: (q) => QuantumGates.PauliX(q), category: 'Single-Qubit', color: 'bg-red-500' },
    { label: 'Y', fn: (q) => QuantumGates.PauliY(q), category: 'Single-Qubit', color: 'bg-green-500' },
    { label: 'Z', fn: (q) => QuantumGates.PauliZ(q), category: 'Single-Qubit', color: 'bg-purple-500' },
    { label: 'CNOT', fn: (c, t) => QuantumGates.CNOT(c, t), category: 'Two-Qubit', color: 'bg-orange-500' },
    { label: 'SWAP', fn: (q1, q2) => QuantumGates.SWAP(q1, q2), category: 'Two-Qubit', color: 'bg-pink-500' },
  ]

  return (
    <div className="h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="bg-slate-800/50 border-b border-slate-700 p-6">
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 flex items-center gap-3">
          <Zap className="w-8 h-8 text-cyan-400" />
          Quantum Circuit Builder
        </h1>
        <p className="text-slate-400 mt-2">Build and simulate quantum circuits with real quantum algorithms</p>
      </div>

      {/* Main Content */}
      <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-150px)] overflow-auto">
        {/* Left Panel - Controls */}
        <div className="lg:col-span-1 space-y-4">
          {/* Qubit Configuration */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <h3 className="font-bold text-white mb-3">Qubit Configuration</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-slate-300 block mb-2">Number of Qubits: {numQubits}</label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={numQubits}
                  onChange={(e) => handleChangeQubits(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                />
              </div>
              <input
                type="text"
                placeholder="Circuit name..."
                value={circuit.metadata.name}
                onChange={(e) => setCircuit(prev => ({
                  ...prev,
                  metadata: { ...prev.metadata, name: e.target.value }
                }))}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
              />
            </div>
          </div>

          {/* Algorithm Templates */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <h3 className="font-bold text-white mb-3">Algorithm Templates</h3>
            <div className="space-y-2">
              <select
                value={selectedAlgorithm}
                onChange={(e) => setSelectedAlgorithm(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
              >
                <option value="bell">Bell States (Entanglement)</option>
                <option value="grover">Grover's Algorithm</option>
                <option value="deutsch">Deutsch-Jozsa</option>
                <option value="qft">Quantum Fourier Transform</option>
              </select>

              {selectedAlgorithm === 'bell' && (
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={algorithmParams.numPairs}
                  onChange={(e) => setAlgorithmParams({ ...algorithmParams, numPairs: parseInt(e.target.value) })}
                  placeholder="Pairs"
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                />
              )}

              <button
                onClick={handleLoadAlgorithm}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-3 py-2 rounded font-semibold hover:shadow-lg hover:shadow-cyan-500/50 transition"
              >
                Load Algorithm
              </button>
            </div>
          </div>

          {/* Circuit Statistics */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <h3 className="font-bold text-white mb-3">Circuit Statistics</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Total Gates:</span>
                <span className="text-cyan-400 font-semibold">{totalGates}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Circuit Depth:</span>
                <span className="text-cyan-400 font-semibold">{circuitDepth}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Qubits:</span>
                <span className="text-cyan-400 font-semibold">{circuit.numQubits}</span>
              </div>
              {Object.entries(gateCountsByType).length > 0 && (
                <div className="border-t border-slate-700 pt-2 mt-2">
                  <span className="text-slate-400 block mb-2">Gates Used:</span>
                  {Object.entries(gateCountsByType).map(([gate, count]) => (
                    <div key={gate} className="flex justify-between text-xs">
                      <span className="text-slate-400">{gate}:</span>
                      <span className="text-slate-300">{count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            <button
              onClick={handleSimulate}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded font-semibold hover:shadow-lg hover:shadow-green-500/50 transition flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4" />
              Simulate
            </button>
            <button
              onClick={handleClearCircuit}
              className="w-full bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded font-semibold transition flex items-center justify-center gap-2"
            >
              <RotateCw className="w-4 h-4" />
              Clear
            </button>
          </div>

          {/* Export Options */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <h3 className="font-bold text-white mb-3">Export</h3>
            <div className="space-y-2">
              <button
                onClick={handleExportQASM}
                className="w-full bg-slate-700 hover:bg-slate-600 text-white px-3 py-2 rounded text-sm font-semibold transition"
              >
                <Download className="w-4 h-4 inline mr-2" />
                OpenQASM
              </button>
              <button
                onClick={handleExportJSON}
                className="w-full bg-slate-700 hover:bg-slate-600 text-white px-3 py-2 rounded text-sm font-semibold transition"
              >
                <Download className="w-4 h-4 inline mr-2" />
                JSON
              </button>
            </div>
          </div>
        </div>

        {/* Center Panel - Circuit Editor */}
        <div className="lg:col-span-2 space-y-4">
          {/* Gate Palette */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-white">Gate Palette</h3>
              <button
                onClick={() => setShowGateHelp(!showGateHelp)}
                className="text-xs text-cyan-400 hover:text-cyan-300"
              >
                {showGateHelp ? 'Hide' : 'Show'} Help
              </button>
            </div>

            {showGateHelp && (
              <div className="bg-slate-700/50 rounded p-3 mb-3 text-xs text-slate-300 max-h-24 overflow-auto">
                <p><strong>H:</strong> Creates superposition</p>
                <p><strong>X:</strong> Bit flip (NOT gate)</p>
                <p><strong>Y:</strong> Y-axis rotation</p>
                <p><strong>Z:</strong> Phase flip</p>
                <p><strong>CNOT:</strong> Controlled NOT - entangles qubits</p>
                <p><strong>SWAP:</strong> Swaps qubit states</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              {gatePalette.map(({ label, fn, color }) => (
                <div key={label} className="space-y-1">
                  <button
                    onClick={() => {
                      if (label === 'CNOT' && numQubits >= 2) {
                        insertGate(fn, 0, 1)
                      } else if (label === 'SWAP' && numQubits >= 2) {
                        insertGate(fn, 0, 1)
                      } else if (label !== 'CNOT' && label !== 'SWAP') {
                        insertGate(fn, 0)
                      }
                    }}
                    disabled={label === 'CNOT' || label === 'SWAP' ? numQubits < 2 : false}
                    className={`w-full px-3 py-2 rounded font-semibold text-white transition ${
                      label === 'CNOT' || label === 'SWAP' ? (numQubits < 2 ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg') : 'hover:shadow-lg'
                    } ${color}`}
                  >
                    {label}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Circuit Display */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 flex-1 overflow-auto">
            <h3 className="font-bold text-white mb-3">Circuit Gates</h3>
            {circuit.gates.length === 0 ? (
              <div className="text-slate-400 text-center py-8">
                <Plus className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No gates added yet. Select gates from the palette above.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {circuit.gates.map((gate, index) => (
                  <div key={index} className="bg-slate-700 border border-slate-600 rounded p-3 flex justify-between items-center">
                    <div className="flex-1">
                      <div className="font-semibold text-white">{gate.name}</div>
                      <div className="text-xs text-slate-400">
                        Q: {gate.targetQubits.join(', ')}
                        {gate.controlQubits && ` (Control: ${gate.controlQubits.join(', ')})`}
                        {gate.angle && ` θ=${(gate.angle).toFixed(3)}`}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveGate(index)}
                      className="bg-red-500/20 hover:bg-red-500/40 text-red-400 p-2 rounded transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Results Panel */}
      {simulationResults && (
        <div className="fixed bottom-0 left-0 right-0 max-h-[40vh] bg-slate-800 border-t border-slate-700 overflow-auto">
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-bold text-white mb-2">Measurement Results (1000 shots)</h4>
              <div className="space-y-1 text-sm max-h-64 overflow-auto">
                {Object.entries(simulationResults.measurements)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 10)
                  .map(([bitstring, count]) => (
                    <div key={bitstring} className="flex justify-between text-slate-300">
                      <span>|{bitstring}⟩:</span>
                      <span className="text-cyan-400">{count} ({((count / 1000) * 100).toFixed(1)}%)</span>
                    </div>
                  ))}
              </div>
            </div>
            <div>
              <h4 className="font-bold text-white mb-2">State Report</h4>
              <div className="space-y-1 text-sm text-slate-300">
                <div>Entropy: <span className="text-cyan-400">{simulationResults.metadata.report.entropy.toFixed(3)}</span></div>
                <div>Non-zero Amplitudes: <span className="text-cyan-400">{simulationResults.metadata.report.nonzeroAmplitudes}</span></div>
                <div>Max Probability: <span className="text-cyan-400">{(simulationResults.metadata.report.maxProbability * 100).toFixed(2)}%</span></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
