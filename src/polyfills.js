import { Buffer } from 'buffer';

// Polyfill Buffer for Web3/Crypto libraries
if (typeof window !== 'undefined') {
    window.Buffer = Buffer;
}

if (typeof global !== 'undefined') {
    global.Buffer = Buffer;
}

export { Buffer };
