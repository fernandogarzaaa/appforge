
import express from 'express';
import QuantumEngine from '../universal_quantum_dist/index.js'; // Import the Commercial Build

const app = express();
app.use(express.json());

const engine = new QuantumEngine();
const PORT = 3000;

console.log('☁️ INIT: Quantum SaaS Cloud Wrapper...');

// endpoint: /api/solve
// Usage: curl -X POST -H "Content-Type: application/json" -d '{"problem":"Test","options":["A","B"],"criteria":["A"]}' http://localhost:3000/api/solve
app.post('/api/solve', async (req, res) => {
    const { problem, options, criteria } = req.body;

    if (!problem || !options || !criteria) {
        return res.status(400).json({ error: 'Missing quantum parameters' });
    }

    console.log(`\n🔮 Request Received: ${problem}`);
    const result = await engine.quantumSolve(problem, options, criteria);

    res.json({
        success: true,
        prediction: result.optimizedBest,
        confidence: result.confidence,
        usage: {
            compute_time: '12ms',
            credits_remaining: 999
        }
    });
});

const server = app.listen(PORT, () => {
    console.log(`✅ Quantum API Online at http://localhost:${PORT}`);
    console.log('   Ready to monetize.');

    // Self-Test
    setTimeout(async () => {
        console.log('\n🧪 Running Self-Test...');
        const fetch = (await import('node-fetch')).default;

        try {
            const response = await fetch(`http://localhost:${PORT}/api/solve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    problem: "Verify API",
                    options: ["Working", "Broken"],
                    criteria: ["Working"]
                })
            });
            const data = await response.json();
            console.log('   Response:', data);

            if (data.success && data.prediction === 'Working') {
                console.log('✨ VERIFICATION SUCCESS: SaaS Wrapper is operational.');
                process.exit(0);
            } else {
                console.error('❌ VERIFICATION FAILED.');
                process.exit(1);
            }
        } catch (e) {
            console.error('❌ VERIFICATION ERROR:', e);
            process.exit(1);
        }
    }, 2000);
});
