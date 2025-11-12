import express from 'express';
import { priceOracle } from '../services/priceOracle';

const router = express.Router();

/**
 * GET /api/prices/:mint
 * Get current token price (proxy to Helius)
 */
router.get('/:mint', async (req, res) => {
  try {
    const mint = req.params.mint;

    if (!mint) {
      return res.status(400).json({ error: 'Token mint address is required' });
    }

    const price = await priceOracle.getPrice(mint);

    res.json({
      mint,
      price,
      timestamp: Date.now(),
    });
  } catch (error: any) {
    console.error('Error fetching price:', error);
    res.status(500).json({
      error: 'Failed to fetch token price',
      message: error.message,
    });
  }
});

export default router;

