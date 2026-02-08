import { Buffer } from 'buffer';

// Polyfill Buffer for Web3/Crypto libraries
if (typeof window !== 'undefined') {
    window.Buffer = window.Buffer || Buffer;
    window.global = window.global || window;
}
