import { Transaction, PublicKey, SystemProgram } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress, createTransferInstruction } from '@solana/spl-token';
import { connection } from './anchor';

/**
 * Build transaction for vault operations
 * Handles both native SOL and SPL token transfers
 */
export async function buildVaultTransaction(params: {
  from: PublicKey;
  to: PublicKey;
  mint: PublicKey;
  amount: number;
  decimals: number;
  isNative: boolean;
}): Promise<Transaction> {
  const { from, to, mint, amount, decimals, isNative } = params;
  const transaction = new Transaction();

  if (isNative) {
    // Native SOL transfer
    transaction.add(
      SystemProgram.transfer({
        fromPubkey: from,
        toPubkey: to,
        lamports: amount * Math.pow(10, decimals),
      })
    );
  } else {
    // SPL Token transfer
    const fromATA = await getAssociatedTokenAddress(mint, from);
    const toATA = await getAssociatedTokenAddress(mint, to);

    transaction.add(
      createTransferInstruction(
        fromATA,
        toATA,
        from,
        BigInt(amount * Math.pow(10, decimals)),
        [],
        TOKEN_PROGRAM_ID
      )
    );
  }

  // Get recent blockhash
  const { blockhash } = await connection.getLatestBlockhash('finalized');
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = from;

  return transaction;
}

/**
 * Add price oracle data to transaction (for Pyth Network)
 * This would include oracle price feed accounts
 */
export function addPriceOracleData(transaction: Transaction, priceFeedAddress: PublicKey): Transaction {
  // In a real implementation, this would add Pyth price feed accounts
  // For now, this is a placeholder
  return transaction;
}

