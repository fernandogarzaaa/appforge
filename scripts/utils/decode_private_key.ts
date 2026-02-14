/**
 * Decode a Solana secret key (base64) and print the derived public address.
 *
 * SECURITY:
 * - Do not hardcode private keys in this repo.
 * - Provide the key via SOLANA_PRIVATE_KEY_BASE64 in your shell environment.
 */

import { Keypair } from '@solana/web3.js';

const privateKeyBase64 = (process.env.SOLANA_PRIVATE_KEY_BASE64 || '').trim();
const expectedAddress = (process.env.EXPECTED_ADDRESS || '').trim();

if (!privateKeyBase64) {
  console.error('Missing SOLANA_PRIVATE_KEY_BASE64.');
  process.exit(1);
}

try {
  const privateKeyBytes = Buffer.from(privateKeyBase64, 'base64');
  console.log('Secret key bytes length:', privateKeyBytes.length);

  const keypair = Keypair.fromSecretKey(privateKeyBytes);
  const derived = keypair.publicKey.toBase58();
  console.log('Derived Address:', derived);
  if (expectedAddress) {
    console.log('Expected Address:', expectedAddress);
    console.log(derived === expectedAddress ? '✓ MATCH' : '✗ MISMATCH');
  }
} catch (e: any) {
  console.error('Error:', e?.message || e);
  process.exit(1);
}

