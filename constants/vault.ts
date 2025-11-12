import { PublicKey } from '@solana/web3.js';

// Program ID will be set when Anchor program is deployed
// For now, use a placeholder that will be replaced
export const PROGRAM_ID = (process.env.VITE_PROGRAM_ID || process.env.NEXT_PUBLIC_PROGRAM_ID)
  ? new PublicKey(process.env.VITE_PROGRAM_ID || process.env.NEXT_PUBLIC_PROGRAM_ID!)
  : new PublicKey('11111111111111111111111111111111'); // System program as placeholder

export const TIMEFRAMES = {
  ONE_MONTH: 30 * 24 * 60 * 60,
  THREE_MONTHS: 90 * 24 * 60 * 60,
  SIX_MONTHS: 180 * 24 * 60 * 60,
  ONE_YEAR: 365 * 24 * 60 * 60,
  TWO_YEARS: 2 * 365 * 24 * 60 * 60,
  FIVE_YEARS: 5 * 365 * 24 * 60 * 60,
} as const;

export const PRICE_ORACLE = {
  PROVIDER: 'HELIUS',
  STALENESS_THRESHOLD: 60, // seconds
} as const;

export const SOL_DECIMALS = 9;
export const USDC_DECIMALS = 6;
export const MIN_VAULT_AMOUNT = 1;
export const MAX_VAULTS_PER_USER = 100;
export const MIN_UNLOCK_DURATION = 30 * 24 * 60 * 60; // 30 days in seconds

