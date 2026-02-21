const { Keypair } = require('@solana/web3.js');
const { mnemonicToSeedSync } = require('bip39');
const { derivePath } = require('ed25519-hd-key');

const mnemonic = (process.env.SOLANA_MNEMONIC || '').trim();
const targetAddress = (process.env.TARGET_ADDRESS || process.argv[2] || '').trim();

if (!mnemonic || !targetAddress) {
    console.error('Missing SOLANA_MNEMONIC or TARGET_ADDRESS.');
    console.error('Usage: SOLANA_MNEMONIC="..." node find_phantom_address.cjs <TARGET_ADDRESS>');
    process.exit(1);
}

const seed = mnemonicToSeedSync(mnemonic).toString('hex');

console.log('Searching for:', targetAddress);
console.log('');

// Many derivation paths to try
const paths = [
    // Standard Solana
    { path: "m/44'/501'/0'/0'", name: 'Solana Standard' },
    { path: "m/44'/501'/0'/0'", name: 'Solana Standard 2' },

    // Different account indices
    { path: "m/44'/501'/0'/0'", name: 'Account 0' },
    { path: "m/44'/501'/1'/0'", name: 'Account 1' },
    { path: "m/44'/501'/2'/0'", name: 'Account 2' },
    { path: "m/44'/501'/0'/1'", name: 'Change 1' },
    { path: "m/44'/501'/1'/1'", name: 'Account 1, Change 1' },

    // Without hardened
    { path: "m/44'/501'/0'/0'", name: 'Hardened' },

    // Alternative paths
    { path: "m/44'/501'/0'/0'", name: 'Alt 1' },
    { path: "m/44'/60'/0'/0'/0'", name: 'Ethereum' },
    { path: "m/44'/60'/0'/0'", name: 'Ethereum Simple' },
    { path: "m/0'/0'/0'/0'", name: 'Simple BIP32' },
    { path: "m/0'/0'/0'", name: 'Simple BIP32 No Change' },

    // Phantom specific
    { path: "m/44'/501'/0'/0'", name: 'Phantom' },
];

let found = false;
for (const { path, name } of paths) {
    try {
        const derived = derivePath(path, seed);
        const keypair = Keypair.fromSeed(derived.key);
        const addr = keypair.publicKey.toString();
        const match = addr === targetAddress ? ' <-- MATCH!!!' : '';
        console.log(`${name.padEnd(15)}: ${addr}${match}`);
        if (addr === targetAddress) found = true;
    } catch (e) {
        console.log(`${name.padEnd(15)}: ERROR - ${e.message}`);
    }
}

console.log('');
if (found) {
    console.log('✅ FOUND THE ADDRESS!');
} else {
    console.log('❌ Address not found with any common derivation path.');
    console.log('');
    console.log('The seed phrase may:');
    console.log('1. Use a different word order');
    console.log('2. Have a typo in one word');
    console.log('3. Be from a different wallet app with different derivation');
    console.log('4. Have passphrase protection (not supported)');
}
