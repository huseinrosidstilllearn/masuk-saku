# API and Edge function flows

## V1 endpoints — 28 September 2026

| Flow                 | Contract and authorization                                                                                                                                                                                      |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Username/email login | Public username-login verifies normalized handle/quota, resolves privately and delegates password verification to Auth; email/Google use Auth.                                                                  |
| Wallet save          | `save_wallet(p_input,p_expected_version)` — active Owner, signed opening, tenant owner, immutable identity and retry-safe version.                                                                              |
| Manual ledger        | `create_transaction` / `revise_transaction` — active member, tenant references, immutable creator, atomic fee/split/tag and request key/version. Trash creator/Owner, restore Owner in 30 days.                 |
| Recurring rule       | `save_recurring_template(p_input,p_expected_version)` — creator/Owner edits, server-recorded approval; no direct template DML.                                                                                  |
| Recurring execution  | `process_my_recurring(p_household)` — member triggers due work only; `run_recurring_maintenance` is service-only. Ask creates occurrence; auto uses approved creator.                                           |
| Occurrence review    | `confirm_recurring_occurrence(p_id,p_input)` / `skip_recurring_occurrence(p_id)` — creator/Owner; corrected input validated, occurrence request ID reused.                                                      |
| Budget               | Existing member RLS create/edit plus `close_budget_period(p_id)` after WIB end date; direct server-field edits blocked. Service-only `run_budget_maintenance` creates unique successors.                        |
| Import               | `import_household_snapshot(p_household,p_data,p_members,p_request_key)` — active Owner, limits, remapped references/UUIDs, one transaction and exact request receipt.                                           |
| Capture              | attachment-upload checks session/membership/size/signature → ai-preview validates own unexpired attachment, encrypted BYOK and free-only provider → requester draft. PDF converted locally before image upload. |
| AI commit            | ai-confirm validates session → confirm_ai_draft requires human acknowledgement and idempotent ledger write → retention/optional immediate object cleanup.                                                       |
| Draft discard        | `discard_ai_draft(p_id)` — requester only, unconfirmed; expires draft and attachment without ledger changes.                                                                                                    |
| Attachment view      | Authenticated metadata query and Storage download under tenant/retention RLS; no public bucket or long-lived signed link.                                                                                       |
| Preferences/activity | member_preferences self-only upsert; activity_log Owner-only select. Realtime subscriptions remain tenant-filtered/RLS governed.                                                                                |
| Maintenance          | Separate secret bearer, exact allowed origin, service client; attachment expiration, trash/draft purge, recurrence and budget work. Database/Vault scheduler every 15 minutes.                                  |

Six Edge functions remain: username-login, ai-credentials, ai-preview, ai-confirm, attachment-upload and maintenance. New financial functions are RPCs, not additional unauthenticated adapters. Secrets never enter frontend build variables or snapshot exports.

## Catalog and transaction tags

Categories/tags use household-scoped authenticated Supabase CRUD under existing member RLS, with original-field optimistic checks on edits. Referenced rows cannot be deleted (FK restriction). Category hierarchy remains one level. Ledger tag creation uses create_transaction; revisions use revise_transaction with optional tag_ids (maximum30): omission preserves, [] clears, array replaces. Composite household FK rejects foreign tags; duplicate tags abort the entire revision. Revision snapshots retain tag IDs. Catalog edits do not write wallet/ledger values.
