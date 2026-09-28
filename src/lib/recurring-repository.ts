import type { RecurringTemplate, TransactionInput } from '../domain/types';
import { supabase } from './supabase';
import * as demo from './demo';
import { validDate } from '../domain/planning';

export async function saveRecurring(template: RecurringTemplate, original?: RecurringTemplate) {
  if (
    !template.name.trim() ||
    template.name.trim().length > 100 ||
    !validDate(template.anchor_date) ||
    (template.end_date &&
      (!validDate(template.end_date) || template.end_date < template.anchor_date))
  )
    throw new Error('Periksa nama, tanggal mulai, dan tanggal akhir jadwal.');
  if (!supabase) return demo.recurringSaveDemo(template, original);
  const {
    version: _version,
    created_by: _creator,
    next_run: _next,
    occurrence_index: _index,
    ...body
  } = template;
  const result = await supabase.rpc('save_recurring_template', {
    p_input: body,
    p_expected_version: original?.version ?? null,
  });
  if (result.error)
    throw new Error(
      result.error.message.includes('recurring conflict')
        ? 'Jadwal berubah. Muat ulang sebelum mengedit.'
        : result.error.message,
    );
}
export async function processRecurring(household: string): Promise<number> {
  if (!supabase) return demo.recurringProcessDemo();
  const result = await supabase.rpc('process_my_recurring', { p_household: household });
  if (result.error) throw new Error(result.error.message);
  return Number(result.data);
}
export async function confirmRecurring(id: string, input: TransactionInput) {
  if (!supabase) return demo.recurringConfirmDemo(id, input);
  const result = await supabase.rpc('confirm_recurring_occurrence', { p_id: id, p_input: input });
  if (result.error) throw new Error(result.error.message);
}
export async function skipRecurring(id: string) {
  if (!supabase) return demo.recurringSkipDemo(id);
  const result = await supabase.rpc('skip_recurring_occurrence', { p_id: id });
  if (result.error) throw new Error(result.error.message);
}
