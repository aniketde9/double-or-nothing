'use client';

import { use } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useVault } from '@/hooks/useVault';
import { useTokenPrice } from '@/hooks/useTokenPrices';
import { usePriceHistory } from '@/hooks/usePriceHistory';
import { usePrivy, useWallets, useSignAndSendTransaction } from '@privy-io/react-auth';
import { PriceDisplay } from '@/components/vaults/PriceDisplay';
import { UnlockStatus } from '@/components/vaults/UnlockStatus';
import Header from '@/components/Header';
import Spinner from '@/components/Spinner';
import { formatDistanceToNow, format } from 'date-fns';
import toast from 'react-hot-toast';

export default function VaultDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { id } = resolvedParams;
  const { data: vault, isLoading } = useVault(id);
  const { data: currentPrice } = useTokenPrice(vault?.token_mint || '');
  const { data: priceHistory, isLoading: isLoadingHistory } = usePriceHistory(vault?.id);
  const { authenticated } = usePrivy();
  const { wallets } = useWallets();
  const { signAndSendTransaction } = useSignAndSendTransaction();

  const price = currentPrice || vault?.current_price || 0;
  const initialPrice = vault?.initial_price || 0;

  const handleWithdraw = async () => {
    if (!vault || !vault.is_unlocked) {
      toast.error('Vault is not unlocked yet');
      return;
    }

    if (!authenticated) {
      toast.error('Please log in to withdraw');
      return;
    }

    try {
      const solanaWallet = wallets.find((w) => {
        const isSolanaAddress = w.address && !w.address.startsWith('0x');
        return isSolanaAddress;
      });

      if (!solanaWallet) {
        throw new Error('No Solana wallet found');
      }

      // TODO: Once Anchor program is deployed, uncomment and implement:
      // const { createWalletAdapter } = await import('@/lib/anchor');
      // const { getProgramWithWallet } = await import('@/lib/program');
      // 
      // const walletAdapter = createWalletAdapter(solanaWallet);
      // const program = await getProgramWithWallet(walletAdapter);
      // 
      // const vaultPubkey = new PublicKey(vault.vault_pubkey);
      // const signature = await withdrawFromVault(vaultPubkey, walletAdapter, program);
      // 
      // toast.success(`Withdrawal successful! Transaction: ${signature}`);
      // router.push('/vaults');

      toast.success('Withdrawal initiated. This will be implemented with smart contract integration.');
    } catch (error: any) {
      console.error('Error withdrawing:', error);
      toast.error(error.message || 'Failed to withdraw funds');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
          <div className="flex justify-center items-center h-64">
            <Spinner />
          </div>
        </main>
      </div>
    );
  }

  if (!vault) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-4">Vault Not Found</h1>
            <button
              onClick={() => router.push('/vaults')}
              className="text-sky-400 hover:text-sky-300"
            >
              Back to Vaults
            </button>
          </div>
        </main>
      </div>
    );
  }

  const timeRemaining = formatDistanceToNow(new Date(vault.unlock_timestamp), { addSuffix: true });

  return (
    <div className="min-h-screen">
      <Header />
      <main className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
        <div className="space-y-8 animate-fade-in">
          <div>
            <button
              onClick={() => router.back()}
              className="text-sky-400 hover:text-sky-300 mb-4 flex items-center gap-2"
            >
              ← Back
            </button>
            <h1 className="text-3xl font-bold text-white mb-2">Vault Details</h1>
            <p className="text-slate-400">View and manage your vault</p>
          </div>

          {/* Status Card */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 shadow-lg">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-bold text-white">{vault.token_symbol} Vault</h2>
                <p className="text-sm text-slate-400">Vault ID: {vault.id.slice(0, 8)}...</p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  vault.is_unlocked
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-yellow-500/20 text-yellow-400'
                }`}
              >
                {vault.is_unlocked ? 'Unlocked' : 'Locked'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6">
              <div>
                <p className="text-sm text-slate-400">Amount Locked</p>
                <p className="text-2xl font-bold text-white">
                  {vault.amount.toLocaleString(undefined, { maximumFractionDigits: 4 })} {vault.token_symbol}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Value</p>
                <p className="text-2xl font-bold text-white">
                  ${(vault.amount * price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>

          {/* Price Progress */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 shadow-lg">
            <h3 className="text-lg font-bold text-white mb-4">Price Progress</h3>
            <PriceDisplay initialPrice={initialPrice} currentPrice={price} tokenSymbol={vault.token_symbol} />
          </div>

          {/* Unlock Information */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 shadow-lg">
            <h3 className="text-lg font-bold text-white mb-4">Unlock Information</h3>
            <UnlockStatus vault={vault} currentPrice={price} />
            <div className="mt-4 pt-4 border-t border-slate-700">
              <p className="text-sm text-slate-400">Locked At</p>
              <p className="text-white font-medium">{format(new Date(vault.locked_at), 'PPP p')}</p>
            </div>
          </div>

          {/* Withdraw Button */}
          {vault.is_unlocked && authenticated && (
            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 shadow-lg">
              <h3 className="text-lg font-bold text-white mb-4">Withdraw Funds</h3>
              <p className="text-slate-400 mb-4">
                Your vault is unlocked. You can now withdraw your funds.
              </p>
              <button
                onClick={handleWithdraw}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300"
              >
                Withdraw {vault.amount.toFixed(4)} {vault.token_symbol}
              </button>
            </div>
          )}

          {/* Price History */}
          {priceHistory && priceHistory.length > 0 && (
            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 shadow-lg">
              <h3 className="text-lg font-bold text-white mb-4">Price History</h3>
              {isLoadingHistory ? (
                <div className="flex justify-center py-4">
                  <Spinner />
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {priceHistory.slice(0, 20).map((entry, index) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b border-slate-700/50 last:border-0">
                      <span className="text-sm text-slate-400">
                        {format(new Date(entry.recorded_at), 'MMM dd, yyyy HH:mm')}
                      </span>
                      <span className="text-white font-medium">
                        ${entry.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                      </span>
                    </div>
                  ))}
                  {priceHistory.length > 20 && (
                    <p className="text-xs text-slate-500 text-center pt-2">
                      Showing last 20 of {priceHistory.length} records
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Vault Info */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 shadow-lg">
            <h3 className="text-lg font-bold text-white mb-4">Vault Information</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Vault Address</span>
                <span className="text-white font-mono">{vault.vault_pubkey.slice(0, 8)}...</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Token Mint</span>
                <span className="text-white font-mono">{vault.token_mint.slice(0, 8)}...</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Created</span>
                <span className="text-white">{format(new Date(vault.created_at), 'PPP')}</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

