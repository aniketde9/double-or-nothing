import { create } from 'zustand';
import { Vault } from '@/types';

interface VaultStore {
  vaults: Vault[];
  selectedVaultId: string | null;
  isLoading: boolean;
  error: string | null;
  setVaults: (vaults: Vault[]) => void;
  setSelectedVault: (id: string | null) => void;
  addVault: (vault: Vault) => void;
  updateVault: (id: string, updates: Partial<Vault>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useVaultStore = create<VaultStore>((set) => ({
  vaults: [],
  selectedVaultId: null,
  isLoading: false,
  error: null,
  setVaults: (vaults) => set({ vaults }),
  setSelectedVault: (id) => set({ selectedVaultId: id }),
  addVault: (vault) =>
    set((state) => ({
      vaults: [...state.vaults, vault],
    })),
  updateVault: (id, updates) =>
    set((state) => ({
      vaults: state.vaults.map((v) => (v.id === id ? { ...v, ...updates } : v)),
    })),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
}));

