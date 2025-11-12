'use client';

interface PriceDisplayProps {
  initialPrice: number;
  currentPrice: number;
  tokenSymbol: string;
}

export function PriceDisplay({ initialPrice, currentPrice, tokenSymbol }: PriceDisplayProps) {
  const progress = (currentPrice / initialPrice) * 100;
  const targetProgress = 200; // 2x target
  const priceChange = currentPrice - initialPrice;
  const priceChangePercent = ((currentPrice - initialPrice) / initialPrice) * 100;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm text-slate-400">Initial Price</p>
          <p className="text-lg font-bold text-white">
            ${initialPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-slate-400">Current Price</p>
          <p className="text-lg font-bold text-white">
            ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-slate-400">Progress to 2x Target</span>
          <span className="text-white font-medium">{progress.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-3">
          <div
            className="bg-sky-500 h-3 rounded-full transition-all relative"
            style={{ width: `${Math.min(progress, targetProgress)}%` }}
          >
            {progress >= targetProgress && (
              <div className="absolute right-0 top-0 w-2 h-3 bg-green-400 rounded-r-full" />
            )}
          </div>
        </div>
        <div className="flex justify-between text-xs text-slate-400">
          <span>0%</span>
          <span>100% (1x)</span>
          <span>200% (2x Target)</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-400">Price Change:</span>
        <span
          className={`text-sm font-medium ${
            priceChange >= 0 ? 'text-green-400' : 'text-red-400'
          }`}
        >
          {priceChange >= 0 ? '+' : ''}
          {priceChangePercent.toFixed(2)}% ({priceChange >= 0 ? '+' : ''}
          ${Math.abs(priceChange).toFixed(2)})
        </span>
      </div>
    </div>
  );
}

