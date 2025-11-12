'use client';

import { TIMEFRAMES } from '@/constants/vault';
import { format, addSeconds } from 'date-fns';

interface TimeframeSelectorProps {
  value: number | null;
  onChange: (seconds: number) => void;
}

const timeframeOptions = [
  { label: '1 Month', value: TIMEFRAMES.ONE_MONTH },
  { label: '3 Months', value: TIMEFRAMES.THREE_MONTHS },
  { label: '6 Months', value: TIMEFRAMES.SIX_MONTHS },
  { label: '1 Year', value: TIMEFRAMES.ONE_YEAR },
  { label: '2 Years', value: TIMEFRAMES.TWO_YEARS },
  { label: '5 Years', value: TIMEFRAMES.FIVE_YEARS },
];

export function TimeframeSelector({ value, onChange }: TimeframeSelectorProps) {
  const selectedOption = timeframeOptions.find((opt) => opt.value === value);
  const unlockDate = value ? addSeconds(new Date(), value) : null;

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-slate-300 mb-2">Timeframe</label>
      <select
        value={value || ''}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition"
      >
        <option value="">Select timeframe</option>
        {timeframeOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {unlockDate && (
        <div className="bg-slate-900/30 border border-slate-700 rounded-lg p-3">
          <p className="text-sm text-slate-400">Unlock Date:</p>
          <p className="text-white font-medium">{format(unlockDate, 'PPP p')}</p>
        </div>
      )}
    </div>
  );
}

