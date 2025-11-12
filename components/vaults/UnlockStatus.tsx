'use client';

import { Vault } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { calculatePriceProgress, hasPriceDoubled } from '@/lib/vaultHelpers';

interface UnlockStatusProps {
  vault: Vault;
  currentPrice?: number;
}

export function UnlockStatus({ vault, currentPrice }: UnlockStatusProps) {
  const price = currentPrice || vault.current_price;
  const progress = calculatePriceProgress(vault.initial_price, price);
  const priceDoubled = hasPriceDoubled(vault.initial_price, price);
  const isUnlocked = vault.is_unlocked;

  return (
    <div className="space-y-4">
      <div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-slate-400">Unlock Type</span>
          <span className="text-white font-medium">{vault.unlock_type}</span>
        </div>
      </div>

      {vault.unlock_type === 'PriceDouble' && (
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-slate-400">Price Progress</span>
            <span className="text-white font-medium">{progress.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                priceDoubled ? 'bg-green-500' : 'bg-sky-500'
              }`}
              style={{ width: `${Math.min(progress, 200)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-slate-500 mt-1">
            <span>0%</span>
            <span>100% (1x)</span>
            <span className={priceDoubled ? 'text-green-400 font-medium' : ''}>
              200% (2x Target) {priceDoubled && '✓'}
            </span>
          </div>
          {priceDoubled && !isUnlocked && (
            <p className="text-sm text-green-400 mt-2">Price has doubled! Vault is eligible for unlock.</p>
          )}
        </div>
      )}

      {!isUnlocked && (
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm text-slate-400">Time Remaining</span>
            <span className="text-white font-medium">
              {formatDistanceToNow(new Date(vault.unlock_timestamp), { addSuffix: true })}
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Unlocks on: {new Date(vault.unlock_timestamp).toLocaleString()}
          </p>
        </div>
      )}

      {isUnlocked && vault.unlock_reason && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
          <p className="text-sm text-green-400 font-medium">Unlocked</p>
          <p className="text-xs text-green-300 mt-1">{vault.unlock_reason}</p>
          {vault.unlocked_at && (
            <p className="text-xs text-slate-400 mt-1">
              Unlocked at: {new Date(vault.unlocked_at).toLocaleString()}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

