import axios from 'axios';
import { TokenBalance, Token } from '../types';

// Use environment variable for backend URL in production, fallback to /api for local dev
// If NEXT_PUBLIC_BACKEND_URL is set but doesn't end with /api, append it
let BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || '/api';
if (BACKEND_URL !== '/api' && !BACKEND_URL.endsWith('/api')) {
  BACKEND_URL = `${BACKEND_URL}/api`;
}

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

export const userService = {
  getOrCreateUser: async (userData: { 
    privy_did: string; 
    wallet_address: string; 
    email: string; 
  }) => {
    const response = await apiClient.post('/user/sync', userData);
    return response.data;
  },
};

export const heliusService = {
  getTokenBalances: async (walletAddress: string): Promise<TokenBalance[]> => {
    try {
      const response = await apiClient.get(`/wallet/balances/${walletAddress}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching token balances:', error);
      return [];
    }
  },
};

export const tokenService = {
  getSupportedTokens: async (): Promise<Token[]> => {
    const response = await apiClient.get('/tokens');
    return response.data.tokens;
  },
};

export const feeService = {
  getFeeConfig: async (): Promise<{ fee_wallet_address: string | null; fee_percentage: number }> => {
    const response = await apiClient.get('/fee-config');
    return response.data;
  },
};

