'use client';

import { useAuth } from '@/context/AuthContext';
import { useVaults } from '@/hooks/useVaults';
import { usePrivy } from '@privy-io/react-auth';
import Link from 'next/link';
import Header from '@/components/Header';
import Spinner from '@/components/Spinner';
import { formatDistanceToNow } from 'date-fns';

export default function HomePage() {
  const { user, isAuthenticated } = useAuth();
  const { authenticated } = usePrivy();
  const { data: vaults = [], isLoading } = useVaults();

  // Calculate TVL (Total Value Locked)
  const tvl = vaults.reduce((sum, vault) => {
    return sum + vault.amount * vault.current_price;
  }, 0);

  if (!authenticated || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Double or Nothing</h1>
          <p className="text-slate-400 mb-8">Lock your crypto with conviction-based vaults</p>
          <p className="text-slate-500">Please log in to continue</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
        <div className="space-y-8 animate-fade-in">
          {/* TVL Card */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 shadow-lg">
            <div>
              <p className="text-slate-400 text-sm">Total Value Locked</p>
              <p className="text-4xl font-bold text-white">
                ${tvl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-4">
            <Link
              href="/vaults/create"
              className="flex-1 bg-gradient-to-r from-sky-500 to-cyan-400 hover:from-sky-600 hover:to-cyan-500 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 ease-in-out text-center shadow-lg"
            >
              Create Vault
            </Link>
            <Link
              href="/vaults"
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-6 rounded-lg transition-colors text-center"
            >
              View All Vaults
            </Link>
          </div>

          {/* Vaults List */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl shadow-lg">
            <h2 className="text-xl font-bold p-6 border-b border-slate-700">Your Vaults</h2>
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <Spinner />
              </div>
            ) : vaults.length === 0 ? (
              <div className="flex justify-center items-center h-64">
                <p className="text-center text-slate-400 px-6">
                  You don't have any vaults yet. Click "Create Vault" to get started.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="text-xs text-slate-400 uppercase">
                    <tr>
                      <th scope="col" className="px-6 py-3">Token</th>
                      <th scope="col" className="px-6 py-3 text-right">Amount</th>
                      <th scope="col" className="px-6 py-3 text-right">Status</th>
                      <th scope="col" className="px-6 py-3 text-right">Unlock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vaults.map((vault) => (
                      <tr
                        key={vault.id}
                        className="border-t border-slate-700 hover:bg-slate-800 transition-colors cursor-pointer"
                        onClick={() => (window.location.href = `/vaults/${vault.id}`)}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <div>
                              <p className="font-bold text-white">{vault.token_symbol}</p>
                              <p className="text-sm text-slate-400">
                                {vault.is_unlocked ? 'Unlocked' : 'Locked'}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <p className="font-medium text-white">
                            {vault.amount.toLocaleString(undefined, { maximumFractionDigits: 4 })}{' '}
                            {vault.token_symbol}
                          </p>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              vault.is_unlocked
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-yellow-500/20 text-yellow-400'
                            }`}
                          >
                            {vault.is_unlocked ? 'Unlocked' : 'Locked'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right text-sm text-slate-400">
                          {vault.is_unlocked
                            ? vault.unlock_reason || 'Unlocked'
                            : formatDistanceToNow(new Date(vault.unlock_timestamp), { addSuffix: true })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

