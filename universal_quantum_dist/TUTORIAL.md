
# 🎓 Quantum Engine Integration Tutorial

Welcome to the future of AI. This guide will show you how to integrate the **AppForge Quantum Engine** into your own projects.

---

## 🚀 1. Installation

Since this is a **zero-dependency** portable library, you don't need complex build tools.

### Option A: Direct Copy (Recommended for MVPs)
Simply copy the `quantum-engine-portable` folder (or just `index.js`) into your project's source directory (e.g., `src/lib/quantum`).

### Option B: Local Package (Cleanest)
1. Place the `universal_quantum_dist` folder in your project root.
2. Run:
   ```bash
   npm install ./universal_quantum_dist
   ```

---

## ⚡ 2. Quick Start (Node.js or Browser)

```javascript
import QuantumEngine from 'quantum-engine-portable'; // Or relative path './index.js'

async function main() {
    // Initialize the Core
    const engine = new QuantumEngine();
    console.log("🌌 Quantum Engine Online");

    // PROBLEM: Choose a marketing slogan
    const options = [
        "Unleash the Power", 
        "Quantum Leap Future", 
        "AI Reimagined"
    ];

    // SOLVE: Use Superposition & Annealing
    const result = await engine.quantumSolve(
        "Best Slogan", 
        options, 
        ["Future", "Power"] // Keywords/Criteria
    );

    console.log("🏆 Winner:", result.optimizedBest);
    console.log("📊 Confidence:", result.confidence);
}

main();
```

---

## ⚛️ 3. Advanced Integration: React / Next.js

You can use the Engine to power dynamic UI components.

```javascript
// src/components/QuantumSuggestion.jsx
import React, { useState, useEffect } from 'react';
import QuantumEngine from '../lib/quantum/index.js';

const engine = new QuantumEngine();

export default function QuantumSuggestion() {
    const [thought, setThought] = useState("Thinking...");

    useEffect(() => {
        // Create a dedicated Swarm Agent for the UI
        engine.swarm.addAgent("UI_Bot", "UX Designer");

        async function getThought() {
            const decision = await engine.swarm.processTask("Suggest Color Scheme");
            setThought(decision.decisions[0].proposal);
        }

        getThought();
    }, []);

    return <div className="p-4 bg-slate-900 text-cyan-400">{thought}</div>;
}
```

---

## 🧬 4. Genetic Evolution (Self-Optimizing Configs)

Use the engine to find the best variables for your app (e.g., game balancing, pricing models).

```javascript
const { genetic } = new QuantumEngine();

// Define a fitness function (Higher is better)
function evaluatePrice(entity) {
    const price = entity.genes[0] * 100; // Gene is 0.0-1.0
    // Hypothetical sales curve
    const sales = 1000 - (price * 5); 
    const revenue = price * sales;
    return revenue;
}

// Evolve for 50 generations
const result = genetic.evolve(evaluatePrice, 50);
console.log("💰 Optimal Price:", result.solution.genes[0] * 100);
```

---

## 🧠 5. Neural Network (Pattern Recognition)

```javascript
const { neural } = new QuantumEngine();

// Train to recognize XOR pattern
const data = [
    { input: [0, 0], output: [0] },
    { input: [0, 1], output: [1] },
    { input: [1, 0], output: [1] },
    { input: [1, 1], output: [0] }
];

neural.quantumTrain(data, 1000);

const prediction = neural.predict([0, 1]); // Should be close to [1]
console.log("🤖 Prediction:", prediction);
```

---

*Powered by AppForge Swarm Intelligence*
