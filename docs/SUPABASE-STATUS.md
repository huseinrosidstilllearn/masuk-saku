# Supabase connection status — 27 September 2026

| Item                  | Development                         | Production                             |
| --------------------- | ----------------------------------- | -------------------------------------- |
| Project ref           | kxezrgvnpoaqzcseymts                | snqkfrcxjfdjkwxjiabc                   |
| Local frontend config | .env.development.local              | .env.production.local                  |
| CLI administration    | Logged in, linked                   | Explicit project ref; isolated profile |
| Database migrations   | All8applied; history matches        | All8applied; history matches           |
| Edge Functions        | All6ACTIVE; versions in notes       | All6ACTIVEv1                           |
| Auth service          | Available, email signup enabled     | Available, email signup enabled        |
| Google provider       | Not enabled                         | Not enabled                            |
| Frontend deployment   | Cloudflare Pages hosted Development | Pages95ae4223; custom domain pending   |

Development hosted PostgreSQL is 17.6. Catalog verification found 16 public RLS tables, 26 public/storage policies and receipts bucket with public=false. An unauthenticated households request is denied (401/42501); Production has17public base tables after8migrations; protected endpoints deny unauthenticated access.

Development Auth Site URL is https://masuk-saku-development.pages.dev; redirect allowlist contains that exact origin plus http://127.0.0.1:5173 and http://localhost:5173. REST row limit is 10000 and Storage upload limit is 10 MiB. API exposed schemas are public/graphql_public; private remains unexposed.

Server encryption and maintenance secrets were generated and uploaded to Development. Their recovery copy is in ignored `supabase/functions/.env.local`; keep it in a secure backup and never commit it. The CLI login credential is managed by Supabase CLI, not stored in source. Public frontend keys are excluded from Git with the local environment files. `.env.example` remains a credential-free template.

Protected endpoint smoke checks and CORS checks are recorded in VERIFICATION.md. No real user account, household, ledger transaction, receipt, BYOK provider call or weekly backup was created/executed by this setup. End-to-end hosted signup/confirmation, financial flows and Storage retention still require user-session acceptance checks.

Still needed: Google OAuth client credentials, user BYOK key when using AI, Cloudflare domain/deployment, weekly backup credentials/restore rehearsal, and a maintenance scheduler. Production maintenance now has a15minute runner; Development runner still pending. Avoid treating deployed functions as proof that every V1 UI feature or operational schedule is complete.

Run `npm run dev` for Development, or `npm run dev:demo` for disposable examples. Use `npm run build` only when preparing Production, whose database/functions are now deployed. Review [DEPLOYMENT.md](DEPLOYMENT.md) before switching CLI to Production.

## Transaction revisions deployment —27September2026

Linked ref verified as kxezrgvnpoaqzcseymts. Dry-run selected only202609270004_transaction_revisions.sql; db push succeeded and fresh migration list matches all4 local/remote entries. New table/RLS/RPC installed without financial-row mutation. Earlier catalog totals16 RLS tables/26 policies predate this migration; the applied migration adds one table/policy. Authenticated hosted edit/history acceptance remains pending. Production unchanged;5 Edge Functions unchanged.

## OpenRouter deployment —27September2026

Migration202609270005 applied to Development, all5 Local/Remote entries match. ai-preview and ai-credentials deployed via API and ACTIVE v2;3 other functions remainv1. Both updated endpoints reject anonymous POST401. Legacy OpenAI keys are preserved encrypted but inactive for the free route; user must replace key through UI. No authenticated provider call or key write made during this migration. Production unchanged.

27September2026: invitation migration7 applied; all four invitation RPCs deny anonymous401/42501. Development Auth mailer_autoconfirm=false; no hosted user/invitation/provider pilot was performed.

Cloudflare administration27September2026: Wrangler OAuth login verified (scopes account/user read + Pages write); credentials encrypted with Windows Credential Manager. Pages projects list empty; no frontend deployment/project/R2 created. Fresh Development build staged locally. Supabase redirect/CORS for future Pages origin not configured yet.

Latest27September2026: PagesDevelopmentLIVE [canonical](https://masuk-saku-development.pages.dev);exactAuthredirects/EdgeCORSconfigured. All5ACTIVE:ai-confirmv2,ai-credentialsv3,ai-previewv3,attachment-uploadv3,maintenancev2. [CurrentCloudflareguide](CLOUDFLARE.md) supersedes earlier no-project/no-deployment statements. Production unchanged.

## Production deployment — 27 September 2026

Latest verified status supersedes older preparation-only entries. Production Supabase **snqkfrcxjfdjkwxjiabc** has **8/8 migrations applied** and **6 ACTIVE v1 Edge functions**. Cloudflare project **masuk-saku-production** is deployed: **95ae4223**, [Pages](https://masuk-saku-production.pages.dev), [immutable](https://95ae4223.masuk-saku-production.pages.dev). Canonical **https://masuksaku.my.id** now serves the Production app over verified HTTPS; current assets match deployment95ae4223. Development db43c019 and primary CLI link kxezrgvnpoaqzcseymts remain unchanged. No Dev data or keys copied.

Production Auth Site URL/redirect and Edge CORS use exact https://masuksaku.my.id; REST max_rows10000, Storage max10MiB. Google disabled. Resend domain Verified from user screenshot. SMTP remote enabled, host smtp.resend.com:465, sender noreply@masuksaku.my.id, display name Masuk Saku ID; username currently **masuksakuwebapp**, which must become **resend**. User is filling dashboard settings; correction requested. No SMTP password printed or requested. Delivery/signup/confirmation/username login have not been piloted.

Unique Production encryption and maintenance keys uploaded; Windows DPAPI recovery at ignored work/production-secrets/edge.recovery.dpapi.txt, restricted to the current Windows user. This recovery is user/machine-bound; independently recoverable secret-manager copy remains required before real BYOK/data. Never rotate encryption key casually. Plaintext upload/env and temporary Vault SQL removed. Production profile at ignored work/production-cli is code/config only, not a Dev secret copy. CLI2.118 config push changes declared fields only and preserved undeclared SMTP settings.

Maintenance is now scheduled **every15minutes** via pg_cron/pg_net, Vault bearer and private.enqueue_production_maintenance(). Job1 active; scheduled run at06:00UTC succeeded; manual and scheduled HTTP responses both200 with0 attachments removed/0transactions purged. No expired fixture exercised, so physical retention acceptance remains pending. See [operations SQL](../supabase/operations/production-maintenance.sql) and [setup script](../scripts/enable-production-maintenance.ps1). Important managed ACL limit: Supabase owns net objects as supabase_admin; postgres REVOKE did not remove PUBLIC table access. net is not API-exposed and no application RPC reads its queue; wrapper EXECUTE denied to anon/authenticated/service_role. Do not grant application users raw SQL access or expose net. This is an explicit operational limit, not a successful table-revoke claim. Weekly encrypted backup/restore drill is still **not active**.

Fresh Production verification: deploy wrapper build/preflight/upload succeeded; public Pages200/current assets/Production backend only/CSP/SPA/signup username/320px no overflow/no pageerrors, screenshot docs/screenshots/production-signup.png inspected. Real backend anonymous/auth/CORS/quota/resolver smokes passed without signup/email/provider/ledger writes. Deno checks all6functions and11/11shared tests passed. Earlier npm check78unit/SQL and33browser results remain separately dated; browser regression suite not rerun for this operations-only slice. Existing~656kB bundle advisory persists. No Git remote/publication; complete V1 not claimed.

Next: user fixes SMTP username, connects Cloudflare Custom domain; verify canonical and safe SMTP fields, then own-account signup/email confirmation/username login and authorized household/receipt/BYOK pilot. Activate encrypted weekly backup and rehearse restore; retain unresolved Google/R2/PDF/recurring/rollover/import/report backlog. Browser control failed Transport closed; do not extract browser/CLI credentials as a workaround.

## SMTP save follow-up —27September2026

User reports Resend Custom SMTP settings saved. Fresh explicit Production config diff confirms enabled=true, host smtp.resend.com, port465, sender noreply@masuksaku.my.id, display name Masuk Saku ID; SMTP username remains masuksakuwebapp, not required resend. Requested username correction directly in dashboard; no password/key exposed. Canonical https://masuksaku.my.id still fails DNS resolution on this check; requested Pages Custom domains association. Saving settings is not evidence of successful email delivery. Signup/email/confirmation pilot remains pending these prerequisites. Development is unchanged.

## SMTP username verified —27September2026

User changed SMTP username to resend; fresh explicit Production config diff verifies user=resend, enabled=true, host=smtp.resend.com, port465, sender=noreply@masuksaku.my.id. No password retrieved or printed. Supersedes earlier username correction pending entries. SMTP configuration fields now match Resend; actual email delivery remains untested. Canonical https://masuksaku.my.id still fails DNS resolution; next prerequisite is Cloudflare Pages masuk-saku-production → Custom domains → masuksaku.my.id, automatic DNS. Do not test signup on Development expecting Production SMTP, or claim delivery success without an authorized own-account pilot.

## User-reported Production Auth pilot —27September2026

User reports email received and username login successful after signup/confirmation at https://masuksaku.my.id. This is genuine user-session feedback, not an agent-created/mocked account or agent inspection of inbox/tokens. Marks own-account signup→SMTP/template delivery→confirmation→username login pilot passed by user report. Does not prove every email type, password recovery, two-household isolation, Google, household invitation/ledger/AI/Storage or backup/restore acceptance. Agent did not send email or access password/verification link. Next: household onboarding and personal/shared wallet pilot, then authorized financial/receipt confirmation checks; encrypted weekly backup/restore and independent encryption-key recovery remain release work.

Final generic-demo release: Production **c76a3570** at https://masuksaku.my.id and Development **33611182** at https://masuk-saku-development.pages.dev. Both wrappers passed build/preflight/upload. Hosted public checks verify matching currentJS/CSS, no personal-name string in both bundles or page copy, BCA Utama/BRI Harian preview labels and pengguna_saku signup example, no pageerrors. Production canonical320px/nooverflow/HTTPS/CSP/SPA/backend-only smoke passed; preview screenshot inspected. npm run check passed TypeScript+78unit/SQL+build;33/33browser tests passed after generic fixture ID updates. Formatting,30doclinks and48source SVG/emoji audit passed. No backend/migrations/Edge/SMTP/templates/hosted wallet or account data changed; no Deno rerun. Existing~656kB bundle advisory and operational/V1 backlog remain. These frontend releases supersede older95ae4223/db43c019 for current assets.
