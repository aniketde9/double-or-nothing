import express from 'express';
import { Connection, PublicKey } from '@solana/web3.js';
import {
  getVaultByPubkey,
  updateVaultUnlockStatus,
  logTransaction,
  getOrCreateUser,
} from '../database';
import { priceOracle } from '../services/priceOracle';

const router = express.Router();

// Helius webhook secret for verification
const HELIUS_WEBHOOK_SECRET = process.env.HELIUS_WEBHOOK_SECRET;
const HELIUS_API_KEY = process.env.HELIUS_API_KEY;

// Initialize Solana connection
const connection = new Connection(
  HELIUS_API_KEY
    ? `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`
    : 'https://api.mainnet-beta.solana.com'
);

/**
 * POST /api/webhook/helius-event
 * Handle Helius webhook events for transaction monitoring
 */
router.post('/helius-event', async (req, res) => {
  try {
    // Verify webhook secret if configured
    if (HELIUS_WEBHOOK_SECRET) {
      const signature = req.headers['x-helius-signature'];
      if (signature !== HELIUS_WEBHOOK_SECRET) {
        return res.status(401).json({ error: 'Invalid webhook signature' });
      }
    }

    const event = req.body;

    // Handle different event types
    if (event.type === 'TRANSACTION') {
      await handleTransactionEvent(event);
    } else if (event.type === 'ACCOUNT_UPDATE') {
      await handleAccountUpdateEvent(event);
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Failed to process webhook' });
  }
});

/**
 * Handle transaction events from Helius
 */
async function handleTransactionEvent(event: any) {
  const { signature, accountData } = event;

  // Look for vault-related transactions
  // This would need to be customized based on your program's transaction structure
  for (const account of accountData || []) {
    if (account.account) {
      // Check if this is a vault account
      const vaultPubkey = account.account;
      const vault = await getVaultByPubkey(vaultPubkey);

      if (vault) {
        // Log the transaction
        await logTransaction({
          vault_id: vault.id,
          tx_signature: signature,
          action: 'VAULT_UPDATE',
          status: 'SUCCESS',
        });

        // Update vault state if needed
        // You would parse the transaction to determine what happened
        // For now, we'll just check unlock conditions
        await checkAndUpdateUnlockStatus(vault);
      }
    }
  }
}

/**
 * Handle account update events from Helius
 */
async function handleAccountUpdateEvent(event: any) {
  const { account } = event;

  if (account) {
    const vault = await getVaultByPubkey(account);
    if (vault) {
      await checkAndUpdateUnlockStatus(vault);
    }
  }
}

/**
 * Check unlock conditions and update vault status
 */
async function checkAndUpdateUnlockStatus(vault: any) {
  try {
    const now = new Date();
    const unlockDate = new Date(vault.unlock_timestamp);
    const isTimeUnlocked = now >= unlockDate;

    let isPriceDoubled = false;
    let currentPrice: number | null = null;
    
    if (vault.unlock_type === 'PriceDouble') {
      try {
        currentPrice = await priceOracle.getPrice(vault.token_mint);
        if (currentPrice) {
          // Update price in database
          await updateVaultPrice(vault.id, currentPrice);
          isPriceDoubled = currentPrice >= vault.initial_price * 2;
        }
      } catch (error) {
        console.error('Error checking price for unlock:', error);
      }
    }

    const isUnlocked = isTimeUnlocked || isPriceDoubled;

    if (isUnlocked && !vault.is_unlocked) {
      let reason = '';
      if (isPriceDoubled) {
        reason = 'Price doubled';
      } else if (isTimeUnlocked) {
        reason = 'Time expired';
      }

      await updateVaultUnlockStatus(vault.id, true, reason);
    }
  } catch (error) {
    console.error('Error checking unlock status:', error);
  }
}

export default router;

