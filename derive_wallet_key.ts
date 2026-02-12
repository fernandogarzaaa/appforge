/**
 * Derive Solana wallet key from mnemonic
 */

import { Keypair } from '@solana/web3.js';
import { derivePath } from 'ed25519-hd-key';
import { mnemonicToSeedSync } from 'bip39';
import bs58 from 'bs58';

const mnemonic = (process.env.SOLANA_MNEMONIC || '').trim();
const printSecret = ['1', 'true', 'yes'].includes((process.env.PRINT_SECRET || '').trim().toLowerCase());

if (!mnemonic) {
  console.error('Missing SOLANA_MNEMONIC.');
  console.error('Set it in your shell environment (do not commit it to git).');
  process.exit(1);
}

const seed = mnemonicToSeedSync(mnemonic);
const derived = derivePath("m/44'/501'/0'/0'", seed.toString('hex'));
const keypair = Keypair.fromSeed(derived.key);

console.log('=== SOLANA WALLET KEY DERIVED ===');
console.log('Address:', keypair.publicKey.toBase58());
if (printSecret) {
  console.log('Private Key (base58, 64 bytes secretKey):', bs58.encode(keypair.secretKey));
  console.log('Full Secret (base64):', Buffer.from(keypair.secretKey).toString('base64'));
} else {
  console.log('Secret output disabled. Set PRINT_SECRET=true to print private material.');
}
console.log('================================');
