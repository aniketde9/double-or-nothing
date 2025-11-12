'use client';

import { useVaults } from '@/hooks/useVaults';
import { useTokenPrices } from '@/hooks/useTokenPrices';
import Header from '@/components/Header';
import Spinner from '@/components/Spinner';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

export default function VaultsPage() {
  const { data: vaults = [], isLoading } = useVaults();
  const tokenMints = vaults.map((v) => v.token_mint);
  const { data: prices = {} } = useTokenPrices(tokenMints);

  return (
    <div className="min-h-screen">
      <Header />
      <main className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
        <div className="space-y-8 animate-fade-in">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-white">All Vaults</h1>
            <Link
              href="/vaults/create"
              className="bg-gradient-to-r from-sky-500 to-cyan-400 hover:from-sky-600 hover:to-cyan-500 text-white font-bold py-2 px-4 rounded-lg transition-all duration-300 ease-in-out"
            >
              Create Vault
            </Link>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Spinner />
            </div>
          ) : vaults.length === 0 ? (
            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-12 text-center">
              <p className="text-slate-400 mb-4">You don't have any vaults yet.</p>
              <Link
                href="/vaults/create"
                className="inline-block bg-gradient-to-r from-sky-500 to-cyan-400 hover:from-sky-600 hover:to-cyan-500 text-white font-bold py-2 px-6 rounded-lg transition-all duration-300 ease-in-out"
              >
                Create Your First Vault
              </Link>
            </div>
          ) : (
            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="text-xs text-slate-400 uppercase bg-slate-900/50">
                    <tr>
                      <th scope="col" className="px-6 py-3">Token</th>
                      <th scope="col" className="px-6 py-3 text-right">Amount</th>
                      <th scope="col" className="px-6 py-3 text-right">Initial Price</th>
                      <th scope="col" className="px-6 py-3 text-right">Current Price</th>
                      <th scope="col" className="px-6 py-3 text-right">Progress</th>
                      <th scope="col" className="px-6 py-3 text-right">Status</th>
                      <th scope="col" className="px-6 py-3 text-right">Unlock</th>
                      <th scope="col" className="px-6 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vaults.map((vault) => {
                      const currentPrice = prices[vault.token_mint] || vault.current_price;
                      const progress = (currentPrice / vault.initial_price) * 100;
                      const isUnlocked = vault.is_unlocked;

                      return (
                        <tr
                          key={vault.id}
                          className="border-t border-slate-700 hover:bg-slate-800 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-bold text-white">{vault.token_symbol}</p>
                              <p className="text-xs text-slate-400">{vault.unlock_type}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <p className="font-medium text-white">
                              {vault.amount.toLocaleString(undefined, { maximumFractionDigits: 4 })}{' '}
                              {vault.token_symbol}
                            </p>
                          </td>
                          <td className="px-6 py-4 text-right text-slate-300">
                            ${vault.initial_price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                          </td>
                          <td className="px-6 py-4 text-right text-white">
                            ${currentPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <div className="w-24 bg-slate-700 rounded-full h-2">
                                <div
                                  className="bg-sky-500 h-2 rounded-full transition-all"
                                  style={{ width: `${Math.min(progress, 200)}%` }}
                                />
                              </div>
                              <span className="text-xs text-slate-400">{progress.toFixed(1)}%</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${
                                isUnlocked
                                  ? 'bg-green-500/20 text-green-400'
                                  : 'bg-yellow-500/20 text-yellow-400'
                              }`}
                            >
                              {isUnlocked ? 'Unlocked' : 'Locked'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right text-sm text-slate-400">
                            {isUnlocked
                              ? vault.unlock_reason || 'Unlocked'
                              : formatDistanceToNow(new Date(vault.unlock_timestamp), { addSuffix: true })}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Link
                              href={`/vaults/${vault.id}`}
                              className="text-sky-400 hover:text-sky-300 text-sm font-medium"
                            >
                              View Details
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

