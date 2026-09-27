# Verification evidence

The application has unit/domain and embedded PostgreSQL RLS/RPC tests, demo Playwright regressions, configured-mode Auth/AI tests with intercepted network, and Deno Edge validation tests. See package scripts and CI workflow for reproducible commands. Historical local screenshots and private deployment notes are intentionally excluded from public source.

Last hosted release before current recovery/BYOK work passed78unit/SQL,41demo browser and5configured browser tests. Current BYOK SQL37tests and configured9tests have passed; full current release checks are still in progress. These fixture checks do not prove real email/provider/physical camera delivery or managed database restore.

Release gates remain in ACCEPTANCE.md and AGENT-HANDOFF.md. Production signup/email/username login was confirmed by the user. Backup/restore, Google and authenticated household/financial/AI/Storage pilot remain pending. Record exact check results and deployment identifiers at every promotion.

Release-work checks: full81unit/domain/SQL+typecheck/build;43/43demo browser;11/11configured Auth/BYOK/camera including same-document recovery fix. Additional PKCE Site URL fallback test is being verified separately. Shared11Deno and all6function checks pass. Public repo c18bd0b then59e7651; GitHub CI run36318489275 succeeded. Initial CI40/41pending-camera Escape failed intermittently; subsequent CI and Chrome153five-repeat probe passed with keydown/cancel events. Root cause is not established; diagnostic coverage remains, no speculative product fix. Dev16791078 hosted hash smoke found same-document recovery bug, now fixed locally and awaiting redeploy. Production unchangede2da5fd5. No real email/account/provider/ledger write performed.
