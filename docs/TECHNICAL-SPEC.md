# Masuk Saku — Technical specification

Status: fondasi implementasi, 26 September 2026. Sumber utama: [PRD](PRD.md). Permintaan terbaru mengesahkan pembangunan lokal langsung.

Auth terbaru27September2026: [username login/signup](USERNAME-AUTH.md). Adapter public Edge menjalankan password Auth tanpa mengekspos resolver email; private username unik, trigger signup, own-user RPC untuk akun lama. Email/Google dan permissions finansial tetap.

## Implementasi yang dipilih

React + TypeScript + Vite SPA di Cloudflare Pages; Supabase Auth, PostgreSQL, private Storage, dan Deno Edge Functions. Business rules uang berupa TypeScript murni dan fungsi PostgreSQL, tidak terikat Cloudflare. Alternatif Next.js menambah runtime server yang tidak diperlukan; backend custom menambah beban auth/storage. Self-host menggunakan static frontend dan stack Supabase self-host, bukan PostgreSQL standalone tanpa Auth/Storage.

## Kontrak finansial

IDR whole rupiah integer, maksimum 9.000.000.000.000 per nilai. SQL bigint; API mengubah string/number dengan safe-integer validation. Tidak ada floating point untuk uang. Opening balance + completed, non-deleted ledger entries; pending/cancelled tidak memengaruhi saldo/budget. Transfer satu logical parent, source -amount dan destination +amount; biaya child expense linked, atomic. Shared wallet dimiliki household (wallet_owner null). Personal dashboard hanya wallet dengan wallet_owner yang dipilih; shared tidak dialokasikan otomatis. transaction_actor, transaction_scope (personal/family), dan created_by terpisah. Personal-scope harus punya scope_member_id, family null. Ownership menentukan agregat, bukan privacy boundary; semua anggota V1 dapat melihat seluruh dompet keluarga.

## Ledger write boundary

Browser SELECT lewat RLS. Semua transaksi melalui RPC create_transaction / revise_transaction / trash_transaction / restore_transaction / confirm_ai_draft. Tidak ada direct INSERT/UPDATE/DELETE grants ke authenticated pada ledger. RPC security definer memakai search_path kosong, membership check, immutable creator, tenant references, batas nominal, unique idempotency key, serta atomic splits/fees. Member boleh tambah; trash creator atau Owner, restore Owner; permanent purge hanya maintenance setelah 30 hari. View security_invoker. Wallet management Owner; budget/goals collaboration member. Revisi tersedia melalui RPC revise_transaction: parent row lock, expected version, creator/Owner authorization, atomic fee/splits replacement, immutable creator/source; optional atomic tag replacement, request-key retry dan before/after history.

## Capture

Quick Add deterministic di browser tanpa AI/provider (commit Supabase tetap memerlukan jaringan): -27k makan @dana, +2jt freelance @bca. Parsing menghasilkan preview editable, tidak commit. AI BYOK OpenRouter free-only adapter server-only; key AES-256-GCM dengan encryption key di Edge secret dan ciphertext di private schema. ai-preview tidak mempunyai ledger write code. Draft hanya requester boleh baca; confirm_ai_draft membutuhkan explicit confirmation + acknowledgement field confidence <0.70. 0.70–0.89 warning, >=0.90 tanpa badge; skor model bukan probabilitas terkalibrasi. Tidak ada arbitrary provider URL/SSRF. Timeout, body/output validation, request quotas, no secret logs. Attachment default 24h sejak commit, pilihan immediate/7d/keep; draft abandoned 24h cleanup berbeda dari retention confirmed.

## Starter boundary

Runnable demo in-memory, reset on reload, clearly marked; nyata: auth email/password + Google, household onboarding, wallet create, transaction create/revise/trash/restore, owner-based dashboards, budget/goals create/edit, virtual contribution/history/archive. DB/API fondasi kategori/tag/split/budget/goals/AI/attachments/audit. Full recurring scheduler, import restore, widget builder, member removal/switching, PDF extraction/draft-resume UI, rollover closure dan advanced goal insights dikerjakan sesuai roadmap; tidak dinyatakan selesai V1. Weekly backup job disediakan, butuh encrypted backup secret dan scheduler repository untuk berjalan.

## Quality

Typecheck, build, finance/parser tests, embedded PostgreSQL migrations/RLS integration, Deno check functions. Browser smoke desktop/mobile. Accessibility labels, focus styles, modal Escape, amount masking. No offline cache financial data. Email confirmation enabled production; Google provider setup manual. Lock 15 menit memakai sign-out/reauth, configurable UI setting 5–60 menit. Semua timestamps timestamptz; laporan calendar Asia/Jakarta, month boundary end-exclusive.

## Budget/goal editor status

Local web UI now supports budget creation/editing with category/wallet/date period/custom thresholds, goal creation/editing/notes/status/archive, virtual progress capture/history/creator-or-Owner correction, and whole-rupiah monthly required-contribution calculation including the current month. Graph/cards reflect refreshed snapshots. Snapshot now includes goal notes/status and contributions; old source defaults are compatible and JSON export adds these fields without claiming restore support.

Writes use the tables' existing RLS grants. Goal saved is read-derived; contribution writes never use transaction RPCs or wallet updates. New form UUIDs survive retries and updates filter on original writable fields to surface conflict rather than overwrite. Full period rollover closure, recurring runner, member removal/switching, import/restore and advanced spending-goal insights remain planned. No migration/Edge/server deployment added for this slice.

## Household invitation extension

Owner manual email-bound codes,7d expiration,private SHA256 storage,Member-only verified join and safe retry available. No automatic message delivery or membership deletion. See [security/contracts/pilot](HOUSEHOLD-INVITATIONS.md).

## Navigation/camera extension

[Navigation/capture](NAVIGATION-CAPTURE.md): native chooser, ReceiptCamera getUserMedia video-only/local JPEG, existing attachment-upload → ai-preview → editable TransactionForm → explicit ai-confirm. camera=(self) header, permission/track/late-resolution cleanup; no database/Edge changes. Configured-mode API failure/retry coverage alongside auth session tests.

# Personal profile extension

See [PROFILE.md](PROFILE.md) for migration11, own-user profile privacy, versioned save RPC and private avatars storage (2 MiB JPEG/PNG/WebP). Profile updates synchronize only active membership nicknames and never financial ownership/actor IDs. Photo bytes need separate operational backup.
