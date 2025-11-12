import { AnchorProvider, Program, Wallet } from '@coral-xyz/anchor';
import { Connection, PublicKey, Keypair } from '@solana/web3.js';
import { PROGRAM_ID } from '@/constants/vault';

const HELIUS_RPC_URL = process.env.NEXT_PUBLIC_HELIUS_RPC_URL || 'https://api.mainnet-beta.solana.com';

export const connection = new Connection(HELIUS_RPC_URL, 'confirmed');

/**
 * Get Anchor provider with wallet
 * Note: This will be used with Privy embedded wallet
 */
export function getAnchorProvider(wallet: Wallet): AnchorProvider {
  return new AnchorProvider(connection, wallet, {
    commitment: 'confirmed',
  });
}

/**
 * Initialize Anchor program
 * Note: IDL will be loaded from the deployed program
 */
export async function getProgram(wallet: Wallet, idl: any): Promise<Program> {
  const provider = getAnchorProvider(wallet);
  return new Program(idl, PROGRAM_ID, provider);
}

/**
 * Create a wallet adapter from Privy wallet
 */
export function createWalletAdapter(privyWallet: any): Wallet {
  if (!privyWallet || !privyWallet.address) {
    throw new Error('Invalid Privy wallet provided');
  }

  return {
    publicKey: new PublicKey(privyWallet.address),
    signTransaction: async (tx: any) => {
      // Privy will handle signing via useSignAndSendTransaction hook
      // This adapter is mainly for Anchor provider initialization
      return tx;
    },
    signAllTransactions: async (txs: any[]) => {
      return txs;
    },
  };
}

