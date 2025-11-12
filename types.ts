import { PublicKey } from '@solana/web3.js';

export interface User {
  privy_did: string;
  wallet_address: string;
  email: string;
}

export interface Token {
  mint: string; // Token mint address
  symbol: string;
  name: string;
  decimals: number;
  isNative?: boolean;
}

export interface TokenBalance extends Token {
  balance: number;
  usdValue?: number;
  logoURI?: string;
}

export type UnlockType = 'TimeOnly' | 'PriceDouble';

export interface Vault {
  id: string;
  vault_pubkey: string;
  user_id: string;
  token_mint: string;
  token_symbol: string;
  amount: number;
  initial_price: number;
  current_price: number;
  locked_at: string;
  unlock_timestamp: string;
  unlock_type: UnlockType;
  is_unlocked: boolean;
  unlock_reason?: string;
  unlocked_at?: string;
  created_at: string;
}

export interface VaultState {
  owner: PublicKey;
  deposited_mint: PublicKey;
  deposited_amount: number;
  initial_price: number;
  locked_at_timestamp: number;
  unlock_timestamp: number;
  unlock_type: UnlockType;
  is_unlocked: boolean;
  vault_bump: number;
  token_account_bump: number;
  confirmations_count: number;
}
