// Check real SOL balance
const https = require('https');

const WALLET = '7q4QCFxP99PbosKx4NnMJddhhoYNazpXitRDXsEpXo5S';

const data = JSON.stringify({
  jsonrpc: '2.0',
  id: 1,
  method: 'getBalance',
  params: [WALLET]
});

const options = {
  hostname: 'api.mainnet-beta.solana.com',
  port: 443,
  path: '/',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = https.request(options, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    const result = JSON.parse(body);
    const lamports = result.result?.value || 0;
    const sol = lamports / 1e9;
    console.log(`\n💰 WALLET BALANCE`);
    console.log(`━━━━━━━━━━━━━━━━━━`);
    console.log(`Address: ${WALLET}`);
    console.log(`SOL: ${sol.toFixed(4)}`);
    console.log(`USD (~165/SOL): $${(sol * 165).toFixed(2)}\n`);
  });
});

req.on('error', (e) => console.error('Error:', e.message));
req.write(data);
req.end();
