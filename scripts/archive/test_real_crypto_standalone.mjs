/**
 * REAL Crypto Data Fetcher - Multiple APIs
 */

const SOL_ADDRESS = 'So11111111111111111111111111111111111111112';

async function fetchBirdeyePrice(address) {
    try {
        const response = await fetch(`https://public-api.birdeye.so/public/price?address=${address}`, {
            headers: { 'x-api-key': process.env.BIRDEYE_API_KEY || '' }
        });
        if (response.ok) {
            return await response.json();
        }
    } catch (e) {
        console.log('Birdeye error:', e.message);
    }
    return null;
}

async function fetchDexScreenerPair(baseAddress) {
    try {
        const response = await fetch(`https://api.dexscreener.com/dex/pairs/solana/${baseAddress}`);
        if (response.ok) {
            return await response.json();
        }
    } catch (e) {
        console.log('DexScreener error:', e.message);
    }
    return null;
}

async function fetchRaydiumLiquidity() {
    try {
        // Raydium API for SOL/USDC pool
        const response = await fetch('https://api.raydium.io/v2/pools');
        if (response.ok) {
            return await response.json();
        }
    } catch (e) {
        console.log('Raydium error:', e.message);
    }
    return null;
}

async function main() {
    console.log('');
    console.log('🧪 REAL Crypto Data Test');
    console.log('═'.repeat(60));
    console.log('');

    // Test 1: Direct DexScreener pair for SOL
    console.log('📡 Testing DexScreener SOL Pair...');
    const solPair = await fetchDexScreenerPair(SOL_ADDRESS);
    if (solPair?.pair) {
        console.log('✅ SOL Pair Found!');
        console.log(`   Price: $${solPair.pair.priceUsd}`);
        console.log(`   24h Change: ${solPair.pair.priceChange?.h24}%`);
        console.log(`   Volume: $${solPair.pair.volume?.h24}`);
    } else {
        console.log('❌ No SOL pair data');
    }
    console.log('');

    // Test 2: BONK
    console.log('📡 Testing DexScreener BONK Pair...');
    const bonkAddress = 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263';
    const bonkPair = await fetchDexScreenerPair(bonkAddress);
    if (bonkPair?.pair) {
        console.log('✅ BONK Pair Found!');
        console.log(`   Price: $${bonkPair.pair.priceUsd}`);
        console.log(`   24h Change: ${bonkPair.pair.priceChange?.h24}%`);
        console.log(`   Liquidity: $${bonkPair.pair.liquidity?.usd}`);
    } else {
        console.log('❌ No BONK pair data');
    }
    console.log('');

    // Test 3: Jupiter tokens endpoint
    console.log('📡 Testing Jupiter Token List...');
    try {
        const jupResponse = await fetch('https://token.jup.ag/all');
        if (jupResponse.ok) {
            const tokens = await jupResponse.json();
            console.log(`✅ Found ${tokens.length} tokens from Jupiter`);
            const solToken = tokens.find(t => t.symbol === 'SOL');
            if (solToken) {
                console.log(`   SOL Address: ${solToken.address}`);
            }
        }
    } catch (e) {
        console.log('❌ Jupiter error:', e.message);
    }

    console.log('');
    console.log('═'.repeat(60));
    console.log('✅ API Tests Complete!');
}

main().catch(console.error);
