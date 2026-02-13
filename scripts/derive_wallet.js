import fs from 'fs';
import * as bip39 from 'bip39';
import { derivePath } from 'ed25519-hd-key';
import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';

const mnemonic = "mass drum anchor guilt dance thank icon escape daughter dad interest birth";
const seed = await bip39.mnemonicToSeed(mnemonic);
const seedHex = seed.toString('hex');

const derivationPath = "m/44'/501'/0'/0'";
const derivedKey = derivePath(derivationPath, seedHex);
const keypair = Keypair.fromSeed(derivedKey.key);

const results = {
    address: keypair.publicKey.toBase58(),
    privateKeyBase58: bs58.encode(keypair.secretKey),
    privateKeyArray: Array.from(keypair.secretKey)
};

fs.writeFileSync('scripts/derivation_results.json', JSON.stringify(results, null, 2));
console.log('Results saved to scripts/derivation_results.json');
