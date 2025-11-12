import express from 'express';
import { authenticateToken, AuthRequest } from '../authMiddleware';
import { getOrCreateUser } from '../database';

const router = express.Router();

/**
 * POST /api/auth/verify
 * Verify Privy JWT token
 * Returns user information if token is valid
 */
router.post('/verify', authenticateToken, async (req: AuthRequest, res) => {
  try {
    // Token is already verified by authenticateToken middleware
    // User info is in req.user
    res.json({
      success: true,
      user: req.user,
    });
  } catch (error: any) {
    console.error('Error verifying token:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify token',
    });
  }
});

/**
 * GET /api/auth/user
 * Get authenticated user profile
 */
router.get('/user', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    // Get or create user in database
    const user = await getOrCreateUser({
      privy_did: req.user.id,
      solana_pubkey: req.user.wallet?.address || '',
      email: req.user.email?.address || req.user.google?.email || undefined,
    });

    res.json({
      success: true,
      user: {
        id: user.id,
        privy_did: user.privy_did,
        wallet_address: user.solana_pubkey,
        email: user.email,
        created_at: user.created_at,
      },
    });
  } catch (error: any) {
    console.error('Error getting user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user profile',
    });
  }
});

export default router;

