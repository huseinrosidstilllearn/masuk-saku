# Security notes

## Trust boundaries

Browser data, receipt contents and AI output are untrusted. Provider cannot call ledger RPCs and receives only capture text/image plus member-visible wallet/category names/IDs. It does not receive full financial history or other members' credentials. getUser verifies session server-side before service-role use; RLS protects client SELECT. All financial DML uses authenticated RPC with membership and composite tenant-FK checks. Owner role comes from household_members, never user metadata.

## Secrets and identity

Frontend variables only public Supabase URL/key. Auth session is sessionStorage for OAuth PKCE, never an AI key; sign-out locks after configurable inactivity default 15 minutes. Keys entered in UI are transient input state, immediately cleared after submission. AES-256-GCM ciphertext lives private schema, with random nonce and tenant/user-associated data. AI_ENCRYPTION_KEY lives Edge secret storage, not database. MAINTENANCE_SECRET is separate minimum 32-char bearer secret. Database connection credentials exist only backup runner environment. Do not log request bodies, provider keys, connection URLs or receipt data.

Back up the server encryption key separately in a secret manager. Rotation changes key version and requires decrypt/re-encrypt in privileged migration; current implementation version1 does not silently support multiple keys. BYOK is per-member per-household; Owner cannot read/use spouse's key. Current-user credential status/replace/revoke UX and migration9 are implemented; status never returns ciphertext/IV/key. Provider-token validation/rotation remain roadmap work; revocation in the app does not revoke the provider token. See BYOK-LIFECYCLE.md.

## Authorization

Creator is auth.uid(), actor can be another same-household member. Delete only creator/Owner; restore Owner; permanent delete service after 30d. Linked fees follow parent. Ledger UPDATE/DELETE, draft INSERT and ciphertext SELECT denied to authenticated. RLS on all public tables; balance view security_invoker; function search_path empty. No direct SQL access is a security boundary against database admins or service-role holders; isolate these credentials.

## Financial safety

IDR whole integers, safe JS limits and SQL bigint constraints; split totals exact; transfer destination distinct. Request key+payload+creator prevents retry duplication/reuse. Low critical AI confidence/missing amount/wallet/date/type requires explicit field acknowledgement; every preview still has explicit confirmation. Budget excess warns but never rejects a valid financial event. Virtual goals do not touch ledger.

## Files and lifecycle

Private bucket, max10MiB, MIME allowlist + signature verification, randomized object names. Unconfirmed files expire24h; confirmed retention starts at commit. Immediate mode normal ai-confirm path removes object after commit; failures set cleanup_pending and maintenance retries. 24h/7d/keep use expiration metadata. No permanent-public receipt URLs; use authenticated downloads. Signed URLs are bearer tokens and can outlive metadata expiry until underlying object is deleted, so avoid them or keep expiry very short. Retention physical deletion depends on scheduler health. Removal first deletes Storage then updates metadata; failed removal is retryable. Receipt payload/image bytes never in activity audit.

Expired transactions and fee rows purged at30d; audit keeps entity IDs/action/time without financial payload. Backups can contain historical deleted rows until90d artifact expiry, so production privacy documentation must disclose that separate lifecycle. Provider retention follows user's provider agreement/configuration; deleting local files does not delete third-party provider records. No confidential real data used in demo/tests/screenshots.

## Network and presentation

Allowlisted CORS origins, bounded streaming request bodies, AI fixed host, Zod request/output validation, provider timeout25s, quota30/hour. CSP, frame-ancestors, nosniff and referrer policy in public/_headers. CSP connect-src must be adjusted for self-host backend hostname. No analytics or service-worker financial cache. CSV formula escaping is implemented. React escapes text; no raw HTML rendering. Visible keyboard focus, hidden-balance masking and modal confirmation.

## Before production

Verify hosted RLS/Auth/Storage endpoint tests with two separate users and two households; configure provider redirects/email confirmation/password recovery; schedule cleanup and weekly backup; rehearse decrypt/restore. PGlite covers database semantics, not hosted Auth/Storage behavior. CI has no secrets on pull requests. Restrict repository operator access and review dependency updates. Financial snapshot JSON is a download, not an encrypted full-system backup. Review Supabase [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [private Storage](https://supabase.com/docs/guides/storage/serving/downloads) and [Edge Auth](https://supabase.com/docs/guides/functions/auth).

## Planning access

Budgets/goals are collaborative household planning data: authenticated Member/Owner INSERT/UPDATE under existing member_write RLS, with tenant composite references. Contributions require real auth.uid() as creator, and only creator/Owner may DELETE. They cannot UPDATE contributions. Browser planning adapter never uses service-role or AI keys and cannot directly mutate the ledger. UUID retry comparison and atomic original-field filters prevent ordinary duplicate records/lost edits; full hosted PostgREST acceptance remains separate from SQL/local browser tests. Editing or archiving a goal cannot rewrite its derived saved amount. Removal of a virtual progress note is a confirmed correction, not deletion of a money transaction.

## Transaction revision boundary

revise_transaction enforces live membership plus creator/Owner, independently of actor/wallet owner. Row lock+expected version prevents concurrent overwrite; stable request key binds requester,transaction,original version and exact payload. Cross-tenant references remain composite FK protected. Splits,fee,parent and full revision snapshot are one database transaction. Readable history is restricted to creator/Owner; anonymous/direct writes are denied. Full snapshots cascade with permanent parent purge; identifier-only activity log stays separate. Browser history obeys amount masking. Authenticated hosted pilot remains required; local role SQL tests are not a substitute for that.

## Receipt browser state

Receipt File/Blob URLs and attachment ID live only in React memory. URLs revoked on unmount; file not stored in localStorage/sessionStorage/JSON exports/logs. JPEG/PNG/WebP size/signature check repeated server-side; client check is UX,not authorization. Explicit Baca action sends image/context through OpenRouter to a selected free provider through existing authenticated Edge path; confirmation alone mutates ledger. Human preview includes image,critical missing confidence forced low,mask hides image. Client error mapping omits raw provider details. Fallback manual capture has no attachment association. Existing private storage/tenant/requester/expiry controls and BYOK encryption unchanged. Hosted Storage bytes/cleanup/scheduler and real-provider acceptance remain pending.

## Household invitation boundary

Kode undangan entropy tinggi, SHA256 server storage private; no raw token in URLs, persistent frontend storage, lists or audit. Owner management, verified Auth email binding, Member-only insertion, expiry7d, revoke and serialized exact retry. Supabase Confirm Email must remain enabled (Development mailer_autoconfirm=false checked27September). Read [invitation security/limits](HOUSEHOLD-INVITATIONS.md). Automated email/member removal/household switching remain pending.

Cloudflare CSP now explicitly allows self/data fonts bundled by Vite; scripts remain self, no unsafe-eval. Supabase Auth/Edge origins use exact canonicalDevelopmentdomain, not wildcardhashpreviews. Multipartcontent-type/parserfailures now400beforeAuthrather than generic500; financial/uploadauthguards unchanged. See [hostingchecks](CLOUDFLARE.md).

## Username authentication refinement

[Username auth](USERNAME-AUTH.md): private globally unique handles, own-user RPCs, signup trigger with atomic collision rejection, service-only current-email resolution. Public Edge returns tokens only after normal Auth password/confirmation verification, generic credential errors, bounded body/no-store/CORS, hashed account/global quotas. Username metadata never grants household access. No credentials/email maps in source, browser storage beyond existing Auth session, or logs. Production/Google/SMTP setup and authenticated pilot remain separately tracked.

## Production maintenance boundary

Production uses Vault and a private operator-only pg_cron enqueue function. Managed pg_net queue tables still have PUBLIC database grants owned by supabase_admin; postgres REVOKE is ineffective. net/private must remain unexposed via PostgREST, and application users must never receive direct SQL access or a queue-reading security-definer RPC. Existing public/private functions have no queue-reader; the enqueue function is not executable by anon/authenticated/service_role. Check ACL/API exposure after extension updates. See [Production](PRODUCTION.md) for recovery and scheduler evidence; no claim that queue grants were revoked.

## Receipt camera consent

camera=(self) is permitted for explicit Foto struk; microphone/geolocation remain denied. Video-only local preview; Ambil foto & baca AI discloses private upload/OpenRouter, then produces human-confirmed draft. Tracks stopped on close/unmount/hidden/pagehide and late permission resolution; blob URLs revoked. See [camera boundaries](NAVIGATION-CAPTURE.md).
