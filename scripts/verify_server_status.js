
import fetch from 'node-fetch';

async function verify() {
    console.log("🔮 Pinging Quantum Commerce Server...");
    try {
        const res = await fetch('http://localhost:3000/api/claim', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'test@example.com', signature: 'test_sig' })
        });

        // We expect 400 because signature is invalid, but 404 or ECONNREFUSED means server is down.
        if (res.status === 400 || res.status === 200) {
            console.log("✅ Quantum Server Online & Responding.");
            console.log(`   Status: ${res.status}`);
            // console.log(await res.json());
        } else {
            console.error(`❌ Server returned unexpected status: ${res.status}`);
            process.exit(1);
        }
    } catch (e) {
        console.error("❌ Connection Failed. Server is likely not running.");
        console.error(e.message);
        process.exit(1);
    }
}

verify();
