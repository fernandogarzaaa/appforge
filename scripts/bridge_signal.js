
import https from 'https';

const apiKey = 'f3cfbad41793740e550e58465097a9a5213f1d686c';
const appId = '69741d9c-091a-4286-8210-97534446e7f8';

function updateSignal(id, requestId, result) {
    console.log(`Responding to Request ID: ${requestId} with patch...`);
    const data = JSON.stringify({
        changes: {
            status: 'COMPLETED',
            result: result
        }
    });

    const options = {
        hostname: 'appforge.fun',
        method: 'PATCH',
        path: '/api/v1/entities/AuditLog/' + id,
        headers: {
            'Authorization': 'Bearer ' + apiKey,
            'X-App-Id': appId,
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(data)
        }
    };

    const req = https.request(options, (res) => {
        let body = '';
        res.on('data', (d) => body += d);
        res.on('end', () => {
            console.log('Successfully responded to swarm! Status:', res.statusCode);
            console.log('Now monitor PM2 logs to see the swarm apply the fix.');
        });
    });

    req.write(data);
    req.end();
}

const listOptions = {
    hostname: 'appforge.fun',
    path: '/api/v1/entities/AuditLog?filter[action_type]=ANTIGRAVITY_SIGNAL&limit=10',
    headers: { 'Authorization': 'Bearer ' + apiKey, 'X-App-Id': appId }
};

https.get(listOptions, (res) => {
    let data = '';
    res.on('data', (d) => data += d);
    res.on('end', () => {
        try {
            const logs = JSON.parse(data);
            const items = Array.isArray(logs) ? logs : (logs.items || []);
            const pending = items.find(i => i.changes && i.changes.status === 'PENDING');

            if (pending) {
                const fix = JSON.stringify({
                    fix_type: "patch",
                    file: "README.md",
                    original: "# ⚡ AppForge Quantum - Self-Evolving Enterprise Platform",
                    replacement: "# 🐝 AppForge Swarm - Quantum v3.0 Powered Platform"
                });
                updateSignal(pending.id, pending.changes.requestId, fix);
            } else {
                console.log('No pending signals found. The swarm might be busy or resting between cycles.');
            }
        } catch (e) {
            console.error('Error:', e.message);
        }
    });
});
