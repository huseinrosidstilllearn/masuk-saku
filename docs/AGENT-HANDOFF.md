# Agent handoff — current release

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
