const { Keypair } = require('@solana/web3.js');
const { mnemonicToSeedSync } = require('bip39');
const hdkey = require('hdkey');
const fs = require('fs');

const mnemonic = 'resist paper social learn chimney globe traffic possible mansion grocery test picnic';

// Derive keypair from mnemonic using standard Solana derivation path
const seed = mnemonicToSeedSync(mnemonic);
const hd = hdkey.fromMasterSeed(seed);
const derived = hd.derive("m/44'/501'/0'/0'");
const keypair = Keypair.fromSeed(derived.privateKey);

const publicKey = keypair.publicKey.toString();
const privateKey = Buffer.from(keypair.secretKey).toString('base64');

console.log('=== SOLANA WALLET DERIVED ===');
console.log('Public Key:', publicKey);
console.log('Private Key (Base64):', privateKey);

// Verify this matches the user's address
const expectedAddress = '2ZeBAFtHq5vNThXMjbZ7E59Msgv6xPpBFn7cw4KMxmot';
if (publicKey === expectedAddress) {
    console.log('✓ Address matches expected: ' + expectedAddress);
} else {
    console.log('✗ Address mismatch!');
    console.log('Expected:', expectedAddress);
    console.log('Got:', publicKey);
}

// Update finance_wallet.json
const walletConfig = {
    "publicKey": publicKey,
    "privateKey": privateKey,
    "createdAt": new Date().toISOString(),
    "source": "mnemonic_derivation"
};

fs.writeFileSync('swarm/data/finance_wallet.json', JSON.stringify(walletConfig, null, 2));
console.log('✓ Updated swarm/data/finance_wallet.json');

// Update .env.local
let envContent = '';
try {
    envContent = fs.readFileSync('.env.local', 'utf8');
} catch (e) {
    envContent = '';
}

const envKey = 'SOLANA_WALLET_ADDRESS=' + publicKey;

if (envContent.includes('SOLANA_WALLET_ADDRESS=')) {
    envContent = envContent.replace(/SOLANA_WALLET_ADDRESS=.*$/m, envKey);
} else {
    envContent += '\n' + envKey;
}

fs.writeFileSync('.env.local', envContent);
console.log('✓ Updated .env.local');

console.log('\n=== SUMMARY ===');
console.log('Wallet: ' + publicKey);
console.log('The swarm can now sign transactions for this wallet!');
