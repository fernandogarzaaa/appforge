
async function runTest() {
    console.log("🛡️ STARTING IRON GUARD VERIFICATION...");

    // Test 1: MALICIOUS PAYLOAD
    try {
        const response = await fetch('http://localhost:3002/api/oracle/verify-tx', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tx: "SGVsbG8gV29ybGQ=" })
        });
        const result = await response.json();
        console.log("\n[TEST 1] MALICIOUS TX (Simulate Attack):");
        console.log(`- Verified: ${result.verified}`);
        console.log(`- Risk Score: ${result.risk_score}`);
        console.log(`- Details: ${result.details}`);

        if (!result.verified && result.risk_score === 1.0) {
            console.log("✅ PASS: Threat Blocked Successfully.");
        } else {
            console.log("❌ FAIL: Threat was NOT blocked.");
        }

    } catch (e) {
        console.error("Test 1 Failed:", e.message);
    }

    // Test 2: SAFE PAYLOAD
    try {
        const response = await fetch('http://localhost:3002/api/oracle/verify-tx', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tx: "ValidTxSim" })
        });
        const result = await response.json();
        console.log("\n[TEST 2] SAFE TX (Simulate Safe):");
        console.log(`- Verified: ${result.verified}`);
        console.log(`- Risk Score: ${result.risk_score}`);
        console.log(`- Details: ${result.details}`);

        if (result.verified && result.risk_score === 0.0) {
            console.log("✅ PASS: Safe Tx Approved.");
        } else {
            console.log("❌ FAIL: Safe Tx was improperly blocked.");
        }

    } catch (e) {
        console.error("Test 2 Failed:", e.message);
    }
}

runTest();
