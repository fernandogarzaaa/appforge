
import { SuperpositionProcessor, initializeWasm } from '../src/utils/QuantumEngine.js';

(async () => {
    console.log("🧪 Testing Quantum Bridge...");

    // 1. Initialize
    // This should log "Quantum Rust Core loaded successfully" or "Using JS fallback"
    await initializeWasm();

    // 2. Test Superposition (which uses the bridge)
    const processor = new SuperpositionProcessor();
    const d = processor.levenshteinDistance("kitten", "sitting");
    console.log(`📏 Levenshtein Distance ('kitten', 'sitting'): ${d}`);

    if (d === 3) {
        console.log("✅ Quantum Bridge Verified: Calculation Correct");
    } else {
        console.error(`❌ Calculation Failed: Expected 3, got ${d}`);
        process.exit(1);
    }
})();
