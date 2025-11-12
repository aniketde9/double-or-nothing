import { PublicKey } from '@solana/web3.js';
import { PROGRAM_ID } from '@/constants/vault';

/**
 * Derive vault PDA (Program Derived Address)
 * This is used to generate the unique address for a vault
 */
export function deriveVaultPDA(owner: PublicKey, tokenMint: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('vault'), owner.toBuffer(), tokenMint.toBuffer()],
    PROGRAM_ID
  );
}

/**
 * Calculate unlock timestamp from timeframe in seconds
 */
export function calculateUnlockTimestamp(timeframeSeconds: number): number {
  const now = Math.floor(Date.now() / 1000);
  return now + timeframeSeconds;
}

/**
 * Validate unlock timestamp (must be at least 30 days from now)
 */
export function validateUnlockTimestamp(unlockTimestamp: number): boolean {
  const now = Math.floor(Date.now() / 1000);
  const minUnlock = now + 30 * 24 * 60 * 60; // 30 days
  return unlockTimestamp >= minUnlock;
}

/**
 * Format amount with token decimals
 */
export function formatTokenAmount(amount: number, decimals: number): string {
  return amount.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
}

/**
 * Convert amount to smallest unit (like lamports for SOL)
 */
export function toSmallestUnit(amount: number, decimals: number): number {
  return Math.round(amount * Math.pow(10, decimals));
}

/**
 * Convert from smallest unit to human-readable amount
 */
export function fromSmallestUnit(amount: number, decimals: number): number {
  return amount / Math.pow(10, decimals);
}

/**
 * Check if price has doubled (for unlock condition)
 */
export function hasPriceDoubled(initialPrice: number, currentPrice: number): boolean {
  return currentPrice >= initialPrice * 2;
}

/**
 * Calculate price progress percentage (0-200% for 2x target)
 */
export function calculatePriceProgress(initialPrice: number, currentPrice: number): number {
  if (initialPrice <= 0) return 0;
  return (currentPrice / initialPrice) * 100;
}

