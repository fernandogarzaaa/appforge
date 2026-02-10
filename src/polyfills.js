import * as buffer from 'buffer';
window.Buffer = window.Buffer || buffer;

// Polyfill Buffer for Web3/Crypto libraries
if (global && typeof global.window === 'object') {
    window.Buffer = window.Buffer || Buffer;
    window.global = window.global || window;
}
