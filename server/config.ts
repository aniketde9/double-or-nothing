/**
 * Environment variable validation for backend
 * Validates required environment variables on server startup
 */

const requiredEnvVars = [
  'DATABASE_URL',
  'HELIUS_API_KEY',
  'PRIVY_APP_ID',
  'PRIVY_APP_SECRET',
] as const;

const optionalEnvVars = [
  'HELIUS_WEBHOOK_SECRET',
  'PORT',
  'NODE_ENV',
  'FRONTEND_URL',
] as const;

interface ServerConfig {
  DATABASE_URL: string;
  HELIUS_API_KEY: string;
  HELIUS_WEBHOOK_SECRET: string | null;
  PRIVY_APP_ID: string;
  PRIVY_APP_SECRET: string;
  PORT: number;
  NODE_ENV: string;
  FRONTEND_URL: string;
}

/**
 * Validate and get environment variables
 */
export function getServerConfig(): ServerConfig {
  const missing: string[] = [];

  // Check required variables
  for (const varName of requiredEnvVars) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please check your .env file and ensure all required variables are set.'
    );
  }

  return {
    DATABASE_URL: process.env.DATABASE_URL!,
    HELIUS_API_KEY: process.env.HELIUS_API_KEY!,
    HELIUS_WEBHOOK_SECRET: process.env.HELIUS_WEBHOOK_SECRET || null,
    PRIVY_APP_ID: process.env.PRIVY_APP_ID!,
    PRIVY_APP_SECRET: process.env.PRIVY_APP_SECRET!,
    PORT: parseInt(process.env.PORT || '3001', 10),
    NODE_ENV: process.env.NODE_ENV || 'development',
    FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  };
}

/**
 * Validate environment variables (call this on server startup)
 */
export function validateServerConfig(): void {
  try {
    const config = getServerConfig();
    console.log('✅ Server configuration validated');
    console.log(`   Environment: ${config.NODE_ENV}`);
    console.log(`   Port: ${config.PORT}`);
    console.log(`   Frontend URL: ${config.FRONTEND_URL}`);
    return config;
  } catch (error) {
    console.error('❌ Server configuration validation failed:', error);
    throw error;
  }
}

// Auto-validate on import (only in Node.js environment)
if (typeof require !== 'undefined') {
  try {
    validateServerConfig();
  } catch (error) {
    // Don't throw in development if we're just checking
    if (process.env.NODE_ENV === 'production') {
      throw error;
    }
  }
}

