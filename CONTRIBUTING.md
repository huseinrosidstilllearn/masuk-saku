# Contributing

Read docs/PRD.md and docs/TECHNICAL-SPEC.md first. Preserve IDR whole-rupiah math, ownership/actor/scope separation, AI human confirmation and tenant isolation. All ledger writes through authorized RPC, never raw client table updates.

Use Node >=22.12. npm ci; npm run dev:demo or configure your own Development backend before npm run dev. npm run check, npm run test:e2e -- --workers=2, npm run test:auth -- --workers=2 and npm run format:check must pass. Database tests use embedded PostgreSQL with Auth/Storage interfaces scaffolded only for tests. Run deno check + deno test --allow-env for server code. New migrations append timestamped SQL; never rewrite deployed migrations after production rollout.

Add behavioral tests for tenant/permission/financial changes. Do not add test-only mocks to production code. Include migration effects, user-visible behavior and validation evidence in changes. Do not commit .env values, real receipts, private data, plaintext backups, provider credentials or deployment secrets. See docs/ROADMAP.md for next feature slices.
