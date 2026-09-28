# Verification evidence

## Demo toolbar alignment — 28 September 2026

App **de37056** is deployed to Development **1671b142** and Production **0c3a7e68**. Hosted geometry at 320/390/768/1440 verified zero label margin, touch controls at least 44px, matching dropdown/button top and bottom edges when on the same row, wrapping without horizontal overflow at narrow widths, and no browser errors. Final toolbar screenshot was inspected. Both public demo smokes matched current build hashes and passed local-only edits, idle/reload reset and zero Supabase writes. No backend or financial changes.

Local checks during correction passed 97 unit/domain/SQL, 50 demo browser, 20 configured auth, typecheck/build/format. Final shared-select specificity correction passed the four-width pilot and npm check; CI runs the full suite on the final commit.

Final source [CI 36421497985](https://github.com/huseinrosidstilllearn/masuk-saku/actions/runs/36421497985) passed on de37056: 97 unit/domain/SQL, 50 demo browser, 20 configured auth, 11 Deno/all six Edge checks, five backup tests, typecheck/build/format/source guard.

## Production promotion — 28 September 2026

Production **3de0d4a3** on https://masuksaku.my.id contains app **7726159** (checkout 9132d30). Backup [36401935020](https://github.com/huseinrosidstilllearn/masuk-saku/actions/runs/36401935020) succeeded before six append-only migrations; all 17 now applied, fresh dry-run up-to-date. All six Edge functions are ACTIVE v3. Existing single 15-minute Production cron and secret were preserved; six realtime tables are published. Authenticated maintenance returned four zero counters. Production ledger/wallet/balance fingerprints remained unchanged through migration and synthetic pilot cleanup.

Fresh hosted Production public/account/demo checks matched build hashes and confirmed no demo backend writes. Real-JWT/API and complete two-session financial UI pilots passed login, invitation/permissions, income/expense/transfer fee, trash/restore, recurring/retry, budget rollover, import RPC, requester draft lifecycle, private attachment access, local PDF and missing/invalid BYOK rejection without ledger writes. Five-second delayed realtime join replay also passed; fixtures cleaned. Layout 320/768/1440: no overflow/page errors. Email and Google providers remain enabled; HTTPS/CSP/camera policy and exact CORS checks passed. Inbox/Google consent, valid AI inference, physical hardware and isolated restore were not claimed.

No application code changed for promotion: prior [source CI 36393287315](https://github.com/huseinrosidstilllearn/masuk-saku/actions/runs/36393287315) verifies 97 unit/domain/SQL, 50 demo browser, 20 configured auth, 11 Deno/all six Edge checks, five backup-script tests, typecheck/build/format. See [Production](PRODUCTION.md) and [QA report](QA-HOSTED.md) for scope and remaining acceptance.

## Hosted QA and realtime fix — 28 September 2026

Application **7726159**, Development deployment **365f1032**: 97 unit/domain/SQL, 50 demo browser, 20 configured auth, typecheck/build/format passed locally. Source guard, staged Gitleaks and diff check passed. Two regression tests were red before the subscription catch-up fix and green afterward.

GitHub CI [36393287315](https://github.com/huseinrosidstilllearn/masuk-saku/actions/runs/36393287315) passed on application commit 7726159, including the browser suites, 11 Deno tests, all six Edge function checks and five backup-script tests.

Hosted delayed-join replay and full real-JWT two-session UI pilot passed on this artifact. Public/account route and demo reset checks match its asset hashes. Accounts, household data and private objects used for QA were cleaned. Read [hosted QA report](QA-HOSTED.md) for the reproduced bug, cash totals, tested API/UI flows and limitations. Production was not promoted.

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
