import axios from 'axios';

const HELIUS_API_KEY = process.env.HELIUS_API_KEY;

interface PriceData {
  price: number;
  timestamp: number;
}

// Cache for price data
const priceCache = new Map<string, PriceData>();
const CACHE_DURATION = 60; // 60 seconds

export const priceOracle = {
  /**
   * Get current price for a token mint
   * Uses Helius API as primary source
   */
  getPrice: async (mint: string): Promise<number> => {
    // Check cache first
    const cached = priceCache.get(mint);
    const now = Date.now() / 1000;
    if (cached && now - cached.timestamp < CACHE_DURATION) {
      return cached.price;
    }

    try {
      // Use Helius token metadata API
      const response = await axios.post(
        `https://api.helius.xyz/v0/token-metadata?api-key=${HELIUS_API_KEY}`,
        {
          mintAccounts: [mint],
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const data = response.data;
      const tokenData = Array.isArray(data) ? data[0] : data;

      // Try different possible price fields
      let price = tokenData?.token_info?.price;
      if (!price) {
        price = tokenData?.price;
      }
      if (!price && tokenData?.usd_value && tokenData?.supply) {
        // Calculate price from USD value and supply
        price = tokenData.usd_value / (tokenData.supply / Math.pow(10, tokenData.decimals || 9));
      }

      // For native SOL, try addresses endpoint
      if (!price && mint === 'So11111111111111111111111111111111111111112') {
        try {
          const solResponse = await axios.get(
            `https://api.helius.xyz/v0/addresses/${mint}?api-key=${HELIUS_API_KEY}`
          );
          const solData = solResponse.data;
          if (solData.nativeBalance && solData.usdValue) {
            price = solData.usdValue / (solData.nativeBalance / 1e9);
          }
        } catch (error) {
          console.error('Error fetching SOL price:', error);
        }
      }

      if (!price || typeof price !== 'number' || price <= 0) {
        throw new Error(`No valid price found for ${mint}`);
      }

      // Cache the price
      priceCache.set(mint, { price, timestamp: now });

      return price;
    } catch (error: any) {
      console.error(`Error fetching price for ${mint}:`, error);
      throw error;
    }
  },

  /**
   * Clear price cache
   */
  clearCache: () => {
    priceCache.clear();
  },
};

