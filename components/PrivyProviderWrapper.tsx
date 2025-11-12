'use client';

import { PrivyProvider } from '@privy-io/react-auth';
import { createSolanaRpc, createSolanaRpcSubscriptions } from '@solana/kit';
import { ReactNode } from 'react';

const privyAppId = process.env.NEXT_PUBLIC_PRIVY_APP_ID as string;
const heliusApiKey = process.env.NEXT_PUBLIC_HELIUS_API_KEY || '';

if (!privyAppId) {
  throw new Error('NEXT_PUBLIC_PRIVY_APP_ID is not set in environment variables');
}

// Fallback to public mainnet RPC if Helius API key is not provided
const rpcUrl = heliusApiKey
  ? `https://mainnet.helius-rpc.com/?api-key=${heliusApiKey}`
  : 'https://api.mainnet-beta.solana.com';

const rpcSubscriptionsUrl = heliusApiKey
  ? `wss://mainnet.helius-rpc.com/?api-key=${heliusApiKey}`
  : 'wss://api.mainnet-beta.solana.com';

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
            name: 'mainnet-beta',
            rpcUrl: rpcUrl,
          },
        ],
        solana: {
          rpcs: {
            'solana:mainnet': {
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

