/**
 * Derive Solana wallet key from mnemonic
 */

import { Keypair } from '@solana/web3.js';
import { derivePath } from 'ed25519-hd-key';
import { mnemonicToSeedSync } from 'bip39';
import bs58 from 'bs58';

const mnemonic = 'resist paper social learn chimney globe traffic possible';
const seed = mnemonicToSeedSync(mnemonic);
const derived = derivePath("m/44'/501'/0'/0'", seed.toString('hex'));
const keypair = Keypair.fromSeed(derived.key);

console.log('=== SOLANA WALLET KEY DERIVED ===');
console.log('Address:', keypair.publicKey.toBase58());
console.log('Private Key (base58):', bs58.encode(keypair.secretKey.slice(0, 32)));
console.log('Full Secret (base64):', Buffer.from(keypair.secretKey).toString('base64'));
console.log('================================');
