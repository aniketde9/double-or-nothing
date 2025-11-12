/**
 * Environment variable validation for frontend
 * Validates required environment variables on app startup
 */

const requiredEnvVars = [
  'VITE_PRIVY_APP_ID',
  'VITE_HELIUS_API_KEY',
] as const;

const optionalEnvVars = [
  'NEXT_PUBLIC_PROGRAM_ID',
  'NEXT_PUBLIC_BACKEND_URL',
  'NEXT_PUBLIC_HELIUS_RPC_URL',
] as const;

interface EnvConfig {
  PRIVY_APP_ID: string;
  HELIUS_API_KEY: string;
  HELIUS_RPC_URL: string;
  PROGRAM_ID: string | null;
  BACKEND_URL: string;
}

/**
 * Validate and get environment variables
 */
export function getEnvConfig(): EnvConfig {
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
      'Please check your .env.local file and ensure all required variables are set.'
    );
  }

  return {
    PRIVY_APP_ID: process.env.VITE_PRIVY_APP_ID || process.env.NEXT_PUBLIC_PRIVY_APP_ID!,
    HELIUS_API_KEY: process.env.VITE_HELIUS_API_KEY || process.env.NEXT_PUBLIC_HELIUS_API_KEY!,
    HELIUS_RPC_URL: process.env.VITE_HELIUS_RPC_URL || process.env.NEXT_PUBLIC_HELIUS_RPC_URL || 
      `https://devnet.helius-rpc.com/?api-key=${process.env.VITE_HELIUS_API_KEY || process.env.NEXT_PUBLIC_HELIUS_API_KEY}`,
    PROGRAM_ID: process.env.VITE_PROGRAM_ID || process.env.NEXT_PUBLIC_PROGRAM_ID || null,
    BACKEND_URL: process.env.VITE_BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || '/api',
  };
}

/**
 * Validate environment variables (call this on app startup)
 */
export function validateEnv(): void {
  try {
    getEnvConfig();
    console.log('✅ Environment variables validated');
  } catch (error) {
    console.error('❌ Environment validation failed:', error);
    if (typeof window === 'undefined') {
      // Only throw in server-side context
      throw error;
    }
  }
}

// Auto-validate in development
if (process.env.NODE_ENV === 'development' && typeof window === 'undefined') {
  validateEnv();
}

