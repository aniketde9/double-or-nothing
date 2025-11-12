import { useQuery } from '@tanstack/react-query';
import { priceOracle } from '@/services/priceOracle';

export function useTokenPrice(mint: string) {
  return useQuery<number>({
    queryKey: ['tokenPrice', mint],
    queryFn: () => priceOracle.getPrice(mint),
    enabled: !!mint,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
  });
}

export function useTokenPrices(mints: string[]) {
  return useQuery<Record<string, number>>({
    queryKey: ['tokenPrices', mints.sort().join(',')],
    queryFn: async () => {
      const prices: Record<string, number> = {};
      await Promise.all(
        mints.map(async (mint) => {
          try {
            prices[mint] = await priceOracle.getPrice(mint);
          } catch (error) {
            console.error(`Failed to fetch price for ${mint}:`, error);
          }
        })
      );
      return prices;
    },
    enabled: mints.length > 0,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });
}

