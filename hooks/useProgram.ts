import { useState, useEffect } from 'react';
import { Program } from '@coral-xyz/anchor';
import { useWallets } from '@privy-io/react-auth/solana';
import { getProgramWithWallet, createWalletAdapter } from '@/lib/program';
import { createWalletAdapter as createAdapter } from '@/lib/anchor';

/**
 * Hook to get Anchor program instance
 * Returns the program when wallet is ready
 */
export function useProgram() {
  const { wallets, ready } = useWallets();
  const [program, setProgram] = useState<Program | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const loadProgram = async () => {
      if (!ready || wallets.length === 0) {
        setIsLoading(true);
        return;
      }

      try {
        const solanaWallet = wallets.find((w) => {
          const isSolanaAddress = w.address && !w.address.startsWith('0x');
          return isSolanaAddress;
        });

        if (!solanaWallet) {
          setError(new Error('No Solana wallet found'));
          setIsLoading(false);
          return;
        }

        // Create wallet adapter
        const walletAdapter = createAdapter(solanaWallet);
        
        // Load program
        const programInstance = await getProgramWithWallet(walletAdapter);
        setProgram(programInstance);
        setError(null);
      } catch (err: any) {
        console.error('Error loading program:', err);
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };

    loadProgram();
  }, [wallets, ready]);

  return { program, isLoading, error };
}

