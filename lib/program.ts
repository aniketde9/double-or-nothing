import { Program, Wallet } from '@coral-xyz/anchor';
import { PROGRAM_ID } from '@/constants/vault';
import { getAnchorProvider } from './anchor';

// This will be populated when the Anchor program IDL is available
let programIdl: any = null;

/**
 * Load Anchor program IDL
 * In production, this would load from a file or fetch from chain
 * 
 * To use: Place your IDL JSON file in the project and import it:
 * import idl from '@/idl/double_or_nothing.json';
 * Then set programIdl = idl;
 */
export async function loadProgramIdl(): Promise<any> {
  if (programIdl) {
    return programIdl;
  }

  // Try loading IDL from file first
  try {
    const idl = await import('@/idl/double_or_nothing.json');
    programIdl = idl.default || idl;
    return programIdl;
  } catch (error) {
    console.warn('Failed to load IDL from file, trying to fetch from chain...', error);
    
    // Fallback: Try fetching from chain
    try {
      const { connection } = await import('./anchor');
      const idl = await Program.fetchIdl(PROGRAM_ID, connection);
      if (idl) {
        programIdl = idl;
        return idl;
      }
    } catch (chainError) {
      console.error('Failed to fetch IDL from chain:', chainError);
    }
  }

  throw new Error(
    'Program IDL not loaded. Please deploy the Anchor program and ensure the IDL file exists at idl/double_or_nothing.json'
  );
}

/**
 * Set the program IDL (call this after deploying the program)
 */
export function setProgramIdl(idl: any) {
  programIdl = idl;
}

/**
 * Get Anchor program instance with wallet
 */
export async function getProgramWithWallet(wallet: Wallet): Promise<Program> {
  const idl = await loadProgramIdl();
  const provider = getAnchorProvider(wallet);
  return new Program(idl, PROGRAM_ID, provider);
}

