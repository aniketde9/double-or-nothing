import { useQuery } from '@tanstack/react-query';
import { useVaultStore } from '@/store/vaultStore';
import { vaultApi } from '@/services/vaultApi';
import { Vault } from '@/types';

export function useVaults() {
  const { setVaults, setLoading, setError } = useVaultStore();

  const query = useQuery<Vault[]>({
    queryKey: ['vaults'],
    queryFn: async () => {
      setLoading(true);
      try {
        const vaults = await vaultApi.getVaults();
        setVaults(vaults);
        return vaults;
      } catch (error: any) {
        setError(error.message || 'Failed to fetch vaults');
        throw error;
      } finally {
        setLoading(false);
      }
    },
  });

  return query;
}

