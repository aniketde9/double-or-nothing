/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    // Polyfills for Solana/web3.js
    config.resolve.fallback = {
      ...config.resolve.fallback,
      buffer: require.resolve('buffer'),
      crypto: require.resolve('crypto-browserify'),
      stream: require.resolve('stream-browserify'),
      process: require.resolve('process/browser'),
    };

    // Provide Buffer globally
    if (!isServer) {
      config.plugins.push(
        new (require('webpack')).ProvidePlugin({
          Buffer: ['buffer', 'Buffer'],
          process: 'process/browser',
        })
      );
    }

    return config;
  },
  images: {
    domains: ['raw.githubusercontent.com'],
  },
  // Expose VITE_ environment variables to client (for compatibility with existing .env)
  env: {
    VITE_PRIVY_APP_ID: process.env.VITE_PRIVY_APP_ID,
    VITE_HELIUS_API_KEY: process.env.VITE_HELIUS_API_KEY,
    VITE_HELIUS_RPC_URL: process.env.VITE_HELIUS_RPC_URL,
    VITE_PROGRAM_ID: process.env.VITE_PROGRAM_ID,
    VITE_BACKEND_URL: process.env.VITE_BACKEND_URL,
    // Also support NEXT_PUBLIC_ for standard Next.js usage
    NEXT_PUBLIC_PRIVY_APP_ID: process.env.NEXT_PUBLIC_PRIVY_APP_ID,
    NEXT_PUBLIC_HELIUS_API_KEY: process.env.NEXT_PUBLIC_HELIUS_API_KEY,
    NEXT_PUBLIC_HELIUS_RPC_URL: process.env.NEXT_PUBLIC_HELIUS_RPC_URL,
    NEXT_PUBLIC_PROGRAM_ID: process.env.NEXT_PUBLIC_PROGRAM_ID,
    NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL,
  },
};

module.exports = nextConfig;

