# RTX 2060 6GB VRAM Optimization Guide
## Specific Recommendations for AppForge on Consumer GPUs

**Hardware Target:** NVIDIA GeForce RTX 2060 (6GB GDDR6)  
**Architecture:** Turing (TU106)  
**Memory Bandwidth:** 336 GB/s  
**Tensor Cores:** Yes (limited FP16 support)  
**CUDA Cores:** 1920  

---

## Quick Reference: VRAM Budget

| Component | Recommended Budget | Notes |
|-----------|-------------------|-------|
| System/OS Overhead | ~500 MB | Unavoidable |
| Quantum Circuits | 2-3 GB | Sparse vectors required |
| Neural Networks | 1-2 GB | Quantized weights |
| RL Q-Tables | 500 MB - 1 GB | Bounded with LRU |
| Genetic Algorithms | 200-500 MB | Limited population |
| Stream Processing | 100-200 MB | With backpressure |
| **TOTAL HEADROOM** | **~1 GB** | Safety margin |

**Key Rule:** Never exceed 5.5GB sustained usage; peak at 6GB only briefly.

---

## 1. Quantum Circuit Simulation Limits

### Maximum Qubit Configuration

```javascript
// RTX 2060 Configuration
const RTX2060_QUANTUM_LIMITS = {
    // Dense state vector limits
    maxQubitsDense: 20,      // 2^20 = 1M states (~16MB fp64, ~8MB fp32)
    maxQubitsDenseSafe: 18,  // 2^18 = 262K states (~4MB fp32)
    
    // Sparse state vector limits (recommended)
    maxQubitsSparse: 26,     // 2^26 states but only store non-zero
    maxQubitsSparseSafe: 24, // Conservative limit
    
    // Circuit depth limits
    maxCircuitDepth: 1000,   // Gates before memory pressure
    maxGatesPerCircuit: 10000
};
```

### Recommended Implementation

```javascript
import { createMemoryBoundedSimulator } from './optimized_patterns';

// Create RTX 2060 optimized simulator
const simulator = createMemoryBoundedSimulator(24); // 24 qubits max

// Validate before simulation
function validateCircuitForGPU(circuit) {
    const issues = [];
    
    if (circuit.numQubits > 24) {
        issues.push(`Circuit has ${circuit.numQubits} qubits (max 24 for RTX 2060)`);
    }
    
    if (circuit.gates.length > 10000) {
        issues.push(`Circuit has ${circuit.gates.length} gates (may cause slowdown)`);
    }
    
    const depth = getCircuitDepth(circuit);
    if (depth > 1000) {
        issues.push(`Circuit depth ${depth} exceeds recommended 1000`);
    }
    
    return {
        valid: issues.length === 0,
        issues,
        estimatedMemoryMB: estimateCircuitMemory(circuit)
    };
}

function estimateCircuitMemory(circuit) {
    // Sparse vector: ~64 bytes per non-zero amplitude
    const estimatedNonZero = Math.min(
        Math.pow(2, circuit.numQubits) * 0.01, // Assume 1% sparsity
        1000000 // Cap at 1M amplitudes
    );
    return (estimatedNonZero * 64) / (1024 * 1024);
}
```

---

## 2. Neural Network Configuration

### Recommended Layer Sizes

```javascript
const RTX2060_NN_CONFIG = {
    // Maximum layer sizes for different architectures
    maxLayers: 5,
    maxNeuronsPerLayer: 512,
    maxTotalParameters: 500000, // ~2MB with Float32
    
    // Quantization settings
    useInt8Quantization: true,
    quantizationScale: 127,
    
    // Batch settings
    maxBatchSize: 32, // Conservative for training
    inferenceBatchSize: 128 // Can be larger for inference
};
```

### Architecture Presets

```javascript
// Small network: ~100KB memory
const SMALL_NETWORK = [32, 64, 32];

// Medium network: ~1MB memory (RECOMMENDED)
const MEDIUM_NETWORK = [128, 256, 128];

// Large network: ~4MB memory (use with caution)
const LARGE_NETWORK = [256, 512, 256, 128];

// Too large for RTX 2060: Will cause OOM
// const XL_NETWORK = [512, 1024, 1024, 512]; // DON'T USE
```

### Implementation Example

```javascript
import { QuantizedQuantumNN } from './optimized_patterns';

// Create RTX 2060 optimized network
const network = new QuantizedQuantumNN(MEDIUM_NETWORK, {
    useQuantization: true,
    useFP16: false, // JS doesn't have native fp16, use fp32
    learningRate: 0.001
});

// Verify memory before training
const memoryMB = network.memoryEstimateMB();
console.log(`Network uses ${memoryMB.toFixed(2)} MB VRAM`);

if (memoryMB > 2000) {
    console.warn('WARNING: Large network may cause OOM on RTX 2060');
}
```

---

## 3. Reinforcement Learning Limits

### Q-Table Sizing

```javascript
const RTX2060_RL_CONFIG = {
    // Q-Table limits
    maxQTableEntries: 50000,  // ~1.9MB with Float32 action values
    maxActionSpace: 100,
    
    // State quantization
    stateQuantizationBins: 10, // Reduce continuous state precision
    
    // Training settings
    maxEpisodes: 10000,
    maxStepsPerEpisode: 1000,
    
    // Memory management
    useLRU: true,
    pruneInterval: 1000 // Prune old entries every N steps
};
```

### Recommended Pattern

```javascript
import { MemoryEfficientQuantumRL } from './optimized_patterns';

const agent = new MemoryEfficientQuantumRL(64, 8, {
    maxQTableSize: 50000,
    stateQuantization: 10,
    learningRate: 0.1,
    discountFactor: 0.95
});

// Monitor Q-table size during training
function trainWithMonitoring(agent, env, episodes) {
    for (let ep = 0; ep < episodes; ep++) {
        // ... training loop ...
        
        // Log memory every 100 episodes
        if (ep % 100 === 0) {
            const tableSize = agent.qTable.size();
            const memoryMB = (tableSize * 64 * 8) / (1024 * 1024);
            console.log(`Episode ${ep}: Q-Table ${tableSize} entries, ~${memoryMB.toFixed(1)} MB`);
            
            if (tableSize > 45000) {
                console.warn('Q-Table approaching limit, consider increasing quantization');
            }
        }
    }
}
```

---

## 4. Genetic Algorithm Configuration

### Population Limits

```javascript
const RTX2060_GA_CONFIG = {
    maxPopulationSize: 100,    // Default is often 1000+
    maxGenerations: 500,
    maxGenomeSize: 50,         // Genes per individual
    
    // Memory-efficient settings
    useSharedFitnessCache: true,
    elitismCount: 5           // Keep top 5, discard rest
};
```

### Optimized Implementation

```javascript
class MemoryEfficientGeneticAlgorithm {
    constructor(options = {}) {
        this.populationSize = Math.min(options.populationSize || 100, 100);
        this.mutationRate = options.mutationRate || 0.1;
        this.genomeSize = Math.min(options.genomeSize || 10, 50);
        
        // Shared fitness cache to avoid recomputation
        this.fitnessCache = new Map();
        this.maxCacheSize = 10000;
    }

    initializePopulation() {
        // Use Float32Array for genomes (4x smaller than regular arrays)
        const population = [];
        for (let i = 0; i < this.populationSize; i++) {
            population.push({
                genes: new Float32Array(this.genomeSize).map(() => Math.random()),
                fitness: null
            });
        }
        return population;
    }

    getFitness(individual, fitnessFunction) {
        const key = individual.genes.join(',');
        
        if (this.fitnessCache.has(key)) {
            return this.fitnessCache.get(key);
        }
        
        const fitness = fitnessFunction(individual);
        
        // LRU cache eviction
        if (this.fitnessCache.size >= this.maxCacheSize) {
            const firstKey = this.fitnessCache.keys().next().value;
            this.fitnessCache.delete(firstKey);
        }
        
        this.fitnessCache.set(key, fitness);
        return fitness;
    }

    // Memory estimate: 100 individuals × 50 genes × 4 bytes = ~20KB
    memoryEstimateMB() {
        return (this.populationSize * this.genomeSize * 4) / (1024 * 1024);
    }
}
```

---

## 5. Stream Processing Configuration

### Bounded Stream Settings

```javascript
const RTX2060_STREAM_CONFIG = {
    maxQueueDepth: 50,        // Drop packets if consumer is behind
    poolSize: 20,             // Pre-allocated packet objects
    frequency: 100,           // 10Hz instead of 1Hz for lower latency
    maxPacketAge: 5000        // Discard packets older than 5 seconds
};
```

### Implementation

```javascript
import { BoundedQuantumStream } from './optimized_patterns';

const stream = new BoundedQuantumStream((packet, ack) => {
    // Process packet
    const result = processMetric(packet);
    
    // Always acknowledge to free pool slot
    ack();
    
    return result;
}, {
    maxQueued: 50,
    poolSize: 20
});

// Monitor backpressure
setInterval(() => {
    const stats = stream.getStats();
    if (stats.dropped > 0) {
        console.warn(`Stream backpressure: ${stats.dropped} packets dropped`);
    }
}, 10000);

stream.start(100); // 100ms = 10Hz
```

---

## 6. TensorFlow.js Specific Settings (if used)

### Backend Configuration

```javascript
// Force WebGL backend with memory constraints
async function configureTFJS() {
    await tf.setBackend('webgl');
    
    // RTX 2060 specific flags
    tf.env().set('WEBGL_FORCE_F16_TEXTURES', true); // Use FP16 textures
    tf.env().set('WEBGL_VERSION', 2); // WebGL 2.0
    tf.env().set('WEBGL_MAX_TEXTURE_SIZE', 4096); // Conservative limit
    
    // Memory management
    tf.env().set('WEBGL_DELETE_TEXTURE_THRESHOLD', 100); // Aggressive cleanup
}

// Memory-conscious tensor operations
function safeTensorOperation(tensor, operation) {
    const result = operation(tensor);
    
    // Dispose intermediate tensors
    if (tensor !== result) {
        tensor.dispose();
    }
    
    return result;
}

// Check memory usage
function logMemoryUsage() {
    const info = tf.memory();
    console.log(`Tensors: ${info.numTensors}, ` +
                `Data: ${(info.numBytes / 1024 / 1024).toFixed(2)} MB, ` +
                `GPU: ${(info.numBytesInGPU / 1024 / 1024).toFixed(2)} MB`);
}
```

---

## 7. WebAssembly Optimization

### WASM Memory Configuration

```javascript
// Configure WASM memory pool for RTX 2060
const WASM_CONFIG = {
    initialMemoryPages: 256,   // 16MB initial
    maximumMemoryPages: 2048,  // 128MB max (leaving room for GPU)
    sharedMemory: false        // Don't share with GPU memory
};

// Initialize WASM with memory limits
async function initWASMWithLimits() {
    const memory = new WebAssembly.Memory({
        initial: WASM_CONFIG.initialMemoryPages,
        maximum: WASM_CONFIG.maximumMemoryPages
    });
    
    const imports = { env: { memory } };
    
    // Load WASM module
    const wasm = await WebAssembly.instantiateStreaming(
        fetch('quantum_core.wasm'),
        imports
    );
    
    return wasm.instance.exports;
}
```

---

## 8. Monitoring and Debugging

### Real-time VRAM Monitor

```javascript
class VRAMMonitor {
    constructor(warningThreshold = 5.5) { // GB
        this.warningThreshold = warningThreshold;
        this.measurements = [];
    }

    // For Node.js with nvidia-smi
    async checkVRAM() {
        if (typeof process !== 'undefined') {
            const { exec } = require('child_process');
            
            return new Promise((resolve) => {
                exec('nvidia-smi --query-gpu=memory.used --format=csv,noheader,nounits', 
                    (err, stdout) => {
                        if (err) {
                            resolve(null);
                            return;
                        }
                        const usedMB = parseInt(stdout.trim());
                        resolve(usedMB / 1024); // Convert to GB
                    }
                );
            });
        }
        
        // Browser: use performance.memory (Chrome only)
        if (performance && performance.memory) {
            return performance.memory.usedJSHeapSize / (1024 * 1024 * 1024);
        }
        
        return null;
    }

    async monitor() {
        const vram = await this.checkVRAM();
        
        if (vram !== null) {
            this.measurements.push({
                timestamp: Date.now(),
                vramGB: vram
            });
            
            // Keep last 100 measurements
            if (this.measurements.length > 100) {
                this.measurements.shift();
            }
            
            if (vram > this.warningThreshold) {
                console.warn(`⚠️ HIGH VRAM USAGE: ${vram.toFixed(2)} GB / 6 GB`);
                return 'warning';
            }
        }
        
        return 'ok';
    }

    getStats() {
        if (this.measurements.length === 0) return null;
        
        const vrams = this.measurements.map(m => m.vramGB);
        return {
            current: vrams[vrams.length - 1],
            min: Math.min(...vrams),
            max: Math.max(...vrams),
            avg: vrams.reduce((a, b) => a + b, 0) / vrams.length
        };
    }
}

// Usage
const monitor = new VRAMMonitor(5.5);
setInterval(() => monitor.monitor(), 1000);
```

### Memory Profiling Wrapper

```javascript
function withMemoryTracking(fn, label) {
    const startMemory = tf ? tf.memory() : null;
    const startTime = performance.now();
    
    try {
        const result = fn();
        
        const endMemory = tf ? tf.memory() : null;
        const duration = performance.now() - startTime;
        
        if (startMemory && endMemory) {
            const delta = endMemory.numBytes - startMemory.numBytes;
            console.log(`${label}: ${duration.toFixed(2)}ms, ` +
                       `ΔMemory: ${(delta / 1024 / 1024).toFixed(2)} MB`);
        }
        
        return result;
    } catch (e) {
        console.error(`${label} failed:`, e);
        throw e;
    }
}

// Usage
const result = withMemoryTracking(
    () => runQuantumCircuit(circuit),
    'QuantumCircuit'
);
```

---

## 9. Performance Benchmarks on RTX 2060

### Expected Performance

| Operation | Small Input | Medium Input | Large Input |
|-----------|-------------|--------------|-------------|
| 20-qubit circuit | 10ms | 50ms | 200ms |
| 24-qubit circuit (sparse) | 20ms | 100ms | 500ms |
| NN forward (128→256→128) | 1ms | 5ms | 20ms |
| Q-Learning step | 0.1ms | 0.5ms | 2ms |
| Genetic Algorithm gen | 10ms | 50ms | 200ms |

### Bottlenecks to Watch

1. **JavaScript → GPU Transfer**: Minimize CPU/GPU data transfer
2. **Shader Compilation**: Warm up shaders before benchmark
3. **Memory Allocation**: Reuse buffers instead of creating new ones
4. **Garbage Collection**: Use object pools to reduce GC pauses

---

## 10. Emergency OOM Recovery

### Safe Mode Fallback

```javascript
class SafeModeFallback {
    constructor() {
        this.emergencyMode = false;
    }

    async executeWithFallback(operation, fallback) {
        try {
            return await operation();
        } catch (e) {
            if (e.message.includes('memory') || e.message.includes('OOM')) {
                console.warn('Entering emergency mode due to memory error');
                this.emergencyMode = true;
                
                // Clear caches
                if (tf) tf.engine().startScope();
                
                // Run fallback
                return await fallback();
            }
            throw e;
        }
    }

    getEmergencyConfig() {
        return {
            maxQubits: 16,
            maxPopulation: 50,
            maxQTableSize: 10000,
            useCPU: true // Fallback to CPU if GPU fails
        };
    }
}

// Usage
const safeMode = new SafeModeFallback();

const result = await safeMode.executeWithFallback(
    () => runLargeQuantumCircuit(24),
    () => runLargeQuantumCircuit(16) // Fallback to fewer qubits
);
```

---

## Summary Checklist

### Before Deployment on RTX 2060

- [ ] Set max qubits to 24 (sparse) or 18 (dense)
- [ ] Enable quantization for neural networks
- [ ] Set Q-table limit to 50,000 entries
- [ ] Limit genetic algorithm population to 100
- [ ] Add stream backpressure (max 50 queued)
- [ ] Configure TF.js WebGL with FP16 textures
- [ ] Add VRAM monitoring alerts at 5.5GB
- [ ] Test with largest expected input
- [ ] Implement safe mode fallback
- [ ] Profile memory usage under load

---

*End of RTX 2060 Optimization Guide*
