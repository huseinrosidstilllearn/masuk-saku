/* Visual composition adapted from Watermelon budget-card (MIT).
 * Real budget data, Indonesian copy and immediate privacy masking replace its demo data/motion.
 * See docs/UI-REFERENCES.md and public/licenses/Watermelon-MIT.txt.
 */
export function BudgetPulse({
  limit,
  remaining,
  hide,
}: {
  limit: number;
  remaining: number;
  hide: boolean;
}) {
  if (hide || limit <= 0) return null;
  const used = Math.max(0, limit - remaining);
  const percentage = Math.round((used / limit) * 100);
  return (
    <div className="budget-pulse" data-over={remaining < 0}>
      <div className="budget-pulse-track" aria-hidden="true">
        <span style={{ width: `${Math.min(100, percentage)}%` }} />
      </div>
      <small>
        {remaining < 0 ? 'Melebihi alokasi' : 'Alokasi terpakai'} <strong>{percentage}%</strong>
      </small>
    </div>
  );
}
