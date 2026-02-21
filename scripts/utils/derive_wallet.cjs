const { Keypair } = require('@solana/web3.js');
const { mnemonicToSeedSync } = require('bip39');
const { derivePath } = require('ed25519-hd-key');
const fs = require('fs');

// SECURITY:
// - Do not hardcode seed phrases in this repo.
// - Provide the mnemonic via SOLANA_MNEMONIC in your shell environment.
// - Secret output and file writes are opt-in flags.

const mnemonic = (process.env.SOLANA_MNEMONIC || '').trim();
const printSecret = ['1', 'true', 'yes'].includes((process.env.PRINT_SECRET || '').trim().toLowerCase());

const args = new Set(process.argv.slice(2));
const writeFinanceWallet = args.has('--write-finance-wallet');
const writeEnvLocal = args.has('--write-env-local');

if (!mnemonic) {
  console.error('Missing SOLANA_MNEMONIC.');
  console.error('Usage: SOLANA_MNEMONIC="..." node derive_wallet.cjs');
  process.exit(1);
}

// Derive keypair from mnemonic using standard Solana derivation path.
const seed = mnemonicToSeedSync(mnemonic).toString('hex');
const derived = derivePath("m/44'/501'/0'/0'", seed);
const keypair = Keypair.fromSeed(derived.key);

const publicKey = keypair.publicKey.toString();

console.log('=== SOLANA WALLET DERIVED ===');
console.log('Public Key:', publicKey);

if (printSecret) {
  const privateKeyBase64 = Buffer.from(keypair.secretKey).toString('base64');
  console.log('Private Key (Base64 secretKey):', privateKeyBase64);
} else {
  console.log('Secret output disabled. Set PRINT_SECRET=true to print private material.');
}

if (writeFinanceWallet) {
  const walletConfig = {
    publicKey,
    // Never commit this file. This value is intentionally omitted unless PRINT_SECRET=true.
    privateKey: printSecret ? Buffer.from(keypair.secretKey).toString('base64') : '',
    createdAt: new Date().toISOString(),
    source: 'mnemonic_derivation'
  };

  fs.mkdirSync('swarm/data', { recursive: true });
  fs.writeFileSync('swarm/data/finance_wallet.json', JSON.stringify(walletConfig, null, 2));
  console.log('✓ Wrote swarm/data/finance_wallet.json (DO NOT COMMIT)');
}

if (writeEnvLocal) {
  const envPath = '.env.local';
  let envContent = '';
  try {
    envContent = fs.readFileSync(envPath, 'utf8');
  } catch {
    envContent = '';
  }

  const envKey = 'SOLANA_WALLET_ADDRESS=' + publicKey;

  if (envContent.includes('SOLANA_WALLET_ADDRESS=')) {
    envContent = envContent.replace(/SOLANA_WALLET_ADDRESS=.*$/m, envKey);
  } else {
    envContent += (envContent.endsWith('\n') || envContent.length === 0 ? '' : '\n') + envKey + '\n';
  }

  fs.writeFileSync(envPath, envContent);
  console.log('✓ Updated .env.local (address only)');
}

console.log('=============================');

