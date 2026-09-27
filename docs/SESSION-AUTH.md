# Login and inactivity locking

Auth remains Supabase email/password or username+password; username login delegates password verification to Supabase Auth. This document does not enable Google or change credentials/database/SMTP.

A successful SIGNED_IN for a newly authenticated user starts a fresh browser activity timestamp before App sets that user. SIGNED_OUT clears that user's activity key. INITIAL_SESSION restores the stored inactivity state; repeated same-user SIGNED_IN revalidation does not reset it. Existing configured idle locking (default15minutes) still signs out locally and clears sensitive UI.

27September2026: an old `masuk-saku:last-activity:<user-id>` timestamp survived unauthenticated login and caused an immediate lock after login success. Reproduced against the Development frontend with every backend request intercepted: mock login accepted,1logout request, returned to welcome. Fix is confined to App's Auth event listener, not animation/dropdown CSS or backend configuration.

`npm run test:auth -- --workers=1` uses playwright.auth.config.ts, configured Vite at5177, a fake backend URL/key and intercepted Auth/REST requests. Four regressions verify fresh username/email login survives stale activity, expired restored sessions still lock, and same-user revalidation does not extend activity. No signup/email/account/ledger/provider writes. Fixtures prove frontend state transitions with the real Supabase SDK; they do not claim successful real credentials or hosted financial integration.
