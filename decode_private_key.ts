/**
 * Decode the existing SOLANA_PRIVATE_KEY from .env.local
 */

import bs58 from 'bs58';
import { Keypair } from '@solana/web3.js';

// The private key from .env.local (base64 encoded)
const privateKeyBase64 = 'jg5F3hCj+VXayOijWXQ/GcywgpXqc0DIfO6j6JW7Exw9dv/I/+JkyJxzoBFXzeLAYScUgSZr0BdzU/OMcClpug==';

try {
  const privateKeyBytes = Buffer.from(privateKeyBase64, 'base64');
  console.log('Private key bytes length:', privateKeyBytes.length);
  
  // Try creating keypair from the bytes
  const keypair = Keypair.fromSecretKey(privateKeyBytes);
  console.log('Derived Address:', keypair.publicKey.toBase58());
  console.log('Expected Address: 58w7ZDRttAroqhmE8TnV2YWpwSkNHCfXdfUVAxh11LX3');
} catch (e) {
  console.error('Error:', e.message);
}
