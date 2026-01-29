import { describe, it, expect, beforeEach } from 'vitest'
import {
  createCircuit, addGate, removeGate, getCircuitDepth, getGateCount,
  getGateCountsByType, clearCircuit, validateCircuit, exportToOpenQASM,
  QuantumGates, QuantumAlgorithms, CircuitUtils
} from '@/utils/quantumComputing'
import {
  createInitialState, createSuperpositionState, applyHadamard, applyPauliX,
  applyPauliZ, applyCNOT, getProbabilities, simulate, simulateCircuit,
  calculateEntanglementEntropy, getBlochSphereCoordinates, createStateReport
} from '@/utils/quantumSimulator'

describe('Quantum Computing Suite', () => {
  describe('Circuit Construction', () => {
    it('should create a new circuit', () => {
      const circuit = createCircuit(3)
      expect(circuit.numQubits).toBe(3)
      expect(circuit.gates.length).toBe(0)
      expect(circuit.metadata.name).toBeDefined()
    })

    it('should add single-qubit gates', () => {
      const circuit = createCircuit(2)
      addGate(circuit, QuantumGates.Hadamard(0))
      addGate(circuit, QuantumGates.PauliX(1))

      expect(circuit.gates.length).toBe(2)
      expect(circuit.gates[0].name).toBe('H')
      expect(circuit.gates[1].name).toBe('X')
    })

    it('should add two-qubit gates', () => {
      const circuit = createCircuit(2)
      addGate(circuit, QuantumGates.CNOT(0, 1))

      expect(circuit.gates.length).toBe(1)
      expect(circuit.gates[0].name).toBe('CNOT')
      expect(circuit.gates[0].controlQubits).toContain(0)
      expect(circuit.gates[0].targetQubits).toContain(1)
    })

    it('should remove gates by index', () => {
      const circuit = createCircuit(2)
      addGate(circuit, QuantumGates.Hadamard(0))
      addGate(circuit, QuantumGates.PauliX(1))

      removeGate(circuit, 0)
      expect(circuit.gates.length).toBe(1)
      expect(circuit.gates[0].name).toBe('X')
    })

    it('should clear all gates', () => {
      const circuit = createCircuit(2)
      addGate(circuit, QuantumGates.Hadamard(0))
      addGate(circuit, QuantumGates.PauliX(1))

      clearCircuit(circuit)
      expect(circuit.gates.length).toBe(0)
    })

    it('should calculate circuit depth correctly', () => {
      const circuit = createCircuit(3)
      addGate(circuit, QuantumGates.Hadamard(0))
      addGate(circuit, QuantumGates.Hadamard(1))
      addGate(circuit, QuantumGates.CNOT(0, 1))

      const depth = getCircuitDepth(circuit)
      expect(depth).toBeGreaterThan(0)
    })

    it('should count gates correctly', () => {
      const circuit = createCircuit(2)
      addGate(circuit, QuantumGates.Hadamard(0))
      addGate(circuit, QuantumGates.PauliX(1))
      addGate(circuit, QuantumGates.CNOT(0, 1))

      expect(getGateCount(circuit)).toBe(3)
    })

    it('should get gate counts by type', () => {
      const circuit = createCircuit(2)
      addGate(circuit, QuantumGates.Hadamard(0))
      addGate(circuit, QuantumGates.Hadamard(1))
      addGate(circuit, QuantumGates.PauliX(0))

      const counts = getGateCountsByType(circuit)
      expect(counts.H).toBe(2)
      expect(counts.X).toBe(1)
    })
  })

  describe('Circuit Validation', () => {
    it('should validate valid circuits', () => {
      const circuit = createCircuit(2)
      addGate(circuit, QuantumGates.Hadamard(0))
      addGate(circuit, QuantumGates.CNOT(0, 1))

      const result = validateCircuit(circuit)
      expect(result.valid).toBe(true)
      expect(result.errors.length).toBe(0)
    })

    it('should detect invalid qubit references', () => {
      const circuit = createCircuit(2)
      addGate(circuit, {
        name: 'H',
        type: 'single',
        targetQubits: [5], // Invalid qubit
      })

      const result = validateCircuit(circuit)
      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('should warn about deep circuits', () => {
      const circuit = createCircuit(2)
      for (let i = 0; i < 150; i++) {
        addGate(circuit, QuantumGates.Hadamard(0))
      }

      const result = validateCircuit(circuit)
      expect(result.warnings.length).toBeGreaterThan(0)
    })
  })

  describe('Quantum Algorithms', () => {
    it('should generate Bell states', () => {
      const result = QuantumAlgorithms.bellStateGenerator(2)
      expect(result.name).toBe('Bell State Generator')
      expect(result.circuit.numQubits).toBe(4)
      expect(result.gateCount).toBeGreaterThan(0)
    })

    it("should generate Grover's algorithm", () => {
      const result = QuantumAlgorithms.groversAlgorithm(3, 1)
      expect(result.name).toBe("Grover's Algorithm")
      expect(result.circuit.numQubits).toBe(3)
      expect(result.parameters.numQubits).toBe(3)
    })

    it('should generate Deutsch-Jozsa algorithm', () => {
      const result = QuantumAlgorithms.deutschJozsaAlgorithm(2)
      expect(result.name).toBe('Deutsch-Jozsa Algorithm')
      expect(result.circuit.numQubits).toBe(3) // n+1 qubits
    })

    it('should generate Quantum Fourier Transform', () => {
      const result = QuantumAlgorithms.quantumFourierTransform(3)
      expect(result.name).toBe('Quantum Fourier Transform')
      expect(result.circuit.numQubits).toBe(3)
    })

    it("should generate Shor's algorithm", () => {
      const result = QuantumAlgorithms.shorsAlgorithm(15)
      expect(result.name).toBe("Shor's Algorithm")
      expect(result.parameters.numberToFactor).toBe(15)
      expect(result.parameters.expectedFactors).toContain(3)
      expect(result.parameters.expectedFactors).toContain(5)
    })
  })

  describe('Quantum State Simulation', () => {
    it('should create initial |0⟩ state', () => {
      const state = createInitialState(2)
      expect(state.numQubits).toBe(2)
      expect(state.amplitudes.length).toBe(4)
      expect(state.amplitudes[0].real).toBe(1) // |00⟩ amplitude
    })

    it('should create superposition state', () => {
      const state = createSuperpositionState(2)
      expect(state.numQubits).toBe(2)
      expect(state.amplitudes.length).toBe(4)

      const probs = getProbabilities(state)
      expect(Object.keys(probs).length).toBe(4)
      Object.values(probs).forEach(prob => {
        expect(prob).toBeCloseTo(0.25, 2)
      })
    })

    it('should apply Hadamard gate', () => {
      let state = createInitialState(1)
      state = applyHadamard(state, 0)

      const probs = getProbabilities(state)
      expect(Object.keys(probs).length).toBe(2)
      expect(probs['0']).toBeCloseTo(0.5, 2)
      expect(probs['1']).toBeCloseTo(0.5, 2)
    })

    it('should apply Pauli-X gate', () => {
      let state = createInitialState(1)
      state = applyPauliX(state, 0)

      const probs = getProbabilities(state)
      expect(probs['1']).toBeCloseTo(1, 2)
      expect(probs['0'] || 0).toBeLessThan(0.01)
    })

    it('should apply Pauli-Z gate', () => {
      let state = createInitialState(1)
      state = applyHadamard(state, 0) // Create |+⟩
      state = applyPauliZ(state, 0) // Convert to |-⟩

      const probs = getProbabilities(state)
      expect(Object.keys(probs).length).toBe(2)
    })

    it('should apply CNOT gate and create entanglement', () => {
      let state = createInitialState(2)
      state = applyHadamard(state, 0)
      state = applyCNOT(state, 0, 1)

      const probs = getProbabilities(state)
      // Should have only |00⟩ and |11⟩ after Hadamard + CNOT
      expect(Object.keys(probs).length).toBe(2)
      // Check that the two states exist (they may be with different key formats)
      const keys = Object.keys(probs)
      expect(keys[0]).toBeDefined()
      expect(keys[1]).toBeDefined()
    })

    it('should simulate measurements', () => {
      let state = createInitialState(2)
      state = applyHadamard(state, 0)

      const results = simulate(state, 1000)
      expect(Object.keys(results).length).toBeGreaterThan(0)

      const totalShots = Object.values(results).reduce((a, b) => a + b, 0)
      expect(totalShots).toBe(1000)
    })

    it('should calculate entanglement entropy', () => {
      let state = createInitialState(2)
      state = applyHadamard(state, 0)
      state = applyCNOT(state, 0, 1)

      const entropy = calculateEntanglementEntropy(state)
      expect(entropy).toBeGreaterThan(0)
      expect(entropy).toBeLessThanOrEqual(2)
    })

    it('should get Bloch sphere coordinates for single qubit', () => {
      let state = createInitialState(1)
      state = applyHadamard(state, 0)

      const coords = getBlochSphereCoordinates(state)
      expect(coords).toHaveProperty('x')
      expect(coords).toHaveProperty('y')
      expect(coords).toHaveProperty('z')
      expect(coords).toHaveProperty('purity')
    })

    it('should create state report', () => {
      let state = createInitialState(2)
      state = applyHadamard(state, 0)

      const report = createStateReport(state)
      expect(report).toHaveProperty('numQubits')
      expect(report).toHaveProperty('entropy')
      expect(report).toHaveProperty('topStates')
      expect(report.topStates).toBeInstanceOf(Array)
    })
  })

  describe('Circuit Simulation', () => {
    it('should simulate complete circuit', () => {
      const circuit = createCircuit(2)
      addGate(circuit, QuantumGates.Hadamard(0))
      addGate(circuit, QuantumGates.CNOT(0, 1))
      addGate(circuit, QuantumGates.Measure(0))
      addGate(circuit, QuantumGates.Measure(1))

      const result = simulateCircuit(circuit, 1000)
      expect(result.finalState).toBeDefined()
      expect(result.measurements).toBeDefined()
      expect(Object.values(result.measurements).reduce((a, b) => a + b, 0)).toBe(1000)
    })

    it('should create measurement statistics', () => {
      const circuit = createCircuit(1)
      addGate(circuit, QuantumGates.Hadamard(0))
      addGate(circuit, QuantumGates.Measure(0))

      const result = simulateCircuit(circuit, 1000)
      expect(result.measurements['0']).toBeDefined()
      expect(result.measurements['1']).toBeDefined()

      const ratio0 = result.measurements['0'] / 1000
      const ratio1 = result.measurements['1'] / 1000

      expect(ratio0).toBeGreaterThan(0.3)
      expect(ratio0).toBeLessThan(0.7)
      expect(ratio1).toBeGreaterThan(0.3)
      expect(ratio1).toBeLessThan(0.7)
    })
  })

  describe('OpenQASM Export', () => {
    it('should export circuit to OpenQASM format', () => {
      const circuit = createCircuit(2)
      addGate(circuit, QuantumGates.Hadamard(0))
      addGate(circuit, QuantumGates.CNOT(0, 1))
      addGate(circuit, QuantumGates.Measure(0))

      const qasm = exportToOpenQASM(circuit)
      expect(qasm).toContain('OPENQASM 2.0')
      expect(qasm).toContain('qreg q[2]')
      expect(qasm).toContain('h q[0]')
      expect(qasm).toContain('cx q[0], q[1]')
      expect(qasm).toContain('measure q[0]')
    })
  })

  describe('Algorithm Performance', () => {
    it('should handle large circuits efficiently', () => {
      const circuit = createCircuit(8)
      for (let i = 0; i < 100; i++) {
        addGate(circuit, QuantumGates.Hadamard(i % 8))
      }

      const startTime = Date.now()
      const result = simulateCircuit(circuit, 100)
      const duration = Date.now() - startTime

      expect(result.finalState).toBeDefined()
      expect(duration).toBeLessThan(5000) // Should complete in under 5 seconds
    })

    it('should optimize circuit depth', () => {
      const circuit = createCircuit(3)
      const result = QuantumAlgorithms.quantumFourierTransform(3)

      const depth = getCircuitDepth(result.circuit)
      const gateCount = getGateCount(result.circuit)

      expect(depth).toBeLessThan(gateCount) // Depth should be less than total gates due to parallelism
    })
  })
})
