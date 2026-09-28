# Roadmap and sprint plan

## Status implementasi — 28 September 2026

Fitur tersisa V1 telah dilengkapi: lifecycle dompet, ask/auto recurrence, closure/carryover anggaran, append import, PDF/draf/lampiran, preset laporan, widget order/hide, Ctrl+K, Realtime, activity dan backup byte Storage. Baca [panduan V1](V1-FEATURES.md). Production dan Development memakai migrasi 1–17 dan maintenance yang diperbarui; [promosi Production](PRODUCTION.md) dan [QA](QA-HOSTED.md) telah dicatat. Gate perangkat/provider nyata, pemulihan terisolasi dan instalasi self-host tetap terbuka.

Sprint berikutnya adalah validasi rilis: jalankan combined database/Storage backup, restore terisolasi dengan kunci independen, pilot keluarga/provider/kamera/dua perangkat dan clean self-host install. Kelengkapan kode tidak otomatis menutup syarat peluncuran. Catatan sprint di bawah adalah rencana dan riwayat sebelumnya.

One developer, indicative 1–2 week sprints; scope exit criteria govern timing. Foundation 0.1.0 is delivered locally; V1 readiness needs remaining slices and hosted verification.

| Sprint                    | Deliverable                                                                                                                                    | Exit criteria                                                                                                                |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| 0 — Foundation            | PRD/spec/docs, starter dashboard, ledger schema/RLS/RPC, AI/attachment API, tests, backup workflow                                             | Local build, automated database/domain/browser checks, documented setup                                                      |
| 1 — Household pilot       | Hosted Auth, Google/email confirmation/recovery, invite acceptance RPC, inactive memberships, wallet archive/edit, true session-lock reauth    | Owner+Member onboarding, revoked member cannot query/write, cross-household endpoint checks                                  |
| 2 — Ledger daily loop     | Transaction revision RPC with version check, editor, split/tag/category UI, pagination, advanced filters, fee detail                           | Atomic fee/splits on edit, conflict errors, totals preserved, creator immutable                                              |
| 3 — Capture               | BYOK management: status, replace and revoke, receipt upload/review UI, PDF adapter, confidence corrections, abandoned-draft cleanup            | Image/PDF extraction corrections before commit, duplicates/retries, provider failure manual fallback, no stored browser keys |
| 4 — Planning              | Budget CRUD, periods/thresholds/rollover closure, goal contributions/history/recommendations, recurring ask/auto runner                        | Overrun allowed, custom periods, virtual goals unchanged wallet balance, recurrence exactly-once per occurrence              |
| 5 — Reports and operation | Rule insights/comparison, CSV/JSON export complete, versioned dry-run import/restore, basic widget hide/order, realtime, backup/restore drill  | Restore validated on staging; current/previous periods reconcile ledger; two-device update consistency                       |
| 6 — V1 release            | Accessibility/contrast, responsive review, performance aggregates, threat review, test hosted auth/storage, self-host install guide validation | Acceptance criteria closed, no critical tenant/ledger issues, restore and retention evidence recorded                        |

Semua sprint dan versi berikut di dokumen ini berlaku untuk web app di browser. Responsif bukan proyek aplikasi mobile terpisah. Native Android/iOS/desktop, app store, installable PWA dan sinkronisasi offline berada di luar scope sampai pengguna meminta perluasan platform.

## V1.1

Bills, debt/receivables, email/Telegram reminders, full AI assistant with read-only aggregates and explicit write proposals, advanced reports, XLSX/PDF export, custom command palette. Do not build integrations before daily recording is reliable.

## V2

Child and parent permissions, advanced authentication (2FA/passkey), multi-currency, noncash assets/net worth, advanced dashboard builder/resize, complex forecasting. Domain decomposition must preserve liquid-wallet V1 totals rather than reinterpreting them as net worth.

## Development sequence

Schema/RLS before real data; invite and revision RPCs before removing users/editing transactions; deterministic budget/report aggregation before explanatory AI; backup restore rehearsal before production; recurrence runner only from user-approved templates. Update docs/ACCEPTANCE.md and docs/VERIFICATION.md when completing each slice.

## Planning pages delivered

Budget create/edit,custom date range/category/wallet/warning thresholds; goal create/edit/notes/status/archive; virtual contributions/history/correction and basic monthly arithmetic now implemented in the web UI. Remaining sprint4 work: automatic rollover period closure, budget deletion/archive lifecycle, recurring runner and advanced goal spending insights. Hosted authenticated pilot still required. This update does not declare the full sprint complete.

## Delivered transaction revision slice —27September2026

Creator/Owner transaction editor, atomic fee/split revision, version conflicts, exact retry and readable revision snapshots delivered to Development. Tag editor, advanced filters/pagination, hosted JWT pilot and receipt capture UX remain next work. This does not complete all Sprint2 or V1.

## Delivered receipt UI slice —27September2026

Image picker/validation/local preview,private upload adapter,AI result validation,editable draft review with image,error recovery/manual fallback and BYOK shortcut implemented. Existing backend reused. Remaining Capture work: hosted authenticated Storage/provider/confirm pilot,PDF adapter,draft resume,attachment browsing,credential rotation/remove UI and operational cleanup scheduler. No complete Sprint3/V1 claim.
