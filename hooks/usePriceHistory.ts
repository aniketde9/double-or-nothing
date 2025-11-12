import { useQuery } from '@tanstack/react-query';
import { vaultApi } from '@/services/vaultApi';

export function usePriceHistory(vaultId: string | undefined) {
  return useQuery({
    queryKey: ['priceHistory', vaultId],
    queryFn: async () => {
      if (!vaultId) throw new Error('Vault ID is required');
      const history = await vaultApi.getPriceHistory(vaultId);
      return history;
    },
    enabled: !!vaultId,
    refetchInterval: 1000 * 60 * 5, // Refetch every 5 minutes
  });
}

