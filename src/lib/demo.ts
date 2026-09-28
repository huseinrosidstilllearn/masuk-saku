import { validateTransaction, parseMoney, budgetSpent } from '../domain/finance';
import type { Snapshot, TransactionInput, RecurringTemplate } from '../domain/types';
import { nextOccurrence } from '../domain/recurring';
import { toWibInstant, wibDateTime } from '../domain/date-time';
const month = new Date()
  .toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit' })
  .replace('/', '-');
const now = new Date();
const y = now.getFullYear(),
  m = String(now.getMonth() + 1).padStart(2, '0');
const period = /^\d{4}-\d{2}$/.test(month) ? month : y + '-' + m;
export const demoUser = 'demo-owner';
const household_id = 'demo';
let data: Snapshot = {
  household: {
    id: household_id,
    name: 'Keluarga Demo',
    attachment_retention: '24h',
    session_lock_minutes: 15,
  },
  members: [
    { household_id, user_id: 'demo-owner', display_name: 'Pemilik', role: 'owner' },
    { household_id, user_id: 'demo-member', display_name: 'Anggota', role: 'member' },
  ],
  wallets: [
    {
      id: 'bca',
      household_id,
      name: 'BCA Utama',
      type: 'bank',
      ownership: 'personal',
      wallet_owner: 'demo-owner',
      initial_balance: 3200000,
      active: true,
    },
    {
      id: 'bri',
      household_id,
      name: 'BRI Harian',
      type: 'bank',
      ownership: 'personal',
      wallet_owner: 'demo-member',
      initial_balance: 2750000,
      active: true,
    },
    {
      id: 'dana',
      household_id,
      name: 'DANA',
      type: 'e_wallet',
      ownership: 'personal',
      wallet_owner: 'demo-owner',
      initial_balance: 425000,
      active: true,
    },
    {
      id: 'cash',
      household_id,
      name: 'Cash Rumah',
      type: 'cash',
      ownership: 'shared',
      wallet_owner: null,
      initial_balance: 600000,
      active: true,
    },
  ],
  tags: [],
  transactionTags: [],
  categories: [
    { id: 'food', name: 'Makanan', parent_id: null, kind: 'expense' },
    { id: 'transport', name: 'Transportasi', parent_id: null, kind: 'expense' },
    { id: 'education', name: 'Pendidikan', parent_id: null, kind: 'expense' },
    { id: 'work', name: 'Pekerjaan', parent_id: null, kind: 'income' },
    { id: 'admin', name: 'Admin', parent_id: null, kind: 'expense' },
  ],
  transactions: [
    {
      id: 'income',
      household_id,
      type: 'income',
      amount: 6500000,
      wallet_id: 'bca',
      destination_wallet_id: null,
      transaction_actor: 'demo-owner',
      transaction_scope: 'personal',
      scope_member_id: 'demo-owner',
      status: 'completed',
      occurred_at: period + '-01T08:00:00+07:00',
      category_id: 'work',
      merchant: 'Proyek freelance',
      notes: '',
      created_by: 'demo-owner',
      deleted_at: null,
    },
    {
      id: 'food1',
      household_id,
      type: 'expense',
      amount: 325000,
      wallet_id: 'bca',
      destination_wallet_id: null,
      transaction_actor: 'demo-member',
      transaction_scope: 'family',
      scope_member_id: null,
      status: 'completed',
      occurred_at: period + '-10T14:00:00+07:00',
      category_id: 'food',
      merchant: 'Belanja mingguan',
      notes: 'Kebutuhan rumah',
      created_by: 'demo-member',
      deleted_at: null,
    },
    {
      id: 'food2',
      household_id,
      type: 'expense',
      amount: 27000,
      wallet_id: 'dana',
      destination_wallet_id: null,
      transaction_actor: 'demo-owner',
      transaction_scope: 'personal',
      scope_member_id: 'demo-owner',
      status: 'completed',
      occurred_at: period + '-12T12:00:00+07:00',
      category_id: 'food',
      merchant: 'Makan siang',
      notes: '',
      created_by: 'demo-owner',
      deleted_at: null,
    },
    {
      id: 'transport1',
      household_id,
      type: 'expense',
      amount: 150000,
      wallet_id: 'bri',
      destination_wallet_id: null,
      transaction_actor: 'demo-member',
      transaction_scope: 'family',
      scope_member_id: null,
      status: 'completed',
      occurred_at: period + '-08T10:00:00+07:00',
      category_id: 'transport',
      merchant: 'Bensin & transportasi',
      notes: '',
      created_by: 'demo-member',
      deleted_at: null,
    },
    {
      id: 'campus',
      household_id,
      type: 'expense',
      amount: 750000,
      wallet_id: 'bca',
      destination_wallet_id: null,
      transaction_actor: 'demo-owner',
      transaction_scope: 'personal',
      scope_member_id: 'demo-owner',
      status: 'completed',
      occurred_at: period + '-15T09:00:00+07:00',
      category_id: 'education',
      merchant: 'Kebutuhan kuliah',
      notes: '',
      created_by: 'demo-owner',
      deleted_at: null,
    },
  ],
  splits: [],
  budgets: [
    {
      id: 'food-budget',
      name: 'Makanan',
      category_id: 'food',
      wallet_id: null,
      amount: 1000000,
      start_date: period + '-01',
      end_date: period + '-31'.replace('-31', '-' + new Date(y, now.getMonth() + 1, 0).getDate()),
      rollover: 'reset',
      rollover_amount: 0,
      warning_thresholds: [75, 90, 100],
    },
    {
      id: 'transport-budget',
      name: 'Transportasi',
      category_id: 'transport',
      wallet_id: null,
      amount: 400000,
      start_date: period + '-01',
      end_date: period + '-28',
      rollover: 'reset',
      rollover_amount: 0,
      warning_thresholds: [75, 90, 100],
    },
  ],
  goals: [
    {
      id: 'camera',
      title: 'Kamera baru',
      target_amount: 8000000,
      deadline: period.slice(0, 4) + '-12-31',
      saved: 3200000,
      notes: '',
      status: 'active',
    },
    {
      id: 'holiday',
      title: 'Liburan keluarga',
      target_amount: 5000000,
      deadline: null,
      saved: 1250000,
      notes: '',
      status: 'active',
    },
  ],
  contributions: [
    {
      id: 'camera-opening',
      goal_id: 'camera',
      amount: 3200000,
      created_by: demoUser,
      contributed_at: period + '-01T12:00:00+07:00',
    },
    {
      id: 'holiday-opening',
      goal_id: 'holiday',
      amount: 1250000,
      created_by: demoUser,
      contributed_at: period + '-01T12:00:00+07:00',
    },
  ],
};
export function loadDemo() {
  return structuredClone(data);
}
export function recurringSaveDemo(template: RecurringTemplate, original?: RecurringTemplate) {
  const list = (data.recurring ??= []);
  const old = list.find((t) => t.id === template.id);
  if (old && old.version !== original?.version) throw new Error('Jadwal berubah. Muat ulang.');
  validateTransaction(
    template.transaction_template,
    data.wallets,
    template.transaction_template.splits ?? [],
  );
  const changed =
    !old || old.anchor_date !== template.anchor_date || old.cadence !== template.cadence;
  const value = structuredClone({
    ...template,
    name: template.name.trim(),
    version: (old?.version ?? 0) + 1,
    next_run: changed ? template.anchor_date : old.next_run,
    occurrence_index: changed ? 0 : old.occurrence_index,
  });
  if (old) Object.assign(old, value);
  else list.push(value);
}
export function recurringConfirmDemo(id: string, input: TransactionInput) {
  const occurrence = data.occurrences?.find((o) => o.id === id);
  if (!occurrence || occurrence.status === 'skipped')
    throw new Error('Kejadian tidak dapat dicatat.');
  if (occurrence.status === 'created') {
    if (JSON.stringify(occurrence.input) !== JSON.stringify(input))
      throw new Error('Kejadian sudah dicatat.');
    return;
  }
  validateTransaction(input, data.wallets, input.splits ?? []);
  createDemo(input, id);
  data.transactions
    .filter((t) => t.id === id || t.parent_transaction_id === id)
    .forEach((t) => {
      t.source = 'recurring';
      t.recurring_template_id = occurrence.template_id;
    });
  Object.assign(occurrence, {
    input: structuredClone(input),
    status: 'created',
    transaction_id: id,
    error_reason: null,
  });
}
export function recurringSkipDemo(id: string) {
  const occurrence = data.occurrences?.find((o) => o.id === id);
  if (!occurrence || occurrence.status === 'created')
    throw new Error('Transaksi tercatat harus dipindahkan ke sampah.');
  occurrence.status = 'skipped';
}
export function closeBudgetDemo(id: string) {
  const b = data.budgets.find((b) => b.id === id);
  if (!b || b.closed_at) return;
  if (b.end_date >= wibDateTime().slice(0, 10)) throw new Error('Periode belum berakhir.');
  b.closed_spent = budgetSpent(b, data.transactions, data.splits, undefined, data.categories);
  b.closed_at = new Date().toISOString();
  if (b.auto_continue && b.active !== false) {
    const start = new Date(b.end_date + 'T12:00:00Z');
    start.setUTCDate(start.getUTCDate() + 1);
    const end = new Date(start);
    if (b.cadence === 'monthly') {
      end.setUTCMonth(end.getUTCMonth() + 1, 0);
    } else
      end.setUTCDate(
        end.getUTCDate() +
          (new Date(b.end_date).getTime() - new Date(b.start_date).getTime()) / 86400000,
      );
    data.budgets.push({
      ...b,
      id: crypto.randomUUID(),
      start_date: start.toISOString().slice(0, 10),
      end_date: end.toISOString().slice(0, 10),
      predecessor_id: b.id,
      closed_at: null,
      closed_spent: null,
      rollover_amount:
        b.rollover === 'rollover' ? Math.max(0, b.amount + b.rollover_amount - b.closed_spent) : 0,
    });
  }
}
export function recurringProcessDemo() {
  const now = wibDateTime(),
    today = now.slice(0, 10);
  const occurrences = (data.occurrences ??= []);
  let count = 0;
  for (const template of data.recurring ?? []) {
    while (template.active && template.next_run <= today && count < 100) {
      if (template.end_date && template.next_run > template.end_date) {
        template.active = false;
        break;
      }
      if (template.next_run === today && template.run_time > now.slice(11)) break;
      let occurrence = occurrences.find(
        (o) => o.template_id === template.id && o.scheduled_date === template.next_run,
      );
      if (!occurrence) {
        occurrence = {
          id: crypto.randomUUID(),
          template_id: template.id,
          household_id: template.household_id,
          scheduled_date: template.next_run,
          status: 'pending',
          transaction_id: null,
          error_reason: null,
          input: {
            ...structuredClone(template.transaction_template),
            occurred_at: toWibInstant(`${template.next_run}T${template.run_time}`),
          },
        };
        occurrences.push(occurrence);
      }
      if (template.mode === 'auto_create' && ['pending', 'error'].includes(occurrence.status)) {
        try {
          recurringConfirmDemo(occurrence.id, occurrence.input);
        } catch {
          occurrence.status = 'error';
          occurrence.error_reason = 'Periksa dompet, anggota, dan kategori sebelum melanjutkan.';
          template.active = false;
          break;
        }
      }
      template.occurrence_index += 1;
      template.next_run = nextOccurrence(
        template.anchor_date,
        template.cadence,
        template.occurrence_index,
      );
      template.version += 1;
      count += 1;
    }
  }
  return count;
}
export function createDemo(input: TransactionInput, key: string) {
  if (data.transactions.some((t) => t.id === key)) return;
  const { fee_amount, splits, tag_ids = [], ...rest } = input;
  if (
    tag_ids.length > 30 ||
    new Set(tag_ids).size !== tag_ids.length ||
    tag_ids.some((id) => !data.tags.some((t) => t.id === id))
  )
    throw new Error('Tag tidak valid.');
  const tx = { ...rest, id: key, household_id, created_by: demoUser, deleted_at: null };
  data.transactions.push(tx);
  data.transactionTags.push(...tag_ids.map((tag_id) => ({ transaction_id: key, tag_id })));
  if (splits) data.splits.push(...splits.map((s) => ({ ...s, transaction_id: key })));
  if (fee_amount > 0)
    data.transactions.push({
      ...tx,
      id: key + '-fee',
      type: 'expense',
      amount: fee_amount,
      destination_wallet_id: null,
      parent_transaction_id: key,
      category_id: 'admin',
      merchant: 'Biaya admin',
    });
}
export function trashDemo(id: string) {
  data.transactions = data.transactions.map((t) =>
    t.id === id || t.parent_transaction_id === id
      ? { ...t, deleted_at: new Date().toISOString(), version: (t.version ?? 1) + 1 }
      : t,
  );
}
export function restoreDemo(id: string) {
  data.transactions = data.transactions.map((t) =>
    t.id === id || t.parent_transaction_id === id
      ? { ...t, deleted_at: null, version: (t.version ?? 1) + 1 }
      : t,
  );
}
export function walletDemo(wallet: Snapshot['wallets'][number]) {
  data.wallets.push(wallet);
}
export function walletSaveDemo(
  wallet: Snapshot['wallets'][number],
  original?: Snapshot['wallets'][number],
) {
  const old = data.wallets.find((w) => w.id === wallet.id);
  if (old && original && (old.version ?? 1) !== (original.version ?? 1))
    throw new Error('Dompet berubah. Muat ulang.');
  if (old && !original) throw new Error('ID dompet sudah digunakan.');
  data.wallets = [
    ...data.wallets.filter((w) => w.id !== wallet.id),
    { ...structuredClone(wallet), version: (old?.version ?? 0) + 1 },
  ];
}
export function settingsDemo(settings: Partial<Snapshot['household']>) {
  data.household = { ...data.household, ...settings };
}
export function renameDemoMember(userId: string, nickname: string) {
  data.members = data.members.map((member) =>
    member.user_id === userId ? { ...member, display_name: nickname } : member,
  );
}
export function budgetDemo(
  budget: Snapshot['budgets'][number],
  original?: Snapshot['budgets'][number],
) {
  const current = data.budgets.find((b) => b.id === budget.id);
  if (current?.closed_at) throw new Error('Periode ditutup tidak dapat diubah.');
  if (current && JSON.stringify(current) === JSON.stringify(budget)) return;
  if (original && JSON.stringify(current) !== JSON.stringify(original))
    throw new Error('Anggaran berubah. Muat ulang halaman.');
  if (!original && current) {
    if (JSON.stringify(current) === JSON.stringify(budget)) return;
    throw new Error('ID anggaran sudah digunakan.');
  }
  data.budgets = [...data.budgets.filter((b) => b.id !== budget.id), structuredClone(budget)];
}
export function goalDemo(goal: Snapshot['goals'][number], original?: Snapshot['goals'][number]) {
  const current = data.goals.find((g) => g.id === goal.id);
  if (
    current &&
    ['id', 'title', 'target_amount', 'deadline', 'notes', 'status'].every(
      (key) => current[key as keyof typeof current] === goal[key as keyof typeof goal],
    )
  )
    return;
  // Contributions may change concurrently; never replace their derived progress.
  if (
    original &&
    (!current ||
      ['title', 'target_amount', 'deadline', 'notes', 'status'].some(
        (key) => current[key as keyof typeof current] !== original[key as keyof typeof original],
      ))
  )
    throw new Error('Target berubah. Muat ulang halaman.');
  if (!original && current) {
    if (JSON.stringify(current) === JSON.stringify(goal)) return;
    throw new Error('ID target sudah digunakan.');
  }
  data.goals = [
    ...data.goals.filter((g) => g.id !== goal.id),
    { ...structuredClone(goal), saved: current?.saved ?? 0 },
  ];
}
export function contributionDemo(contribution: Snapshot['contributions'][number]) {
  const goal = data.goals.find((g) => g.id === contribution.goal_id);
  if (!goal) throw new Error('Target tidak ditemukan.');
  const current = data.contributions.find((c) => c.id === contribution.id);
  if (current) {
    if (JSON.stringify(current) === JSON.stringify(contribution)) return;
    throw new Error('ID catatan sudah digunakan.');
  }
  data.contributions.push(structuredClone(contribution));
  goal.saved += contribution.amount;
}
export function removeContributionDemo(id: string) {
  const contribution = data.contributions.find((c) => c.id === id);
  if (!contribution) throw new Error('Catatan progres tidak ditemukan.');
  if (
    contribution.created_by !== demoUser &&
    data.members.find((member) => member.user_id === demoUser)?.role !== 'owner'
  )
    throw new Error('Tidak memiliki akses.');
  const goal = data.goals.find((g) => g.id === contribution.goal_id)!;
  goal.saved -= contribution.amount;
  data.contributions = data.contributions.filter((c) => c.id !== id);
}

const revisions: import('./transaction-revisions').Revision[] = [];
const revisionRequests = new Map<string, string>();
export function revisionHistoryDemo(id: string) {
  return structuredClone(revisions.filter((r) => r.after_snapshot.transaction.id === id).reverse());
}
export function reviseDemo(id: string, version: number, input: TransactionInput, key: string) {
  const tx = data.transactions.find((t) => t.id === id);
  if (!tx || tx.parent_transaction_id || tx.deleted_at)
    throw new Error('Transaksi tidak bisa diedit.');
  if (
    tx.created_by !== demoUser &&
    data.members.find((m) => m.user_id === demoUser)?.role !== 'owner'
  )
    throw new Error('Hanya creator atau Owner.');
  const payload = JSON.stringify({ id, version, input });
  if (revisionRequests.has(key)) {
    if (revisionRequests.get(key) !== payload) throw new Error('idempotency payload mismatch');
    return;
  }
  if ((tx.version ?? 1) !== version)
    throw new Error(
      'Transaksi sudah berubah. Tutup editor lalu muat ulang sebelum mengedit kembali.',
    );
  const snapshot = () => ({
    transaction: structuredClone(tx),
    fees: structuredClone(data.transactions.filter((t) => t.parent_transaction_id === id)),
    splits: structuredClone(data.splits.filter((s) => s.transaction_id === id)),
    tags: structuredClone(data.transactionTags.filter((t) => t.transaction_id === id)),
  });
  validateTransaction(input, data.wallets, input.splits ?? []);
  if (input.fee_amount > 0) {
    parseMoney(input.fee_amount);
    if (input.type !== 'transfer') throw new Error('Invalid fee');
  }
  const before = snapshot();
  const { fee_amount, splits = [], tag_ids, ...rest } = input;
  if (
    tag_ids &&
    (tag_ids.length > 30 ||
      new Set(tag_ids).size !== tag_ids.length ||
      tag_ids.some((id) => !data.tags.some((t) => t.id === id)))
  )
    throw new Error('Tag tidak valid.');
  Object.assign(tx, rest, { version: version + 1 });
  const oldFee = data.transactions.find((t) => t.parent_transaction_id === id);
  data.transactions = data.transactions.filter((t) => t.parent_transaction_id !== id);
  if (fee_amount > 0)
    data.transactions.push({
      ...tx,
      id: oldFee?.id ?? crypto.randomUUID(),
      created_by: oldFee?.created_by ?? tx.created_by,
      type: 'expense',
      amount: fee_amount,
      destination_wallet_id: null,
      parent_transaction_id: id,
      category_id: 'admin',
      merchant: 'Biaya admin',
      notes: '',
    });
  data.splits = [
    ...data.splits.filter((s) => s.transaction_id !== id),
    ...splits.map((s) => ({ ...s, transaction_id: id })),
  ];
  if (tag_ids)
    data.transactionTags = [
      ...data.transactionTags.filter((t) => t.transaction_id !== id),
      ...tag_ids.map((tag_id) => ({ transaction_id: id, tag_id })),
    ];
  revisions.push({
    id: crypto.randomUUID(),
    actor_id: demoUser,
    created_at: new Date().toISOString(),
    resulting_version: version + 1,
    before_snapshot: before,
    after_snapshot: snapshot(),
  });
  revisionRequests.set(key, payload);
}

export function catalogDemo(
  table: 'categories' | 'tags',
  item: Snapshot['categories'][number] | Snapshot['tags'][number],
  original?: Snapshot['categories'][number] | Snapshot['tags'][number],
) {
  const list = data[table] as (typeof item)[];
  const index = list.findIndex((c) => c.id === item.id);
  if (index >= 0 && JSON.stringify(list[index]) === JSON.stringify(item)) return;
  if (original && (index < 0 || JSON.stringify(list[index]) !== JSON.stringify(original)))
    throw new Error('Data berubah. Muat ulang halaman.');
  if (index >= 0) list[index] = structuredClone(item);
  else list.push(structuredClone(item));
}
export function removeCatalogDemo(table: 'categories' | 'tags', id: string) {
  const used =
    table === 'categories'
      ? data.transactions.some((t) => t.category_id === id) ||
        data.splits.some((t) => t.category_id === id) ||
        data.budgets.some((t) => t.category_id === id) ||
        data.categories.some((t) => t.parent_id === id)
      : data.transactionTags.some((t) => t.tag_id === id);
  if (used) throw new Error('Masih digunakan. Ubah referensinya terlebih dahulu.');
  if (table === 'categories') data.categories = data.categories.filter((c) => c.id !== id);
  else data.tags = data.tags.filter((c) => c.id !== id);
}
