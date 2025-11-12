import { PublicKey, SystemProgram } from '@solana/web3.js';
import { Program, BN } from '@coral-xyz/anchor';
import { PROGRAM_ID } from '@/constants/vault';
import { UnlockType } from '@/types';

interface InitializeVaultParams {
  tokenMint: PublicKey;
  amount: number;
  unlockTimestamp: number;
  unlockType: UnlockType;
  confirmationStage: 1 | 2 | 3;
  vaultPubkey?: PublicKey; // Required for stages 2 and 3
  wallet: any; // Privy wallet
}

/**
 * Initialize vault with 3-step confirmation
 * Each stage calls the smart contract with confirmation_stage parameter
 */
export async function initializeVault(
  params: InitializeVaultParams,
  program: Program
): Promise<{ signature: string; vaultPubkey: PublicKey }> {
  const { tokenMint, amount, unlockTimestamp, unlockType, confirmationStage, vaultPubkey, wallet } = params;

  // For stage 1, derive vault PDA
  // For stages 2 and 3, use provided vaultPubkey
  let vaultPDA: PublicKey;
  let vaultBump: number;

  if (confirmationStage === 1) {
    // Derive PDA for new vault
    [vaultPDA, vaultBump] = PublicKey.findProgramAddressSync(
      [Buffer.from('vault'), wallet.publicKey.toBuffer(), tokenMint.toBuffer()],
      PROGRAM_ID
    );
  } else {
    if (!vaultPubkey) {
      throw new Error('vaultPubkey is required for confirmation stages 2 and 3');
    }
    vaultPDA = vaultPubkey;
    // In a real implementation, you'd fetch the bump from on-chain data
    vaultBump = 0; // Placeholder
  }

  try {
    const tx = await program.methods
      .initializeVault(
        confirmationStage,
        new BN(amount),
        new BN(unlockTimestamp),
        unlockType === 'PriceDouble' ? { priceDouble: {} } : { timeOnly: {} }
      )
      .accounts({
        owner: wallet.publicKey,
        vaultState: vaultPDA,
        depositedMint: tokenMint,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    return { signature: tx, vaultPubkey: vaultPDA };
  } catch (error) {
    console.error('Error initializing vault:', error);
    throw error;
  }
}

/**
 * Check unlock conditions for a vault
 */
export async function checkUnlockConditions(
  vaultPubkey: PublicKey,
  program: Program
): Promise<{ isUnlocked: boolean; reason?: string }> {
  try {
    const result = await program.methods.checkUnlockConditions().accounts({
      vaultState: vaultPubkey,
    }).view();

    return {
      isUnlocked: result.isUnlocked,
      reason: result.reason || undefined,
    };
  } catch (error) {
    console.error('Error checking unlock conditions:', error);
    throw error;
  }
}

/**
 * Withdraw funds from unlocked vault
 */
export async function withdrawFromVault(
  vaultPubkey: PublicKey,
  wallet: any,
  program: Program
): Promise<string> {
  try {
    const tx = await program.methods
      .withdraw()
      .accounts({
        owner: wallet.publicKey,
        vaultState: vaultPubkey,
      })
      .rpc();

    return tx;
  } catch (error) {
    console.error('Error withdrawing from vault:', error);
    throw error;
  }
}

