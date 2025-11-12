'use client';

import { Vault } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

interface VaultCardProps {
  vault: Vault;
  currentPrice?: number;
}

export function VaultCard({ vault, currentPrice }: VaultCardProps) {
  const price = currentPrice || vault.current_price;
  const progress = (price / vault.initial_price) * 100;

  return (
    <Link href={`/vaults/${vault.id}`}>
      <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 shadow-lg hover:border-sky-500/50 transition-colors cursor-pointer">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-bold text-white">{vault.token_symbol}</h3>
            <p className="text-sm text-slate-400">{vault.unlock_type}</p>
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

        <div className="space-y-3">
          <div>
            <p className="text-sm text-slate-400">Amount Locked</p>
            <p className="text-lg font-bold text-white">
              {vault.amount.toLocaleString(undefined, { maximumFractionDigits: 4 })} {vault.token_symbol}
            </p>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-slate-400">Price Progress</span>
              <span className="text-white">{progress.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2">
              <div
                className="bg-sky-500 h-2 rounded-full transition-all"
                style={{ width: `${Math.min(progress, 200)}%` }}
              />
            </div>
          </div>

          {!vault.is_unlocked && (
            <div>
              <p className="text-sm text-slate-400">Unlocks in</p>
              <p className="text-white font-medium">
                {formatDistanceToNow(new Date(vault.unlock_timestamp), { addSuffix: true })}
              </p>
            </div>
          )}

          {vault.is_unlocked && vault.unlock_reason && (
            <div>
              <p className="text-sm text-slate-400">Unlocked Reason</p>
              <p className="text-white font-medium">{vault.unlock_reason}</p>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

