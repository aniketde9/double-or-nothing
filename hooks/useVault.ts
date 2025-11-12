import { useQuery } from '@tanstack/react-query';
import { vaultApi } from '@/services/vaultApi';
import { Vault } from '@/types';

export function useVault(id: string) {
  return useQuery<Vault>({
    queryKey: ['vault', id],
    queryFn: () => vaultApi.getVault(id),
    enabled: !!id,
  });
}

