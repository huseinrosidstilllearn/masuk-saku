# Masuk Saku V1 Completion Implementation Plan

> **For agentic workers:** Implement task-by-task in the current authorized project. Track checked steps here and actual evidence in AGENT-HANDOFF. Native execution is authorized by the user's instruction to finish all V1 features.

**Goal:** Deliver every remaining V1 feature in the PRD, without claiming live-user or recovery tests that have not happened.

**Architecture:** Keep the React/Supabase split. Financial automation and import use tenant-authorized, atomic PostgreSQL RPCs with explicit approval and retry keys. Browser domain helpers mirror deterministic calculations for preview/demo; server validation remains authoritative.

**Tech Stack:** React, TypeScript, Vite, PostgreSQL/Supabase, Deno Edge Functions, Playwright, Vitest/PGlite.

**Spec:** [PRD](../../PRD.md), [acceptance](../../ACCEPTANCE.md), [technical specification](../../TECHNICAL-SPEC.md).

## Global Constraints

- IDR integers; maximum absolute per amount 9,000,000,000,000.
- wallet_owner, transaction_actor, transaction_scope and immutable created_by remain independent.
- Active membership/tenant checks precede every write. Creator/Owner trash; Owner restores within 30 days.
- AI produces editable drafts, never ledger writes without human confirmation; BYOK stays encrypted on the server.
- Browser web app, SVG icons, WIB 24-hour time, immediate money masking and reduced motion.
- Work in the existing folder; Development first; Production promotion is separate from implementation verification.

## Review Focus

- Lost responses must not duplicate imported or recurring transactions.
- A revoked member or a foreign wallet/category must not authorize automation.
- Month ends/leap years and Jakarta boundaries must not skip or double-run occurrences.
- Archiving does not delete historical transactions; money-changing edits require visible confirmation.
- Malformed/oversized input and provider failures preserve recoverable drafts without secrets in browser storage.

### Task 1: Wallet lifecycle

Files: `src/components/WalletManager.tsx`, `src/lib/wallet-repository.ts`, `src/domain/wallets.ts`, `src/domain/types.ts`, `src/lib/snapshot-schema.ts`, `src/App.tsx`, new migration12, `tests/database.test.ts`, `tests/e2e/wallets.spec.ts`.

Interface: `saveWallet(wallet: Wallet, original?: Wallet): Promise<void>` invokes `save_wallet(jsonb, integer)`; returns only after version-checked owner authorization. `parseOpeningBalance(string): number` accepts signed integers including zero.

- [ ] Test signed opening balance, foreign/nonowner writes, version conflict, exact retry and archive/history preservation.
- [x] Implement create/edit/name/type/ownership/icon/color/optional identifier, archive/reactivate with explicit balance-impact copy, immutable tenant/id and audit entry.
- [ ] Verify unit/SQL/browser checks before deployment.

```ts
expect(parseOpeningBalance('-15000')).toBe(-15000);
expect(() => parseOpeningBalance('1.5')).toThrow();
```

### Task 2: Recurring transactions

Files: `src/domain/recurring.ts`, `src/components/Recurring.tsx`, `src/lib/recurring-repository.ts`, types/schema/repository/App; new recurring migration, maintenance function, SQL/domain/browser tests.

Interface: `nextOccurrence(anchor: string, cadence: 'weekly'|'monthly', index: number): string`; `save_recurring_template(jsonb,integer)` stores only an explicitly approved template; runner creates one unique `(template_id, scheduled_date)` occurrence. Ask occurrences stay proposals; `confirm_recurring_occurrence(uuid,uuid)` performs an authorized ledger write. Auto mode retains approval/creator, never uses an AI decision.

- [ ] Pin January31→February28→March31, leap February, date boundaries, duplicate runner/confirm and disabled/revoked/template-wallet cases.
- [x] Add template editor, pause/resume/end date, upcoming history, pending review/skip, and maintenance catch-up with bounded work.
- [x] Run SQL permission/idempotency and browser confirmation tests.

```ts
expect(nextOccurrence('2027-01-31', 'monthly', 2)).toBe('2027-03-31');
```

### Task 3: Budget lifecycle and deterministic closure

Files: planning domain/repository/UI/types, new budget migration, maintenance function and SQL/domain/browser tests.

Interface: `close_budget_period(uuid)` freezes calculated spend and creates one successor period for a continuing budget. Carry is `max(0, allowance-spent)` in rollover mode, zero in reset mode. Calendar monthly/weekly anchors remain stable; custom periods continue by exact day length only when explicitly enabled.

- [ ] Test split/category descendants, transfer fees, midnight WIB, overspending carry zero, retry uniqueness and concurrent closure/edit conflict.
- [x] Add period cadence/continuation, close history, archive/reactivate and server maintenance closure; prevent arbitrary direct carry editing.
- [x] Verify totals and no wallet balance change.

```ts
expect(Math.max(0, 100000 - 130000)).toBe(0);
```

### Task 4: Export/import and pagination

Files: export/import domain and UI/repository, new import RPC migration, snapshot paginated loader, reports filters/presets and tests.

Interface: validated schema-version envelope → `previewImport` produces explicit mapping/counts/warnings; Owner confirms `import_household_snapshot(jsonb,uuid)` into the current household using remapped IDs and no auth credentials/membership transfer. Never overwrite existing ledger or import arbitrary creator IDs. Export includes all financial relations and excludes secrets/photos.

- [ ] Test malformed versions, missing references, CSV formulas, over-limit numbers, wrong sum, retry and foreign-tenant payload rejection.
- [x] Add dry-run review, explicit append/confirm, whole operation atomic rollback, complete CSV columns/JSON data and restore runbook.
- [x] Replace the unpaginated snapshot cap with stable ID-keyed batches and add report presets/amount-scope filtering.

### Task 5: Capture completeness

Files: receipt UI/client adapter, draft browser, shared AI adapter, attachment upload/preview Edge functions and tests.

Interface: image or PDF capture → private attachment → requester-owned saved draft → editable TransactionForm → existing ai-confirm. PDF input is size/page bounded and must not become arbitrary remote URL fetch.

- [ ] Test malformed PDF/type spoofing, expired/foreign drafts, cancelled/retried upload, provider failure and attachment retention.
- [x] Add PDF support, draft resume/discard and authorized attachment viewer; expiration never removes ledger.
- [x] Verify Edge checks and browser draft/confirmation behavior.

### Task 6: Dashboard, activity and goal insights

Files: dashboard preferences component/repository/schema, App, Reports, planning insights and tests.

Interface: own member preferences store only widget order/visibility; global search/palette navigates and filters existing data; read-only activity is tenant-scoped. Realtime refresh is debounced and unsubscribed on logout.

- [ ] Test hidden money, member ownership, malformed preference fallback, stable refresh/focus and unsubscribed revoked sessions.
- [x] Add hide/order widgets, Ctrl+K navigation/search, activity feed, spending-vs-goal warning and report preset shortcuts.
- [x] Keep all insights deterministic and labelled without invented trends.

### Task 7: Operational completeness and release validation

Files: maintenance scheduler/backup scripts and workflows, restore/storage runbook, README/PRD/spec/acceptance/handoff.

- [ ] Cover weekly encrypted Storage-object backup as well as database dump; recovery copy guidance and isolated restore validation.
- [x] Validate self-host deployment inputs and update README to describe delivered capabilities/limits.
- [x] Run `npm run check`, `npm run test:e2e`, `npm run test:auth`, `npm run format:check`, all Deno tests/checks, staged source guard/Gitleaks/diffcheck; deploy Development migrations/functions/frontend.
- [x] Record independent hosted checks and remaining operator-only account/provider/physical-camera/recovery gates separately. Do not mark V1 launch-ready while these gates remain.

## Verification ledger

Tasks1–6 have implementations and automated checks. Unchecked exhaustive test lists include cases not independently proven; use ACCEPTANCE rather than interpreting implementation as pilot completion. Development backend12–17 and maintenance scheduler are applied. Frontend258978ba, CI36388554696 and combined backups36388615213/36388892689 are verified in AGENT-HANDOFF. Isolated full restore and independent key copies remain incomplete. Production promotion remains separate.
