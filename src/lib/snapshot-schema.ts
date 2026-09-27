import { z } from 'zod';
const amount = z.coerce.number().int().safe(),
  id = z.string(),
  nullable = id.nullable();
export const snapshotSchema = z.object({
  household: z.object({
    id,
    name: z.string(),
    attachment_retention: z.string(),
    session_lock_minutes: z.number(),
  }),
  members: z.array(
    z.object({
      user_id: id,
      household_id: id,
      role: z.enum(['owner', 'member']),
      display_name: z.string(),
    }),
  ),
  wallets: z.array(
    z.object({
      id,
      household_id: id,
      name: z.string(),
      type: z.enum(['bank', 'cash', 'e_wallet']),
      ownership: z.enum(['personal', 'shared']),
      wallet_owner: nullable,
      initial_balance: amount,
      active: z.boolean(),
    }),
  ),
  transactions: z.array(
    z.object({
      id,
      household_id: id,
      type: z.enum(['income', 'expense', 'transfer']),
      amount,
      wallet_id: id,
      destination_wallet_id: nullable,
      transaction_actor: id,
      transaction_scope: z.enum(['personal', 'family']),
      scope_member_id: nullable,
      status: z.enum(['pending', 'completed', 'cancelled']),
      occurred_at: z.string(),
      category_id: nullable,
      merchant: z.string(),
      notes: z.string(),
      created_by: id,
      deleted_at: nullable,
      parent_transaction_id: nullable.optional(),
      source: z.string().optional(),
      version: z.number().int().positive().default(1),
    }),
  ),
  categories: z.array(
    z.object({
      id,
      name: z.string(),
      parent_id: nullable,
      kind: z.enum(['income', 'expense', 'both']),
      color: z.string().default('#86b49c'),
      icon: z.string().default('tag'),
      sort_order: z.number().int().default(0),
    }),
  ),
  tags: z.array(z.object({ id, name: z.string() })).default([]),
  transactionTags: z.array(z.object({ transaction_id: id, tag_id: id })).default([]),
  splits: z.array(z.object({ transaction_id: id, category_id: id, amount })),
  budgets: z.array(
    z.object({
      id,
      name: z.string(),
      category_id: nullable,
      wallet_id: nullable,
      amount,
      start_date: z.string(),
      end_date: z.string(),
      rollover: z.enum(['reset', 'rollover']),
      rollover_amount: amount,
      warning_thresholds: z.array(z.number()),
    }),
  ),
  goals: z.array(
    z.object({
      id,
      title: z.string(),
      target_amount: amount,
      deadline: nullable,
      saved: amount,
      notes: z.string().default(''),
      status: z.enum(['active', 'completed', 'archived']).default('active'),
    }),
  ),
  contributions: z
    .array(z.object({ id, goal_id: id, amount, created_by: id, contributed_at: z.string() }))
    .default([]),
});
