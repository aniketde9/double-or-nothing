'use client';

import { PrivyProvider } from '@privy-io/react-auth';
import { createSolanaRpc, createSolanaRpcSubscriptions } from '@solana/kit';
import { ReactNode } from 'react';

const privyAppId = process.env.VITE_PRIVY_APP_ID || process.env.NEXT_PUBLIC_PRIVY_APP_ID as string;
const heliusApiKey = process.env.VITE_HELIUS_API_KEY || process.env.NEXT_PUBLIC_HELIUS_API_KEY || '';

if (!privyAppId) {
  throw new Error('VITE_PRIVY_APP_ID or NEXT_PUBLIC_PRIVY_APP_ID is not set in environment variables');
}

// Fallback to public devnet RPC if Helius API key is not provided
const rpcUrl = heliusApiKey
  ? `https://devnet.helius-rpc.com/?api-key=${heliusApiKey}`
  : 'https://api.devnet.solana.com';

const rpcSubscriptionsUrl = heliusApiKey
  ? `wss://devnet.helius-rpc.com/?api-key=${heliusApiKey}`
  : 'wss://api.devnet.solana.com';

export function PrivyProviderWrapper({ children }: { children: ReactNode }) {
  return (
    <PrivyProvider
      appId={privyAppId}
      config={{
        appearance: {
          theme: 'dark',
          accentColor: '#676FFF',
        },
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
        },
        loginMethods: ['email', 'google', 'discord'],
        solanaClusters: [
          {
            name: 'devnet',
            rpcUrl: rpcUrl,
          },
        ],
        solana: {
          rpcs: {
            'solana:devnet': {
              rpc: createSolanaRpc(rpcUrl),
              rpcSubscriptions: createSolanaRpcSubscriptions(rpcSubscriptionsUrl),
            },
          },
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
}

