# Masuk Saku Foundation Implementation Plan

> Pelaksanaan langsung di folder lokal yang diminta pengguna; tidak membuat deployment atau repository remote.

**Goal:** runnable documented finance starter with defensible tenant/ledger boundaries.
**Spec:** TECHNICAL-SPEC.md. **Stack:** React/TypeScript/Vite, Supabase/PostgreSQL, Deno.

## Global constraints

IDR only; wallet_owner/transaction_actor/transaction_scope separate; human-confirmed AI; 30-day trash; default attachment retention 24h; creator+Owner trash; weekly backup; shared wallets; public/self-host friendly.

## Review focus

Cross-household FK injection; caller-supplied actor vs immutable creator; transfers between personal/shared wallets; pending/trash exclusion; missing/low-confidence amount or wallet. Test all in domain and PostgreSQL integration suite.

## Task 1 — Domain and frontend

Files: package.json, src/domain/{finance,quick-add,types}.ts, src/domain/finance.test.ts, src/App.tsx, `src/components/*`, `src/lib/*`, src/styles.css.

- [x] Install pinned dependencies and configure TypeScript/Vite.
- [x] Establish ledger/parser tests (transfer/fee/scope/delete/unsafe money).
- [x] Implement pure rules, demo repository, Supabase adapter, auth and preview-confirm UI.
- [x] Run npm test and npm run build.

## Task 2 — Database security

Files: supabase/migrations/*.sql, tests/database.test.ts.

- [x] Write real PostgreSQL integration assertions for unauthenticated/cross-tenant/creator vs actor/Owner restore/splits/idempotency/AI confirmation.
- [x] Implement tenant FKs, RLS, least-privilege grants, RPC boundaries, fee/split atomicity, audit, retention data.
- [x] Execute migrations and tests with embedded PostgreSQL; hosted Supabase follow-up uses same migrations.

## Task 3 — Server and operations

Files: `supabase/functions/*`, `scripts/backup.ps1`, `scripts/backup.sh`, `.github/workflows/{ci,backup,maintenance}.yml`, `docs/*`.

- [x] Implement AES-GCM credential storage, authenticated AI preview, strict draft schemas, explicit confirmation RPC, retention maintenance.
- [x] Provide private attachment policies, weekly encrypted backup and restore runbook.
- [x] Deno check all functions; npm audit and build.

## Task 4 — Documentation and handoff

Files: README.md, docs/PRD.md, ARCHITECTURE.md, DATABASE.md, API.md, SECURITY.md, ROADMAP.md, ACCEPTANCE.md, DESIGN-SYSTEM.md, DEPLOYMENT.md, VERIFICATION.md.

- [x] Record approved decisions, schema/flow, exact setup commands and feature completion matrix.
- [x] Inspect desktop/mobile app, run complete checks, record remaining external configuration.
- [ ] Remove project-owned scratch artifacts: execution policy rejected deletion; four generated files remain in ignored work/. Lockfiles and runnable source are present.
