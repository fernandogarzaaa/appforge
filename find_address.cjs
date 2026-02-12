const { Keypair } = require('@solana/web3.js');
const { mnemonicToSeedSync } = require('bip39');
const hdkey = require('hdkey');

const mnemonic = 'resist paper social learn chimney globe traffic possible mansion grocery test picnic';
const seed = mnemonicToSeedSync(mnemonic);
const hd = hdkey.fromMasterSeed(seed);

const targetAddress = '2ZeBAFtHq5vNThXMjbZ7E59Msgv6xPpBFn7cw4KMxmot';

console.log('Searching for address:', targetAddress);
console.log('');

// Try different derivation paths
const paths = [
    "m/44'/501'/0'/0'",      // Standard Solana
    "m/44'/501'/0'/0'",      // Alternative
    "m/501'/0'/0'/0'",       // No coin type
    "m/44'/60'/0'/0'",       // Ethereum
    "m/0'/0'/0'",             // Simple
    "m/0'/0'/0'",             // Simple 2
];

let found = false;
for (const path of paths) {
    try {
        const derived = hd.derive(path);
        const keypair = Keypair.fromSeed(derived.privateKey);
       {