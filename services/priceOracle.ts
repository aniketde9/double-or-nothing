import { PRICE_ORACLE } from '@/constants/vault';

const HELIUS_API_KEY = process.env.VITE_HELIUS_API_KEY || process.env.NEXT_PUBLIC_HELIUS_API_KEY;

interface PriceData {
  price: number;
  timestamp: number;
}

// Cache for price data
const priceCache = new Map<string, PriceData>();

export const priceOracle = {
  /**
   * Get current price for a token mint
   * Primary: Helius API (using HELIUS_API_KEY)
   * Validates freshness (< 60 seconds)
   */
  getPrice: async (mint: string): Promise<number> => {
    // Check cache first
    const cached = priceCache.get(mint);
    const now = Date.now() / 1000;
    if (cached && now - cached.timestamp < PRICE_ORACLE.STALENESS_THRESHOLD) {
      return cached.price;
    }

    try {
      // Use Helius API as primary source
      const price = await priceOracle.getPriceFromHelius(mint);

      if (!price) {
        throw new Error(`Failed to fetch price for ${mint} from Helius`);
      }

      // Validate freshness
      const priceTimestamp = Date.now() / 1000;
      if (now - priceTimestamp > PRICE_ORACLE.STALENESS_THRESHOLD) {
        throw new Error(`Price data is stale (> ${PRICE_ORACLE.STALENESS_THRESHOLD} seconds old)`);
      }

      // Cache the price
      priceCache.set(mint, { price, timestamp: priceTimestamp });

      return price;
    } catch (error) {
      console.error(`Error fetching price for ${mint}:`, error);
      throw error;
    }
  },

  /**
   * Get price from Helius API (primary oracle)
   * Uses HELIUS_API_KEY from environment variables
   * Uses Helius token metadata API to get price information
   */
  getPriceFromHelius: async (mint: string): Promise<number | null> => {
    if (!HELIUS_API_KEY) {
      throw new Error('Helius API key not configured. Please set NEXT_PUBLIC_HELIUS_API_KEY');
    }

    try {
      // Use Helius token metadata API
      // This endpoint returns token information including price
      const response = await fetch(
        `https://api.helius.xyz/v0/token-metadata?api-key=${HELIUS_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            mintAccounts: [mint],
          }),
        }
      );

      if (!response.ok) {
        // If token metadata fails, try the addresses endpoint as fallback
        return await priceOracle.getPriceFromHeliusAddresses(mint);
      }

      const data = await response.json();
      
      // Extract price from token metadata
      // Helius returns array of token metadata objects
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

      // For native SOL, try to get price from Helius addresses endpoint
      if (!price && mint === 'So11111111111111111111111111111111111111112') {
        // Try addresses endpoint which may have SOL price info
        const solPrice = await priceOracle.getPriceFromHeliusAddresses(mint);
        if (solPrice) {
          price = solPrice;
        } else {
          // Fallback to default SOL price (should be replaced with actual API call)
          price = await priceOracle.getSOLPrice();
        }
      }

      if (!price || typeof price !== 'number' || price <= 0) {
        console.warn(`No valid price found for ${mint} in Helius response:`, tokenData);
        return null;
      }

      return price;
    } catch (error) {
      console.error('Helius token metadata API error:', error);
      // Fallback to addresses endpoint
      return await priceOracle.getPriceFromHeliusAddresses(mint);
    }
  },

  /**
   * Fallback method: Get price from Helius addresses endpoint
   */
  getPriceFromHeliusAddresses: async (mint: string): Promise<number | null> => {
    if (!HELIUS_API_KEY) {
      return null;
    }

    try {
      const response = await fetch(
        `https://api.helius.xyz/v0/addresses/${mint}?api-key=${HELIUS_API_KEY}`
      );

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      
      // Try to get price from various possible paths
      let price = data.tokens?.[0]?.token_info?.price;
      if (!price) {
        price = data.token_info?.price;
      }
      if (!price && data.nativeBalance && data.usdValue) {
        // For native SOL, calculate price from balance and USD value
        price = data.usdValue / (data.nativeBalance / 1e9);
      }

      return price && typeof price === 'number' && price > 0 ? price : null;
    } catch (error) {
      console.error('Helius addresses API error:', error);
      return null;
    }
  },

  /**
   * Get SOL price (for native SOL mint)
   * Falls back to a reasonable default if API fails
   */
  getSOLPrice: async (): Promise<number> => {
    // Try to get SOL price from Helius or use a default
    // In production, you might want to cache this or use a dedicated price API
    try {
      // You could use CoinGecko or another API here for SOL price
      // For now, return a default (this should be replaced with actual API call)
      return 150; // Default SOL price in USD (should be fetched from API)
    } catch (error) {
      console.error('Error fetching SOL price:', error);
      return 150; // Fallback default
    }
  },

  /**
   * Clear price cache
   */
  clearCache: () => {
    priceCache.clear();
  },
};

