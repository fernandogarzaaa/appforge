const { Keypair } = require('@solana/web3.js');
const { mnemonicToSeedSync } = require('bip39');
const hdkey = require('hdkey');

// SECURITY:
// - Do not hardcode mnemonics in this repo.
// - Provide via SOLANA_MNEMONIC env var.

const mnemonic = (process.env.SOLANA_MNEMONIC || '').trim();
const targetAddress = (process.env.TARGET_ADDRESS || process.argv[2] || '').trim();

if (!mnemonic || !targetAddress) {
  console.error('Missing SOLANA_MNEMONIC or TARGET_ADDRESS.');
  console.error('Usage: SOLANA_MNEMONIC=\"...\" node find_address.cjs <TARGET_ADDRESS>');
  process.exit(1);
}

const seed = mnemonicToSeedSync(mnemonic);
const hd = hdkey.fromMasterSeed(seed);

console.log('Searching for address:', targetAddress);
console.log('');

const paths = [
  { path: "m/44'/501'/0'/0'", name: 'Solana (0)' },
  { path: "m/44'/501'/1'/0'", name: 'Solana (1)' },
  { path: "m/44'/501'/2'/0'", name: 'Solana (2)' },
  { path: "m/44'/501'/0'/1'", name: 'Solana change 1' }
];

let found = false;
for (const { path, name } of paths) {
  try {
    const derived = hd.derive(path);
    const keypair = Keypair.fromSeed(derived.privateKey);
    const addr = keypair.publicKey.toString();
    const match = addr === targetAddress ? ' <-- MATCH' : '';
    console.log(`${name.padEnd(16)} ${path.padEnd(18)} ${addr}${match}`);
    if (addr === targetAddress) found = true;
  } catch (e) {
    console.log(`${name.padEnd(16)} ERROR: ${e.message}`);
  }
}

console.log('');
console.log(found ? '✅ FOUND' : '❌ NOT FOUND');

