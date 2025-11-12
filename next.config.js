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
};

module.exports = nextConfig;

