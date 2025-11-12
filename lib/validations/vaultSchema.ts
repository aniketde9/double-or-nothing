import { z } from 'zod';
import { MIN_VAULT_AMOUNT, MIN_UNLOCK_DURATION } from '@/constants/vault';

export const vaultCreationSchema = z.object({
  tokenMint: z.string().min(1, 'Token is required'),
  amount: z
    .number()
    .positive('Amount must be greater than 0')
    .min(MIN_VAULT_AMOUNT, `Minimum amount is ${MIN_VAULT_AMOUNT}`),
  unlockTimestamp: z
    .number()
    .int()
    .refine(
      (timestamp) => {
        const now = Math.floor(Date.now() / 1000);
        const minUnlock = now + MIN_UNLOCK_DURATION;
        return timestamp >= minUnlock;
      },
      {
        message: `Unlock timestamp must be at least ${MIN_UNLOCK_DURATION / (24 * 60 * 60)} days from now`,
      }
    ),
  unlockType: z.enum(['TimeOnly', 'PriceDouble']),
  initialPrice: z
    .number()
    .positive('Initial price must be greater than 0')
    .refine(
      (price) => {
        // Check price freshness (should be validated separately, but schema can help)
        return price > 0;
      },
      { message: 'Price data is required' }
    ),
});

export type VaultCreationFormData = z.infer<typeof vaultCreationSchema>;

