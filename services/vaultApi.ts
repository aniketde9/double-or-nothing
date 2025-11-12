import axios from 'axios';
import { Vault } from '@/types';

const BACKEND_URL = process.env.VITE_BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || '/api';

const apiClient = axios.create({
  baseURL: BACKEND_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Function to set auth token for API requests
export const setAuthToken = (token: string | null) => {
  if (token) {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common['Authorization'];
  }
};

export const vaultApi = {
  getVaults: async (): Promise<Vault[]> => {
    const response = await apiClient.get('/vaults');
    // Handle paginated response
    return response.data.vaults || response.data || [];
  },

  getVault: async (id: string): Promise<Vault> => {
    const response = await apiClient.get(`/vaults/${id}`);
    return response.data;
  },

  createVault: async (vaultData: {
    vault_pubkey?: string;
    token_mint: string;
    amount: number;
    unlock_timestamp: number;
    unlock_type: 'TimeOnly' | 'PriceDouble';
    initial_price?: number;
  }): Promise<{ vault_id: string; transaction: any }> => {
    const response = await apiClient.post('/vaults', vaultData);
    return response.data;
  },

  getUnlockStatus: async (id: string): Promise<{ is_unlocked: boolean; unlock_reason?: string }> => {
    const response = await apiClient.get(`/vaults/${id}/unlock-status`);
    return response.data;
  },

  getPriceHistory: async (id: string): Promise<Array<{ price: number; recorded_at: string }>> => {
    const response = await apiClient.get(`/vaults/${id}/price-history`);
    return response.data;
  },
};

