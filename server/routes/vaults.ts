import express from 'express';
import { authenticateToken, AuthRequest } from '../authMiddleware';
import {
  getOrCreateUser,
  getUserVaults,
  getVaultById,
  getVaultByPubkey,
  createVault,
  updateVaultPrice,
  updateVaultUnlockStatus,
  addPriceHistory,
  getPriceHistory,
  logTransaction,
} from '../database';
import { priceOracle } from '../services/priceOracle';

const router = express.Router();

/**
 * GET /api/vaults
 * List user's vaults (paginated)
 */
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get or create user
    const user = await getOrCreateUser({
      privy_did: req.user.id,
      solana_pubkey: req.user.wallet?.address || '',
      email: req.user.email?.address || req.user.google?.email || undefined,
    });

    // Get pagination params
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    // Get vaults
    const vaults = await getUserVaults(user.id);

    // Update current prices for all vaults
    const vaultsWithPrices = await Promise.all(
      vaults.map(async (vault) => {
        try {
          const currentPrice = await priceOracle.getPrice(vault.token_mint);
          if (currentPrice && currentPrice !== vault.current_price) {
            await updateVaultPrice(vault.id, currentPrice);
            vault.current_price = currentPrice;
          }

          // Check unlock status
          const now = new Date();
          const unlockDate = new Date(vault.unlock_timestamp);
          const isTimeUnlocked = now >= unlockDate;
          const isPriceDoubled = vault.unlock_type === 'PriceDouble' && 
            currentPrice && currentPrice >= vault.initial_price * 2;
          const isUnlocked = vault.is_unlocked || isTimeUnlocked || isPriceDoubled;

          if (isUnlocked && !vault.is_unlocked) {
            let reason = '';
            if (isPriceDoubled) {
              reason = 'Price doubled';
            } else if (isTimeUnlocked) {
              reason = 'Time expired';
            }
            await updateVaultUnlockStatus(vault.id, true, reason);
            vault.is_unlocked = true;
            vault.unlock_reason = reason;
            vault.unlocked_at = new Date();
          }

          return vault;
        } catch (error) {
          console.error(`Error updating price for vault ${vault.id}:`, error);
          return vault;
        }
      })
    );

    // Apply pagination
    const paginatedVaults = vaultsWithPrices.slice(offset, offset + limit);

    res.json({
      vaults: paginatedVaults,
      pagination: {
        page,
        limit,
        total: vaults.length,
        totalPages: Math.ceil(vaults.length / limit),
      },
    });
  } catch (error: any) {
    console.error('Error getting vaults:', error);
    res.status(500).json({ error: 'Failed to fetch vaults' });
  }
});

/**
 * GET /api/vaults/:id
 * Get vault details with current price
 */
router.get('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const vaultId = req.params.id;
    const vault = await getVaultById(vaultId);

    if (!vault) {
      return res.status(404).json({ error: 'Vault not found' });
    }

    // Get or create user to verify ownership
    const user = await getOrCreateUser({
      privy_did: req.user.id,
      solana_pubkey: req.user.wallet?.address || '',
      email: req.user.email?.address || req.user.google?.email || undefined,
    });

    if (vault.user_id !== user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Update current price
    try {
      const currentPrice = await priceOracle.getPrice(vault.token_mint);
      if (currentPrice && currentPrice !== vault.current_price) {
        await updateVaultPrice(vault.id, currentPrice);
        vault.current_price = currentPrice;
        await addPriceHistory(vault.id, currentPrice);
      }
    } catch (error) {
      console.error(`Error updating price for vault ${vaultId}:`, error);
    }

    // Check unlock status
    const now = new Date();
    const unlockDate = new Date(vault.unlock_timestamp);
    const isTimeUnlocked = now >= unlockDate;
    const isPriceDoubled = vault.unlock_type === 'PriceDouble' && 
      vault.current_price && vault.current_price >= vault.initial_price * 2;
    const isUnlocked = vault.is_unlocked || isTimeUnlocked || isPriceDoubled;

    if (isUnlocked && !vault.is_unlocked) {
      let reason = '';
      if (isPriceDoubled) {
        reason = 'Price doubled';
      } else if (isTimeUnlocked) {
        reason = 'Time expired';
      }
      await updateVaultUnlockStatus(vault.id, true, reason);
      vault.is_unlocked = true;
      vault.unlock_reason = reason;
      vault.unlocked_at = new Date();
    }

    res.json(vault);
  } catch (error: any) {
    console.error('Error getting vault:', error);
    res.status(500).json({ error: 'Failed to fetch vault' });
  }
});

/**
 * POST /api/vaults
 * Create vault record (after on-chain creation)
 */
router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const {
      vault_pubkey,
      token_mint,
      amount,
      unlock_timestamp,
      unlock_type,
      initial_price,
    } = req.body;

    // Validate required fields
    if (!vault_pubkey || !token_mint || !amount || !unlock_timestamp || !unlock_type) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!['TimeOnly', 'PriceDouble'].includes(unlock_type)) {
      return res.status(400).json({ error: 'Invalid unlock_type' });
    }

    // Get or create user
    const user = await getOrCreateUser({
      privy_did: req.user.id,
      solana_pubkey: req.user.wallet?.address || '',
      email: req.user.email?.address || req.user.google?.email || undefined,
    });

    // Check if vault already exists
    const existing = await getVaultByPubkey(vault_pubkey);
    if (existing) {
      return res.status(409).json({ error: 'Vault already exists' });
    }

    // Get token symbol (you might want to fetch this from chain or a token registry)
    const tokenSymbol = req.body.token_symbol || 'UNKNOWN';

    // Get initial price if not provided
    let finalInitialPrice = initial_price;
    if (!finalInitialPrice) {
      try {
        finalInitialPrice = await priceOracle.getPrice(token_mint);
      } catch (error) {
        console.error('Error fetching initial price:', error);
        return res.status(400).json({ error: 'Failed to fetch initial price' });
      }
    }

    // Create vault
    const vault = await createVault({
      user_id: user.id,
      vault_pubkey,
      token_mint,
      token_symbol: tokenSymbol,
      amount: parseFloat(amount),
      initial_price: finalInitialPrice,
      locked_at: new Date(),
      unlock_timestamp: new Date(parseInt(unlock_timestamp) * 1000),
      unlock_type: unlock_type as 'TimeOnly' | 'PriceDouble',
    });

    // Log transaction if signature provided
    if (req.body.transaction_signature) {
      await logTransaction({
        user_id: user.id,
        tx_signature: req.body.transaction_signature,
        action: 'CREATE_VAULT',
        vault_id: vault.id,
        status: 'SUCCESS',
      });
    }

    res.status(201).json({
      vault_id: vault.id,
      vault: vault,
    });
  } catch (error: any) {
    console.error('Error creating vault:', error);
    res.status(500).json({ error: 'Failed to create vault' });
  }
});

/**
 * GET /api/vaults/:id/unlock-status
 * Check if vault is unlocked
 */
router.get('/:id/unlock-status', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const vaultId = req.params.id;
    const vault = await getVaultById(vaultId);

    if (!vault) {
      return res.status(404).json({ error: 'Vault not found' });
    }

    // Get or create user to verify ownership
    const user = await getOrCreateUser({
      privy_did: req.user.id,
      solana_pubkey: req.user.wallet?.address || '',
      email: req.user.email?.address || req.user.google?.email || undefined,
    });

    if (vault.user_id !== user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Check unlock conditions
    const now = new Date();
    const unlockDate = new Date(vault.unlock_timestamp);
    const isTimeUnlocked = now >= unlockDate;

    let isPriceDoubled = false;
    if (vault.unlock_type === 'PriceDouble') {
      try {
        const currentPrice = await priceOracle.getPrice(vault.token_mint);
        if (currentPrice) {
          await updateVaultPrice(vault.id, currentPrice);
          isPriceDoubled = currentPrice >= vault.initial_price * 2;
        }
      } catch (error) {
        console.error('Error checking price:', error);
      }
    }

    const isUnlocked = vault.is_unlocked || isTimeUnlocked || isPriceDoubled;

    let reason = '';
    if (isUnlocked && !vault.is_unlocked) {
      if (isPriceDoubled) {
        reason = 'Price doubled';
      } else if (isTimeUnlocked) {
        reason = 'Time expired';
      }
      await updateVaultUnlockStatus(vault.id, true, reason);
    }

    res.json({
      is_unlocked: isUnlocked,
      unlock_reason: reason || vault.unlock_reason,
      unlocked_at: vault.unlocked_at,
    });
  } catch (error: any) {
    console.error('Error checking unlock status:', error);
    res.status(500).json({ error: 'Failed to check unlock status' });
  }
});

/**
 * GET /api/vaults/:id/price-history
 * Get price history for vault
 */
router.get('/:id/price-history', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const vaultId = req.params.id;
    const vault = await getVaultById(vaultId);

    if (!vault) {
      return res.status(404).json({ error: 'Vault not found' });
    }

    // Get or create user to verify ownership
    const user = await getOrCreateUser({
      privy_did: req.user.id,
      solana_pubkey: req.user.wallet?.address || '',
      email: req.user.email?.address || req.user.google?.email || undefined,
    });

    if (vault.user_id !== user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const limit = parseInt(req.query.limit as string) || 100;
    const history = await getPriceHistory(vaultId, limit);

    res.json(history);
  } catch (error: any) {
    console.error('Error getting price history:', error);
    res.status(500).json({ error: 'Failed to fetch price history' });
  }
});

export default router;

