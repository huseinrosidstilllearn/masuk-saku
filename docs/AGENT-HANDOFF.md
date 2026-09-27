# Agent handoff — V1 release work

This repository is a working browser application and V1 release candidate under construction, not a claim that every PRD gate is complete. See PRD, ACCEPTANCE and the release implementation plan.

Architecture: React/TypeScript/Vite static frontend, Supabase Auth/PostgreSQL/RLS/private Storage/Deno Edge backend. All financial changes via authorized RPC; editable AI previews with explicit human confirmation. OpenRouter BYOK free-only. Browser-only, IDR integers/WIB24h, owner/actor/scope/creator independent.

Current frontend: multicolor banking dashboard, source-backed motion/reduced motion, shared native dropdowns, mobile5nav and central3capture options. Camera consent/cleanup and human confirmation remain required. Generic examples only.

Latest work: password recovery request/separate panel, current-user BYOK status/replace/revoke with migration9. These changes are local until release validation/deployment. Prior hosted version: Productione2da5fd5, Development78e8c110;8migrations/6Edge functions. User confirmed production signup/email/username login. Do not infer real finance/provider/retention pilot from mocked tests.

Verification commands: npm ci; npm run check; npm run format:check; npm run test:e2e; npm run test:auth. Deno check all6functions and deno test --allow-env supabase/functions/_shared/. SQL tests use PGlite scaffolding, not managed Supabase. Browser configured tests use fixture credentials/network, not private accounts.

Remaining gates: encrypted weekly backup credentials/job plus isolated restore and independent key recovery; Google provider; real-account finance/AI/Storage pilot; wallet/member lifecycle, filters/report pagination, recurrence/rollover/import according to plan. Do not relabel these complete. Private local NOTES.md/work/receipts/secrets/raw conversation/screenshots are intentionally not distributed. Public examples contain no financial data.
