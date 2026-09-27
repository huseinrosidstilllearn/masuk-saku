# Foundation execution record — 2026-09-26

Plan: IMPLEMENTATION-PLAN.md; source authority: PRD.md + latest user request.

- Source retrieval complete: agreed PRD parts1–64 archived; read_thread per-message20k truncation documented.
- Specification and native execution plan recorded before starter implementation.
- Domain/frontend implemented: integer IDR rules, separate ownership/actor/scope, demo/Supabase repository, human-confirmed entry, family/personal dashboard and exports.
- Database implemented: migrations/RLS/FK/RPC/fee/splits/tags, trash/restore/purge, audit and requester-only AI drafts.
- Server/operations implemented: five Edge Functions, AES-GCM BYOK, quota, validation, private attachments, immediate/batched deletion, encrypted backup templates.
- Documentation completed: architecture/schema/API/security/design/roadmap/acceptance/deployment/self-host operations.

Ruling: Latest user request authorizes direct foundation implementation in named folder — no repeated design approval gates needed.
Initial ruling (26 September): no Supabase credentials supplied — demo and local engine verification. See the 27 September update below for subsequent Development deployment.
Ruling: Shared balances remain family-only in personal selectors — no allocation formula was agreed; protects ownership semantics.
Ruling: V1 wallet ownership is accounting, household visibility is shared — granular per-wallet ACL is not implied by personal naming.
Ruling: Budget/goals/recurring/invite/edit/report expansions receive concrete schema/contract/roadmap — starter scope is explicit, no fake completed interactions.

Browser findings fixed: decoration glyphs removed from accessible button names; offscreen absolute hidden table header anchored to scroll container to prevent390px page overflow. Failed checks were rerun after corrections. See VERIFICATION.md for final evidence and external checks.

Scratch cleanup: recursive and then exact nonrecursive deletion were both rejected with "blocked by policy". Four task-generated files remain in ignored work/. Deliverable source, dependencies, build and documentation are complete; cleanup does not block running the starter.

## Supabase activation — 27 September 2026

The user supplied public Development/Production project keys, then explicitly chose CLI login and completed browser verification. CLI 2.118.0 linked Development, applied all three migrations, uploaded server-only secrets and deployed five functions. Fixed hosted bundling by declaring the shared import map in each function configuration. Auth origins/REST limit/Storage size were configured for local Development. Catalog check: PostgreSQL17.6,16 public RLS tables,26 public/storage policies,private receipts bucket.

Frontend modes are now explicit: dev→Development, build→Production, dev:demo/build:demo→memory demo. Playwright always starts an isolated demo server. First browser rerun collided with a concurrent build on Windows (EBUSY watching dist); the sequential rerun passed all4 tests. Domain/SQL34 and Deno3 also passed; production build/typecheck passed. Remote probes confirmed denied unauthenticated table/function access and correct CORS.

Production received local frontend configuration only. Google OAuth, hosted authenticated acceptance, user BYOK provider exercise, Cloudflare/GitHub publication and operational schedules remain pending. Details: SUPABASE-STATUS.md.

## UI/UX polish — 27 September 2026

User requested local polish; kept evergreen/Fredoka/DM Sans identity and product/domain decisions. Added SVG icon foundation, readable supporting type, refined cards/controls, desktop search entry, navigation accessibility, mobile transaction cards, loading/empty/error/success feedback, password toggle/login story layout and review-dialog refinements. API/database contracts and remote infrastructure unchanged.34 domain/database tests+6 browser tests passed; auth/layout smoke passed with no submitted account request. Design system,acceptance,verification and agent notes updated. Pilot and remaining V1 work remain outstanding.

## Lucide and responsive form/navigation — 27 September 2026

User requested sourced SVG and no emoji/emoticons. Installed exact Lucide React1.48.0, replaced icon path map and glyph action arrows, generated Wallet favicon from the package, distributed full license. Applied native fieldset grouping and clearer actor/scope copy following shadcn Field documentation. Mobile now four primary destinations plus a native secondary menu with Escape/focus restoration.8 browser tests+34 domain/database tests passed; local auth smoke passed. Notes/reference/design-system updated. No remote deployment or backend change.

## Fintech direction chosen by user — 27 September 2026

User rejected the initial polish and chose strong fintech contrast/cards/charts. Implemented new src/fintech.css visual layer,large total-balance card with four secondary metrics,rebalanced analytics and real weekly income/expense graph. Graph uses the same completed monthly wallet-filtered rows as dashboard; handles WIB boundaries,linked fee,and actual month lengths. Hidden-money mode removes graph geometry/accessibility values.37 unit/database+8 browser tests passed; auth smoke passed. Icons remain Lucide SVG,no emoji. Local only; remaining V1/hosted acceptance unchanged.

## Planning feature slice — 27 September 2026

Implemented web budget/goal editors,virtual progress capture/history/correction,goal archive/basic monthly requirement. Reused existing Supabase RLS tables and added optimistic original-field update filters plus UUID retry comparison; no migrations or remote mutation needed. Goal progress read-derived and wallet balances invariant.46 unit/SQL+11 browser tests passed; auth smoke,format/local links/SVG policy passed. Typed snapshot/export now includes notes/status/contributions. Hosted authenticated pilot,automatic rollover and advanced reports/goal insights remain pending.

##27September2026 — transaction revision

Creator/Owner editor,fee/splits atomic revision,version conflict,retry and history implemented. Fresh verification:52 unit/database+13 browser=65 tests,typecheck/build pass;3 previous Deno tests unchanged. Hosted authenticated pilot remains outstanding.

## Receipt UI —27September2026

Image capture frontend/adapters delivered;71 tests+typecheck/build pass. Hosted upload/provider/confirmation remains pending. Backend unchanged; local source updated in requested D: folder.

## OpenRouter —27September2026

Free-only BYOK provider deployed Development,79 tests/checks pass. No live-provider pilot; user key through UI required. R2 remains proposed only.

27September invitation slice: Owner create/list/revoke UI and email-bound join onboarding implemented; Development migration7 deployed.66 unit/SQL+20 browser tests, TypeScript/build pass. Hosted two-account/AI/Storage pilot pending; guide provided.

27September Cloudflare slice: Development frontend live, exact Auth/CORS configured, malformed multipart400fix deployed, CSP font self/data fixed. Canonical HTTPS/login/signup/SPA/320px smoke passes; anonymous Edge401and foreignorigin403. Production/R2/Google/backup-maintenance/realaccount-provider pilot pending.

## Production deployment — 27 September 2026

Latest verified status supersedes older preparation-only entries. Production Supabase **snqkfrcxjfdjkwxjiabc** has **8/8 migrations applied** and **6 ACTIVE v1 Edge functions**. Cloudflare project **masuk-saku-production** is deployed: **95ae4223**, [Pages](https://masuk-saku-production.pages.dev), [immutable](https://95ae4223.masuk-saku-production.pages.dev). Canonical **https://masuksaku.my.id** now serves the Production app over verified HTTPS; current assets match deployment95ae4223. Development db43c019 and primary CLI link kxezrgvnpoaqzcseymts remain unchanged. No Dev data or keys copied.

Production Auth Site URL/redirect and Edge CORS use exact https://masuksaku.my.id; REST max_rows10000, Storage max10MiB. Google disabled. Resend domain Verified from user screenshot. SMTP remote enabled, host smtp.resend.com:465, sender noreply@masuksaku.my.id, display name Masuk Saku ID; username currently **masuksakuwebapp**, which must become **resend**. User is filling dashboard settings; correction requested. No SMTP password printed or requested. Delivery/signup/confirmation/username login have not been piloted.

Unique Production encryption and maintenance keys uploaded; Windows DPAPI recovery at ignored work/production-secrets/edge.recovery.dpapi.txt, restricted to the current Windows user. This recovery is user/machine-bound; independently recoverable secret-manager copy remains required before real BYOK/data. Never rotate encryption key casually. Plaintext upload/env and temporary Vault SQL removed. Production profile at ignored work/production-cli is code/config only, not a Dev secret copy. CLI2.118 config push changes declared fields only and preserved undeclared SMTP settings.

Maintenance is now scheduled **every15minutes** via pg_cron/pg_net, Vault bearer and private.enqueue_production_maintenance(). Job1 active; scheduled run at06:00UTC succeeded; manual and scheduled HTTP responses both200 with0 attachments removed/0transactions purged. No expired fixture exercised, so physical retention acceptance remains pending. See [operations SQL](../supabase/operations/production-maintenance.sql) and [setup script](../scripts/enable-production-maintenance.ps1). Important managed ACL limit: Supabase owns net objects as supabase_admin; postgres REVOKE did not remove PUBLIC table access. net is not API-exposed and no application RPC reads its queue; wrapper EXECUTE denied to anon/authenticated/service_role. Do not grant application users raw SQL access or expose net. This is an explicit operational limit, not a successful table-revoke claim. Weekly encrypted backup/restore drill is still **not active**.

Fresh Production verification: deploy wrapper build/preflight/upload succeeded; public Pages200/current assets/Production backend only/CSP/SPA/signup username/320px no overflow/no pageerrors, screenshot docs/screenshots/production-signup.png inspected. Real backend anonymous/auth/CORS/quota/resolver smokes passed without signup/email/provider/ledger writes. Deno checks all6functions and11/11shared tests passed. Earlier npm check78unit/SQL and33browser results remain separately dated; browser regression suite not rerun for this operations-only slice. Existing~656kB bundle advisory persists. No Git remote/publication; complete V1 not claimed.

Next: user fixes SMTP username, connects Cloudflare Custom domain; verify canonical and safe SMTP fields, then own-account signup/email confirmation/username login and authorized household/receipt/BYOK pilot. Activate encrypted weekly backup and rehearse restore; retain unresolved Google/R2/PDF/recurring/rollover/import/report backlog. Browser control failed Transport closed; do not extract browser/CLI credentials as a workaround.
