// Polyfills for Solana/web3.js in Next.js
import { Buffer } from 'buffer';
import process from 'process';

// Make Buffer and process available globally
if (typeof globalThis.Buffer === 'undefined') {
  globalThis.Buffer = Buffer;
}
if (typeof globalThis.process === 'undefined') {
  globalThis.process = process;
}
// Also set on window for browser compatibility
if (typeof window !== 'undefined') {
  (window as any).Buffer = Buffer;
  (window as any).process = process;
}

