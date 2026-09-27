import { z } from 'zod';
const score = z.number().min(0).max(1).nullable();
export const extractionSchema = z
  .object({
    candidate: z
      .object({
        type: z.enum(['income', 'expense', 'transfer']).nullable(),
        amount: z.number().int().min(1).max(9_000_000_000_000).nullable(),
        wallet_id: z.string().uuid().nullable(),
        destination_wallet_id: z.string().uuid().nullable(),
        occurred_at: z.string().datetime({ offset: true }).nullable(),
        category_id: z.string().uuid().nullable(),
        merchant: z.string().max(200),
        notes: z.string().max(2000),
      })
      .strict(),
    confidence: z
      .object({
        type: score,
        amount: score,
        wallet_id: score,
        occurred_at: score,
        category_id: score,
      })
      .strict(),
  })
  .strict();
