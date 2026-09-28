# Agent handoff — current release

## Demo alignment published — 28 September 2026

Latest app **de37056**: Development **1671b142**, Production **0c3a7e68**. Scope dropdown and balance/reset buttons in the public demo are aligned: label margins removed, all controls at least 44px high, selector specificity matches the shared native-select styling. At 320/390px controls wrap with 12px gaps; at 768/1440px both top and bottom edges align within one pixel. Local and hosted geometry checks passed in both environments; screenshot reviewed. Hosted demo asset hashes, transaction/idle/reload reset, zero Supabase writes, no overflow/page errors passed in both environments. Backend remains 17 migrations/six functions; no data/Auth/secret changes.

Local 97 unit/domain/SQL, 50 demo browser, 20 configured auth, build/typecheck/format passed during this correction. Final selector correction was checked with the four-width geometry pilot and npm check; CI verifies the final published source separately. Next launch work remains isolated database+Storage restore and recovery keys, valid-key AI/physical camera, then family pilot on two physical devices; these are not completed by this layout fix.

Final source CI **36421497985** passed on de37056, including all 97 unit/domain/SQL, 50 demo browser, 20 configured auth tests, 11 Deno tests/all six Edge checks, five backup tests, typecheck/build/format and source guard.

## Public demo toolbar alignment — 28 September 2026

The public demo's scope label inherited 14px vertical form margins. Flex alignment used the label's margin box, putting the adjacent balance button below the dropdown. The demo toolbar now resets that label margin and gives both dropdown/buttons a 44px minimum height. Desktop controls align; narrow screens wrap with the existing 12px gap. This is a CSS-only demo correction; no financial/auth/backend behavior changed. Final deployment and hosted geometry evidence are recorded in the later publication entry.

## Production promotion — 28 September 2026

User authorized all Development updates to Production. **Production 3de0d4a3** at https://masuksaku.my.id now runs app **7726159** (deployment checkout 9132d30), all **17 migrations** and **six ACTIVE v3 Edge functions**. Development remains 365f1032/17 migrations; primary CLI still Development. Production SMTP/Auth/encryption/maintenance keys were preserved; no Development data or credentials copied.

Pre-migration encrypted database+Storage backup **36401935020** passed, including Google Drive upload/checksum. Migration dry-run is now up-to-date. Ledger/wallet metadata/balance fingerprints match before migration and after fixture cleanup. Single Production maintenance cron remains every 15 minutes, 110 successful dispatches; authenticated updated handler returned all four zero counters. Six realtime tables are published.

Production canonical/current assets/public routes/demo reset, actual two-session financial UI, real-JWT permission/import/private Storage tests, PDF and delayed-join realtime replay passed; all fixtures cleaned. Source CI 36393287315 passed. See [Production release](PRODUCTION.md), [hosted QA](QA-HOSTED.md) and [verification](VERIFICATION.md). Valid-key AI/physical camera/devices, isolated restore/key recovery copies, and clean self-host remain acceptance gates. Historical entries saying Production is unchanged are superseded by this promotion.

## Hosted QA and realtime fix — 28 September 2026

Latest application commit: **7726159**. Development deployment: **365f1032**. Real hosted testing found and fixed stale Member balances when a transaction committed before realtime replication joined. The five-second delayed-join replay now passes without a transaction event or manual reload; the final full two-session financial UI pilot also passed. See [hosted QA report](QA-HOSTED.md) for the exact flows, financial sequence, cleanup, and remaining limits.

Fresh local checks passed 97 unit/domain/SQL, 50 demo browser, 20 configured auth, typecheck/build/format. Hosted public/account routes and demo reset match the final assets. Fixtures were cleaned. Production remains frontend 64f9f8a6 and migrations 1–11; backend Development remains migrations 1–17/six functions. Valid-key AI, physical camera/devices, isolated restore, recovery key copies, and clean self-host installation remain acceptance gates.

GitHub CI 36393287315 passed on 7726159, including all browser suites, 11 Deno tests, checks of all six Edge functions and five backup-script tests. The older pending-deployment checkpoint below is historical; the hosted results above supersede it.

## Realtime catch-up fix — 28 September 2026

Hosted two-session testing exposed a race: a transaction committed before the Member's replication subscription joined never produced a change event for that session. Delaying the real WebSocket join by five seconds reproduced the stale balance reliably. The frontend now waits for PostgreSQL subscription readiness and refreshes on successful subscription, replication readiness and reconnection. Cleanup ignores late callbacks from old channels; existing event debouncing and focus refresh remain.

Two regression tests failed against the previous behavior and pass with the fix. Fresh local verification passed 97 unit/domain/SQL, 50 demo browser and 20 configured auth tests, typecheck/build/format. Development deployment and post-fix hosted replay are pending at this source checkpoint. Production is unchanged. Do not infer launch acceptance from local checks; the later hosted QA entry records the actual deployment and results.

## V1 Development — verified 28 September 2026

Latest application commit: ea852b4. Development deployment: 73c75aeb at https://masuk-saku-development.pages.dev/. Backend: migrations 1–17, six Edge functions, maintenance every 15 minutes. The scheduler is active and has 27 successful dispatch records; an authenticated direct maintenance call returned all four counters. Production remains at frontend 64f9f8a6 and migrations 1–11.

All feature domains are implemented. Read [V1 feature guide](V1-FEATURES.md) for workflows, approval boundaries, retention and import limits. This is implementation completion in Development, not a launch acceptance declaration.

Verification: 95 unit/domain/SQL tests (including 44 PostgreSQL tests), 50 demo browser tests, 20 configured auth tests, 11 Deno tests and checks of all six functions, five backup-script tests, typecheck/build/format. GitHub CI 36389715106 passed on ea852b4; earlier CI 36388554696 passed on the feature commit fee6db8. Staged source guard, Gitleaks and diff check passed before each source publication. The follow-up documentation commit does not change that application artifact.

Hosted public routes and asset hashes match the final build. Demo transaction, idle and reload reset made zero Supabase writes. Real synthetic login navigated primary, recurring, draft and activity menus at 320/768/1440 pixels without overflow or runtime errors. Local PDF conversion passed under deployed CSP; the mobile sign-out SVG is visible. The 320px recurring screenshot was inspected. Synthetic users, households and objects were cleaned. These checks do not replace a real family/provider/physical-camera pilot.

Production backup runs 36388615213 and 36388892689 succeeded. Each encrypted database dump and separate Storage archive was uploaded to Google Drive and checksum checked; artifacts retain ciphertext for 90 days. The first inventory was empty; the second covered one synthetic private image byte, then the exact test object was removed. No financial records changed. This proves the byte-backup path, not decryption or a full isolated restore.

Remaining launch gates: real family/two-device and OpenRouter/physical-camera pilot; independent age/server-key recovery copies; isolated database plus Storage restore; clean self-host install. Production promotion remains separate. Never label V1 launch-ready until these gates are recorded.

## V1 feature completion — 28 September 2026

Wallet lifecycle, recurring transactions, budget closure/rollover, JSON import, paginated snapshots, local PDF receipt conversion, requester draft recovery/discard, private attachment viewing, dashboard preferences, command search, activity and realtime refresh are implemented. Read [feature guide](V1-FEATURES.md) for usage, constraints and distinctions between ledger, automation, import and restore.

Development now has migrations12–17 and the updated maintenance Edge function. Existing maintenance bearer was preserved; Vault/cron every15minutes is configured. Authenticated maintenance returned the four result counters successfully. Production remains at frontend64f9f8a6 and migrations1–11; no promotion is implied by source publication.

Local checks recorded before this handoff:95 unit/domain/SQL including44 PostgreSQL tests,50 demo browser,20 configured auth browser,11 shared Deno tests/all6 function checks,5 backup-script tests, typecheck/build/format. Final rerun passed95 unit/domain/SQL,50 browser and20 configured auth,11 Deno tests/all6checks,5backup tests and build/typecheck/format. One overloaded concurrent run hit the PGlite hook timeout and a5-second PDF assertion; limiting Vitest to2workers and matching the PDF operation20-second deadline produced a complete passing rerun. Hosted synthetic Owner/Member/outsider JWT checks covered invitations, transfer/fee and actor authorization, recurring confirm/retry/revoked creator, frozen budget rollover, draft discard, private Storage access and import append/retry. Synthetic accounts, household and objects were cleaned. These checks do not claim a physical-camera/provider/inbox/two-device pilot.

The weekly workflow now includes separately encrypted Storage bytes and PostgreSQL dump. Production Storage backup secrets are configured in GitHub; combined runs36388615213/36388892689 now passed; see latest publication evidence. Isolated full restore, independent age/server-key recovery copies, actual OpenRouter/physical-camera/family pilot and clean self-host install remain release gates. Do not label the project launch-ready while these are outstanding.

## Public demo entry clarity — 28 September 2026

The signed-out hero button now says `Coba demo tanpa daftar`; the supporting copy states that example data resets after 15 idle minutes and real transactions remain human-confirmed. The demo CTA keeps its coral fill and rotating glow but uses a deeper, quieter shade and smaller shadow so primary signup stays visually dominant. Hero bottom spacing is shorter before the dashboard preview on desktop and phone. Demo route, idle reset, backend isolation, auth and production behavior are unchanged. Development deployment `6a005ed6` at `https://masuk-saku-development.pages.dev/` is verified: 84 unit/SQL, 45 demo-mode browser, 20 configured auth tests, typecheck/build/format passed. Local and hosted 320/390/768/1440 layout checks showed no overflow, correct CTA order and reduced-motion stop. Hosted demo confirmed local-only transaction, idle and reload reset, zero Supabase writes and zero page errors. Screenshot at 390px reviewed. Production remains unchanged.

## Centered landing hero and demo CTA — 28 September 2026

Signed-out hero content is centered at phone, tablet and desktop widths. The primary signup button and smaller demo button now form a vertical action stack. After visual feedback, the demo CTA uses a coral-red fill and peach/gold rotating conic-gradient border glow to match the primary coral-orange button. `prefers-reduced-motion` stops the loop, and focus remains visibly outlined. This is a public landing presentation change only: account routing, demo isolation, financial behavior and production remain unchanged. Development deployment `9148312c` at `https://masuk-saku-development.pages.dev/` contains the color correction. Verification passed: 84 unit/SQL, 45 demo-mode browser, 20 configured auth tests, typecheck/build/format. Local and hosted 320/390/768/1440 checks confirmed matching button color, center alignment, action order, smaller demo CTA, no overflow/page errors and reduced-motion stop; screenshot at 390px reviewed. Production remains at the previous deployment.

## Public interactive demo — 28 September 2026

Latest demo retention: purely in-memory as before, plus an automatic reset after 15 minutes without pointer/keyboard/input activity. Returning to a backgrounded tab checks elapsed idle time immediately. Reset closes any draft, restores initial data and family scope, unmasks only example data, returns to Dashboard and shows a notice. Reload/leaving still resets; no browser persistence or backend writes.

Latest Development deployment: `e5de61b1` at `https://masuk-saku-development.pages.dev/demo`. Verification: 84 unit/SQL, 45 browser demo-mode, 20 configured auth tests, typecheck/build/format, public-source guard, staged Gitleaks and diff check passed. Hosted 320px smoke confirmed current assets, example transaction, 15-minute idle reset, reload reset, zero Supabase writes, zero page errors and no horizontal overflow. Production was not updated for this change.

Signed-out landing has hero and preview CTAs into `/demo`. This is an isolated in-memory snapshot of generic demo data, even when the hosted frontend is configured for Supabase. Visitors can switch family/member ownership scope, mask balances, inspect wallet/transaction/budget tabs, and use the real TransactionForm for a local example income/expense/transfer that updates balances/chart/rows only after confirmation. Reset/reload/leaving restores the initial snapshot; none of these actions call financial RPCs, read a user account, persist data or configure AI. The page clearly distinguishes example data from real accounts and notes that AI/camera require signup. No backend/migration/provider changes. Production remains unchanged until separately promoted.

Development deployment 4560589c. Production remains 64f9f8a6, DB11 migrations/6 Edge unchanged. Fresh checks: 84 unit/SQL, 45 demo browser, 19 configured auth, typecheck/build/format passed. Dedicated configured test covers preview confirmation, member scope, local money change, no Supabase writes, reset on reload and immediate masking. Local public demo screenshots and navigation at 320/768/1440 inspected/no overflow. Hosted anonymous smoke checks remain separate from actual account/finance/AI pilot.

## Expanded public introduction — 28 September 2026

Signed-out landing page now includes six feature explanations, three onboarding steps, clear no-bank-sync and AI-human-confirmation copy, expanded FAQ, a self-host comparison and final signup CTA. Self-host content links the public GitHub repository and deployment guide. It explicitly warns that cloning source alone does not separate data; operators must set up their own Supabase project, schema/Edge functions, Storage/Auth and frontend/deployment configuration. This does not claim an automatic one-click self-host path. Existing demo preview remains generic. No auth/financial/backend behavior changed.

Development deployment 76b0ae42. Production remains 64f9f8a6. Fresh checks: 84 unit/SQL, 45 demo browser, 18 configured auth, typecheck/build/format passed. Twelve section screenshots at 320/768/1440 inspected (mobile self-host and desktop guide visually reviewed), no overflow, 6 features, 3 steps, GitHub link and final signup CTA verified. Hosted public landing/source/deployment smoke is separate from authenticated finance and self-host pilot.

## Separate public account pages — 28 September 2026

For signed-out visitors, `/` is the introduction/landing page only; `/masuk` is login and `/daftar` is registration. Landing CTAs navigate to these routes rather than scrolling to an embedded form. Account pages have their own brand/home header and document titles. SPA fallback supports direct links and refresh; popstate handles browser back/forward. Password/display state is cleared when changing account pages. Existing authenticated Dashboard behavior, Google redirect to origin, email confirmation and PKCE recovery remain; finishing recovery returns to `/masuk`. No provider settings or backend migrations changed.

Development cd19e455 contains this change and the family dashboard. Production remains 64f9f8a6. Fresh checks: 84 unit/SQL, 45 demo browser and 18 configured auth tests, typecheck/build/format passed. Screenshots of landing/login/signup at 320/768/1440 reviewed; header height adapts on narrow screens, home links work and no horizontal overflow. Hosted public route checks are separate from real-account login/provider pilots.

## Dashboard keluarga — 28 September 2026

Approved addition: Dashboard now shows a Keuangan keluarga panel immediately after the main overview. Each member has a recorded balance based on their active personal wallets; shared wallets are a separate card and counted once. Existing balance masking covers every amount. Member cards select the existing personal dashboard scope, while the shared card returns to the combined family scope. Inactive members retain a clearly marked historical balance.

Owner's Tambah anggota opens the existing email-bound invitation dialog directly; the one-shot request is consumed so normal later Settings visits do not reopen it. Kelola anggota opens Settings. Existing invitation RPCs, verified-email onboarding, RLS, financial writes and private profile visibility are unchanged. No bank synchronization or automatic invitation email was added. Hosted two-account invitation/finance pilot remains a separate acceptance step.

Development deployment: 756e1c2b. Production remains 64f9f8a6; database/Edge unchanged at 11 migrations/6 functions. Fresh checks: 84 unit/SQL, 45 demo browser and 16 configured auth tests, typecheck/build/format passed. Local screenshots at 320/768/1440 reviewed with no page overflow. Earlier network-suspended failures did not recur; the old mobile layout assertion now checks that secondary destinations remain below the overview without requiring immediate adjacency.

Read AGENTS.md, PRD.md, TECHNICAL-SPEC.md, ACCEPTANCE.md and the latest private NOTES.md if present. This browser-only application is online, version0.1.0 toward V1; do not claim every release criterion complete.

## Environments — 27 September 2026

Production64f9f8a6 at https://masuksaku.my.id and Development58458d65 contain application source through68dad2b. Both have11migrations; Production6EdgeFunctions freshly redeployed. Primary CLI link stays Development; use explicit Production ref and isolated profile. No Dev data/keys copied; no SMTP or encryption-key changes.

## Product and implementation

React/TypeScript/Vite on Cloudflare Pages, Supabase Auth/PostgreSQL/RLS/private Storage/Deno Edge. IDR integer money, WIB24h, wallet owner/actor/scope/creator distinct. Financial writes through authorized RPC; AI drafts require human confirmation. OpenRouter BYOK free-only, keys encrypted server-side; endpoint fixed, no arbitrary provider URL.

Current work includes password recovery/PKCE separation, inactivity lock fixes, own-user AI credential status/replace/revoke, transaction filters/25-row UI pagination and period reports, Owner membership deactivation/fresh verified-email rejoin, private profiles and avatars2MiB. Active member nicknames synchronize without changing financial IDs. Creator/Owner trash30days; Owner restore.

Profile order: photo → username → personal details. Username separate save uses account RPCs. Only nickname shared; other fields/photo private even from household Owner. Photo removal/replacement staged until Save; cleanup after commit, ambiguous transport failures retain candidates. Mobile avatar40px, AI settings shortcut, readonly endpoint, centred footer and spacing at320/768/1440. User examples generic; SVG icons only.

## Verification

Latest Development checks:84unit/SQL,44demo,16configured browser, typecheck/build/format passed. Last mobile household wrapping change additionally passed visual audit/nooverflow at all3widths and production build. Fresh promotion: Deno11tests/all6checks, migration dry-run up-to-date, canonical/Pages current assets/Production backend only/HTTPS/CSP/SPA/320px signup/no pageerrors. Backend negative Auth/resolver/quota/CORS checks passed. User previously reported real Production signup/email/username login success; current hosted finance/profile/AI pilots remain unverified.

Commands: npm run check; npm run test:e2e -- --workers=2; npm run test:auth -- --workers=2; npm run format:check. SQL uses PGlite scaffolding; browser configured tests use fake backend. See PROFILE.md, SESSION-AUTH.md, PRODUCTION.md and PROJECT-IDENTITY.md.

## Backup and remaining work

Weekly age-encrypted database backup to Drive/GitHub artifact is active. Pre-promotion run36332334635 succeeded; earlier36327110585 also succeeded and encrypted artifact/Drive ciphertext matched. Database dump excludes Storage file bytes. Operator entered database password locally; never read or echo secrets. Current explicit operator preference is to retain their configured password; do not infer permission to rotate.

Independent age/server recovery copy, durable Google OAuth audience, isolated restore rehearsal and Storage object backup remain gates. Earlier local decrypt/cleanup command was rejected by policy; no decryption or restore success claimed. Private OAuth/config/recovery files remain ignored.

Other V1 work: Google provider, real multiaccount/financial/AI/physical-camera/retention pilot, wallet lifecycle, recurring runner, deterministic rollover, import/restore and server report pagination/presets per roadmap. Public source contains no private notes, tokens, financial data or screenshots. README/identity/GitHub description now describe actual capabilities and limits.

Brand assets: operator-supplied README cover atdocs/assets/readme-cover.png and faviconPNG/ICO/Apple/192/512 installed. index.html references them; manifest displaybrowser(noSW/PWA). Original suppliedSVG~9.75MB not shipped; referenced96PNG12.5KB. README cover first, badges and Mermaid architecture; source suppliedfiles remain outside checkout.

Google login setup: public Auth settings confirm external.google=false in BOTH environments. User has no Web OAuth client and requests guidance; Desktop Drive OAuth is separate and was not reused/read. See GOOGLE-LOGIN.md for exact origins/callbacks and operator dashboard secret entry. No provider/config/frontend changes yet; real Google login remains pending.

LatestGoogleactivation28September: operatorreportssetupdone; publicsettingsgoogletruebothenvironments, authorize302toGoogleandcallbackmatchesprojectverified. NoOAuthsecret/clientDriveconfigread or providerchangesbyagent. OlderGoogle-disabled/pendingconfigentriesarehistorical; realaccountsessionpilotnotindependentlyobserved. READMEeditorialrewritependingendofemailbrandingslice.

28Septemberemailbranding/README: user explicitly chose no additional cost and logo inside the email only. LogoaddedINSIDE13Authemailsandemail-onlyconfigpushedProduction; NOTGmailavatar. NoBIMIcert/DNSpurchase/change.26templateviewports/actions/OTP andPNG320/800auditpassed; noemailsent. Googlepreservedtruebothafterpush. READMErewrittenbenefitsfirst/gettingstarted/plainIndonesian/technicaldetailslater,cover/badges/diagramretained.
