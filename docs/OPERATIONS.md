# Operations, backups and self-hosting

## Weekly backup

Google Drive is an optional encrypted backup destination: [setup and verification](GOOGLE-DRIVE-BACKUP.md). It does not replace the database dump credentials or independently retained decryption identity.

RPO7days maximum. .github/workflows/backup.yml runs Sunday19UTC and supports manual dispatch. Uses PostgreSQL17 pg_dump in an official container; custom dump includes public, auth, private and storage schemas/data. This includes household/member identities, wallets, ledger/splits/tags, categories, budgets, virtual goals/contributions, preferences, recurring templates, audit and encrypted BYOK ciphertext. Storage object bytes are **not** in a PostgreSQL dump. By default receipts follow their retention policy; metadata may outlive physical objects after restore.

Dump encrypted with age using an operator-held public recipient; private decryption identity never present in CI. Only .age file uploaded as artifact;90day artifact retention. Ciphertext credential backup is useless without separately stored AI_ENCRYPTION_KEY, so keep that in a secret manager with version metadata. Full backup is distinct from user schema_version1 JSON snapshot/export; frontend snapshot does not contain all auth/metadata tables and cannot be called full-system recovery.

Local Windows alternative: install pg_dump matching server version and age CLI; set PGHOST/PGPORT/PGUSER/PGDATABASE/PGPASSWORD and BACKUP_AGE_RECIPIENT in secure environment, then .\scripts\backup.ps1. TLS require default; configure trusted CA/verify-full where supported. Script removes only its exact plaintext file from the resolved target directory in finally. No automatic deletion of older backups beyond operator storage/artifact lifecycle. Handle failed encryption as a failed backup; no plaintext should be published.

## Restore rehearsal

1. Create isolated staging Supabase with matching platform/PostgreSQL versions. Do not restore blindly into production or a different auth schema version.
2. Download encrypted artifact and record SHA256. Decrypt with operator age identity into a protected temporary directory: age --decrypt -i IDENTITY_FILE -o restore.dump BACKUP.dump.age.
3. Inspect contents with pg_restore --list restore.dump. Apply app migrations to staging. Choose schema vs data restore sections deliberately: staging already has platform auth/storage schemas. Platform-owned internals must match versions; use Supabase's documented migration/restore procedure for managed tables.
4. For staged data restore on a compatible empty stack, use pg_restore data-only/no-owner/no-acl with dependency ordering and privileges reviewed by operator. Preserve auth.users IDs before household_members and ledger. Do not copy service/JWT secrets between environments without an explicit rotation plan.
5. Reconcile wallet balances, transaction/split/tag counts, virtual contributions, trash dates and audit. Login as test members; confirm household isolation and BYOK decrypt only with correct restored server secret. Retained objects require a separately backed-up private Storage volume; otherwise mark missing metadata removed.
6. Delete plaintext staging dump from its verified temporary directory, document restore timings, and keep encrypted backup. Set RTO after measured rehearsal, not an invented promise.

Public repository huseinrosidstilllearn/masuk-saku contains the weekly/manual workflow. Operator configured database/age/Drive Secrets through secure local input. First manual Production backup succeeded27September2026: [Actions run36327110585](https://github.com/huseinrosidstilllearn/masuk-saku/actions/runs/36327110585), database dump/encryption/Drive upload/checksum/90day encrypted artifact all passed. Weekly schedule is Sunday19UTC (Monday02WIB). This is backup success, not an isolated restore rehearsal.

For setup/reconfiguration, run scripts/configure-backup.ps1 locally: it prompts for Session pooler host/user and hidden database password, stores GitHub Secrets through stdin, generates/reuses a local age identity in an ACL-restricted ignored directory, encrypts available Production server recovery into a portable .age file, then dispatches the backup. Copy the private decryption identity and encrypted server recovery to independent secure storage. The identity never goes to GitHub. Restore still requires rehearsal on isolated compatible staging.

### Finding Session pooler settings

Open the Production project in the Supabase dashboard, select Connect, then Session pooler. Use port5432, not the transaction-pooler port6543. In the connection string, the part after @ and before :5432 is the hostname; the user is usually postgres.PROJECT_REF. The password is the project's database password, not your Supabase dashboard login password or a publishable key. Enter these directly into the local helper prompts. Do not paste the connection string/password into chat or commit it. Run the helper from the project directory in PowerShell with `& .\scripts\configure-backup.ps1`.

Optional -DatabaseHost/-DatabaseUser arguments accept nonsecret connection fields; the password always uses hidden interactive input and has no command-line argument. If a database password was shared in chat or logs, rotate it from Database → Settings before configuring the job, and update other operator-managed database connections. [Official password-reset guide](https://supabase.com/docs/guides/troubleshooting/how-do-i-reset-my-supabase-database-password-oTs5sB).

## Retention and cleanup

Production already runs maintenance every15min via pg_cron/pg_net/Vault. The GitHub maintenance workflow is manual-only fallback to avoid duplicate schedules. Self-host operators should schedule every15min with MAINTENANCE_SECRET. User-facing ai-confirm tries immediate object deletion after successful commit; failure reports cleanup_pending, maintenance retries. Expired attachments denied by metadata-aware RLS for new reads; physical deletion determines revocation of previously issued signed URLs. Worker100files/run; if backlog grows, increase cadence/batch controls. Trash retention30days, purge cascades linked fee/splits/tags and leaves audit entity identifiers. Backup retention can preserve earlier deleted rows until90day expiry; document it to household users.

Alert on failed weekly backup/cleanup, no successful backup for8days, increasing receipt expiry backlog or provider failures. Never put financial payloads/API keys in job logs. Credentials/retention settings must be available after migration; AI outages never block manual ledger.

## Recurring templates

Storage exists; automatic runner is intentionally not active in foundation. Before activating auto-create, add (template_id,occurrence_date) uniqueness, timezone-safe monthly clamping (day31→month end), row-lock selection, permission recheck and end_date handling. Ask mode creates a draft only. Auto mode comes from explicit template approval, not AI invention.

## Self-host

Host dist on any static web server with SPA fallback/security headers. Deploy the official Supabase Docker stack (Auth, PostgreSQL, PostgREST, Storage, Edge runtime); apply app migrations, supply public URL/key, update CORS/CSP/Auth callbacks and server secrets. Backend is not swappable to naked PostgreSQL with no Auth/Storage layer. Business finance/parser logic has no Cloudflare-specific dependency. Keep database/Storage volumes encrypted and off-site backups separate from deployment configuration backups.

Authoritative references: [Supabase backups](https://supabase.com/docs/guides/platform/backups), [self-host restoration](https://supabase.com/docs/guides/self-hosting/restore-from-platform), [Docker stack](https://supabase.com/docs/guides/self-hosting/docker).
