# Verification evidence

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

The application has unit/domain and embedded PostgreSQL RLS/RPC tests, demo Playwright regressions, configured-mode Auth/AI tests with intercepted network, and Deno Edge validation tests. See package scripts and CI workflow for reproducible commands. Historical local screenshots and private deployment notes are intentionally excluded from public source.

Current membership slice passed82unit/domain/SQL (38SQL),43demo browser and13configured browser tests, plus typecheck/build/format. These fixture checks do not prove real email/provider/physical camera delivery or managed database restore.

Release gates remain in ACCEPTANCE.md and AGENT-HANDOFF.md. Production signup/email/username login was confirmed by the user. Backup/restore, Google and authenticated household/financial/AI/Storage pilot remain pending. Record exact check results and deployment identifiers at every promotion.

Recovery configured tests cover explicit hash and Site URL fallback PKCE, stale-idle reset, no finance reads and cancellation; real inbox pilot pending. Membership tests cover last Owner protection, revoked-member read/write/BYOK denial, unfiltered own-contribution DELETE denial, history/balance preservation, inactive actor restriction, administrative restore and fresh verified re-invitation. UI covers confirmation/cancel/failure/retry. Initial11-page pagination browser test timed out at30s under parallel load;60s total sequence budget with unchanged per-assertion deadlines passed the final43-test run. No product pagination bug inferred.

Development3ddacc67 deploy wrapper/preflight passed after migration10. Hosted public recovery/no-session/320px/assets match/Dev-only backend and anonymous BYOK/membership RPC denial passed without real email/account/provider/financial writes. Production remains e2da5fd5/8migrations. Earlier public CI36319807206 succeeded at2529831; latest membership CI must be verified after publication. Shared11Deno and all6function checks passed previously; no Edge source changed in this slice. Initial earlier CI40/41pending-camera Escape failed intermittently; subsequent CI and Chrome153five-repeat probe passed with keydown/cancel events. Cause unconfirmed, diagnostics retained.
