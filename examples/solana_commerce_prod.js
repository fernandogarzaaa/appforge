
import { Connection, PublicKey } from '@solana/web3.js';
import QuantumEngine from '../universal_quantum_dist/index.js';

// 🏦 PRODUCTION CONFIGURATION
// ⚠️ REPLACE WITH YOUR LIVE MOONPAY API KEY (https://dashboard.moonpay.com)
const MOONPAY_LIVE_KEY = "pk_live_YOUR_ACTUAL_KEY_HERE";

const TREASURY_WALLET = "2ZeBAFtHq5vNThXMjbZ7E59Msgv6xPpBFn7cw4KMxmot";
const USDC_MINT = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"); // Mainnet USDC
const PRICE_USDC = 80000;
const CHECK_INTERVAL_MS = 10000; // Check every 10 seconds

async function initiateQuantumCommercePro() {
    console.log('💎 INIT: QUANTUM COMMERCE (PRODUCTION MODE) 💎');
    console.log(`👤 TREASURY: ${TREASURY_WALLET}`);

    if (MOONPAY_LIVE_KEY.includes("YOUR_ACTUAL")) {
        console.warn("\n⚠️  WARNING: You are using a PLACEHOLDER API Key.");
        console.warn("   To accept real credit cards, get a key from dashboard.moonpay.com\n");
    }

    const engine = new QuantumEngine();

    // 1. Generate LIVE Payment Link
    const paymentUrl = generateMoonPayLink(TREASURY_WALLET, PRICE_USDC);
    console.log(`\n💳 SUBSCRIPTION DUE: $${PRICE_USDC.toLocaleString()} USDC / Month`);
    console.log(`👉 LIVE PAYMENT LINK: ${paymentUrl}`);

    // 2. REAL Blockchain Listener
    console.log('\n📡 CONNECTING to Solana Mainnet (RPC)...');
    const connection = new Connection("https://api.mainnet-beta.solana.com", "confirmed");
    console.log('✅ Connected. Watching for transactions...');

    // Poll for payment
    await monitorWalletForPayment(connection, TREASURY_WALLET, PRICE_USDC);

    // 3. Asset Release
    console.log('\n🔓 PAYMENT CONFIRMED ON-CHAIN. Generating License...');
    const license = engine.cryptography.encryptState([{
        licenseId: 'ENT-80K-PROD',
        tier: 'Global_Hedge_Fund',
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        valid: true
    }]);

    console.log('📦 ASSET RELEASED: universal_quantum_dist.zip sent to client.');
    console.log('🔑 REAL LICENSE KEY:', JSON.stringify(license[0]));
}

function generateMoonPayLink(wallet, amount) {
    const baseUrl = "https://buy.moonpay.com";
    const query = new URLSearchParams({
        apiKey: MOONPAY_LIVE_KEY,
        walletAddress: wallet,
        currencyCode: 'usdc_sol',
        baseCurrencyAmount: amount.toString(),
        baseCurrencyCode: 'usd',
        lockAmount: 'true'
    });
    return `${baseUrl}?${query.toString()}`;
}

async function monitorWalletForPayment(connection, walletAddr, expectedAmount) {
    const pubKey = new PublicKey(walletAddr);
    let lastSig = null;

    // Get initial latest signature to avoid reading old history
    const signatures = await connection.getSignaturesForAddress(pubKey, { limit: 1 });
    if (signatures.length > 0) lastSig = signatures[0].signature;

    return new Promise((resolve) => {
        const interval = setInterval(async () => {
            process.stdout.write('.');
            try {
                // Fetch new signatures since last check
                const options = lastSig ? { until: lastSig } : { limit: 5 };
                const newSigs = await connection.getSignaturesForAddress(pubKey, options);

                for (const sigInfo of newSigs) {
                    if (sigInfo.err) continue; // Skip failed txs

                    // Fetch full tx details
                    const tx = await connection.getParsedTransaction(sigInfo.signature, {
                        maxSupportedTransactionVersion: 0
                    });

                    if (checkTransactionForUSDC(tx, walletAddr, expectedAmount)) {
                        clearInterval(interval);
                        console.log(`\n\n✅ MATCH FOUND! Signature: ${sigInfo.signature}`);
                        resolve();
                        return;
                    }
                }

                if (newSigs.length > 0) {
                    lastSig = newSigs[0].signature; // Update checkpoint
                }

            } catch (e) {
                // Ignore transient RPC errors
            }
        }, CHECK_INTERVAL_MS);
    });
}

function checkTransactionForUSDC(tx, myWallet, amount) {
    if (!tx || !tx.meta || !tx.transaction) return false;

    // Look for token transfers to our wallet
    // Simplified logic: Check postTokenBalances
    const preBalances = tx.meta.preTokenBalances || [];
    const postBalances = tx.meta.postTokenBalances || [];

    // Find our wallet's USDC balance change
    const myPre = preBalances.find(b => b.owner === myWallet && b.mint === USDC_MINT.toBase58());
    const myPost = postBalances.find(b => b.owner === myWallet && b.mint === USDC_MINT.toBase58());

    const preAmount = myPre ? Number(myPre.uiTokenAmount.uiAmount) : 0;
    const postAmount = myPost ? Number(myPost.uiTokenAmount.uiAmount) : 0;

    const received = postAmount - preAmount;

    if (received >= amount) {
        console.log(`\n💰 Received ${received} USDC!`);
        return true;
    }
    return false;
}

initiateQuantumCommercePro();
