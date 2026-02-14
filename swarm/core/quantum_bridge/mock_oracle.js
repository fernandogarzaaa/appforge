import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';

const app = express();
const PORT = 3002;

app.use(cors());
app.use(bodyParser.json());

// Whitelist Registry
const WHITELIST = {
    "11111111111111111111111111111111": "System Program",
    "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA": "Token Program",
    "675kPX9PXcDuuvPsdr7ZUfJ5vJ673GBNbCGS08v5qFj": "Raydium V4",
    "JUP6LkbZbjS1jKKccwgwsS16SjyTdfYJ837f48M8h77": "Jupiter V6"
};

app.post('/api/oracle/validate', (req, res) => {
    // Audit Code Logic (Simplified)
    console.log("🔍 Mock Oracle: Validating Code...");
    res.json({
        safe: true,
        message: "Quantum State: COHERENT (Mock Verified)",
        confidence: 0.99
    });
});

app.post('/api/oracle/verify-tx', (req, res) => {
    const { tx } = req.body;
    console.log(`🛡️ Mock Oracle: Auditing Transaction (${tx.length} chars)`);

    // Simulation Logic
    // If exact string "SGVsbG8gV29ybGQ=" (Hello World), we treat as MALICIOUS/UNKNOWN for demo
    if (tx === "SGVsbG8gV29ybGQ=") {
        console.log("⚠️ DETECTED: Unknown Protocol Interaction");
        return res.json({
            verified: false,
            risk_score: 1.0,
            details: "UNAUTHORIZED_PROGRAM: Unknown Protocol (Mock)"
        });
    }

    // Default: Assume Valid for UI testing of "Green" state
    res.json({
        verified: true,
        risk_score: 0.0,
        details: "Transaction Secured by Iron Ledger (Mock Verified)"
    });
});

app.listen(PORT, () => {
    console.log(`🛡️ Mock Oracle Listening on port ${PORT}`);
    console.log(`   (Fallback for Rust: Allowing User Verification)`);
});
