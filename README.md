# Masuk Saku

**Satu saku, semua catatan keuangan.**

Fondasi web app keuangan keluarga, dibangun dari PRD percakapan _Saran Nama Keuangan_. React/TypeScript di Cloudflare Pages, Supabase/PostgreSQL backend, AI BYOK. Versi 0.1.0 adalah starter; cakupan V1 penuh dilacak di [roadmap](docs/ROADMAP.md).

**Melanjutkan dengan agent lain? Baca [handoff publik](docs/AGENT-HANDOFF.md) dan AGENTS.md.** Instalasi lokal juga memiliki NOTES.md yang tidak dipublikasikan.

**Fokus platform: web app di browser.** Tampilan responsif untuk desktop/tablet/ponsel tetap bagian dari web app. Aplikasi native, app store, installable PWA dan sinkronisasi offline tidak termasuk scope saat ini.

Fondasi animasi menggunakan recipe publik Transitions.dev. Baca [motion foundation](docs/MOTION.md) untuk sumber, pemetaan UI, reduced motion dan pengecualian lisensi CSS.

Login menerima **username atau email**; daftar meminta username unik. Akun lama masuk memakai email lalu mengatur username melalui **Pengaturan > Username akun**. Email tetap untuk konfirmasi akun. Baca [username auth](docs/USERNAME-AUTH.md) untuk migration/Edge deployment dan kontrak keamanan.

Production domain: **masuksaku.my.id**. Paket deployment terpisah dan panduan Resend SMTP ada di [PRODUCTION](docs/PRODUCTION.md). Pages Productione2da5fd5 dan backend8migrations/6functions sudah deployed. [Domain canonical](https://masuksaku.my.id) sudah aktif melalui HTTPS; email verifikasi/login username berhasil menurut pilot pengguna; household/financial pilot dan backup masih pending; maintenance15menit aktif.

## Jalankan di Windows

Butuh Node.js >=22.12 (Node 24 LTS direkomendasikan), npm dan browser modern.

```powershell
Set-Location -LiteralPath 'D:\00 HUSEIN AI PROJECT\Masuk Saku (Manajemen Keuangan)'
npm ci
npm run dev
```

Buka http://127.0.0.1:5173. Konfigurasi lokal yang diberikan pengguna membuat `npm run dev` memakai Supabase Development. Untuk mencoba data contoh tanpa backend, jalankan `npm run dev:demo`: demo selalu di memori dan muat ulang mengembalikan contoh awal. Tidak ada financial data atau API key di localStorage.

`npm run build` memakai Production; `npm run build:development` memakai Development; `npm run build:demo` menghasilkan demo. File `.env.development.local` dan `.env.production.local` dikecualikan dari Git. Pada instalasi baru, isi environment sendiri dari `.env.example`. Lihat [panduan konfigurasi](docs/DEPLOYMENT.md).

## Yang sudah berjalan

- Dashboard keluarga dan personal berdasarkan **wallet ownership**, lima summary cards, arus kas, kategori, performa budget, dompet dan goals.
- UI dipoles: ikon SVG konsisten, pencarian dari header, transaksi dalam kartu pada ponsel, halaman login/signup baru, password toggle, serta feedback loading/kosong/error/sukses. Layout diuji hingga lebar320px.
- Upload struk JPEG/PNG/WebP hingga10MiB: pratinjau lokal → private upload → editable AI preview → konfirmasi. Membutuhkan Supabase+BYOK; demo tidak melakukan OCR.
- Manual entry dan Quick Add tanpa AI, editable preview dan konfirmasi. Income/expense/transfer + linked admin fee; actor dan scope terpisah.
- Edit transaksi creator/Owner dengan optimistic version, atomic fee/splits, dan riwayat before/after. Tag dan creator tetap dipertahankan.
- Tambah dompet personal/shared, creator/Owner trash dan Owner restore, hide balance, pencarian dasar, ekspor CSV/JSON.
- Supabase email/password + Google login, onboarding household, pembacaan tenant data dan RPC writes ketika dikonfigurasi.
- Migrations, RLS, tenant composite FKs, audit, idempotency, split/tag contracts, server AI draft confirmation.
- Edge Functions: encrypted BYOK credentials, text/image AI preview, attachment upload dan retention/trash maintenance.
- Workflow weekly encrypted backup serta CI. Scheduler dan secrets harus dikonfigurasi di repository milikmu.

Tambah/edit anggaran dan target tabungan, progres virtual/riwayat/koreksi serta arsip target sudah tersedia. Rollover otomatis, import restore, recurring runner dan full AI assistant belum menjadi fitur lengkap. Undangan anggota dan editor kategori/tag sudah tersedia. [Acceptance matrix](docs/ACCEPTANCE.md) menyebut batas setiap fitur.

## Hubungkan backend

1. Development kini sudah terpasang; lihat [status Supabase](docs/SUPABASE-STATUS.md). Untuk instalasi baru, buat project Supabase atau jalankan stack lokal (Docker + Supabase CLI).
2. Copy .env.example menjadi .env.local; isi URL dan **public anon/publishable key**. Jangan isi service-role/AI key pada environment frontend.
3. Dengan CLI yang sudah login: `supabase link --project-ref PROJECT_REF`, lalu `supabase db push`. Alternatif jalankan seluruh migration dalam urutan timestamp berurutan lewat SQL Editor pada project baru.
4. Configure Auth redirect URL untuk localhost dan domain produksi; aktifkan Google provider dengan Google client ID/secret; email confirmation aktif. [Deployment guide](docs/DEPLOYMENT.md).
5. Copy supabase/functions/.env.example menjadi .env.local di folder fungsi; generate server encryption/maintenance secrets; deploy 6 Edge Functions. Setup rinci di docs/DEPLOYMENT.md.
6. Restart frontend. Login, buat household dan dompet; konfigurasi BYOK di Pengaturan jika memakai AI.

## Pemeriksaan

```powershell
npm run check
npm run format:check
npx playwright install chromium
npm run test:e2e
deno check --config supabase/functions/deno.json supabase/functions/ai-credentials/index.ts supabase/functions/ai-preview/index.ts supabase/functions/ai-confirm/index.ts supabase/functions/attachment-upload/index.ts supabase/functions/maintenance/index.ts
```

Test PostgreSQL menggunakan PGlite, tidak membutuhkan kredensial atau Docker. Browser tests selalu menjalankan mode demo yang mengabaikan konfigurasi Supabase. Deno diperlukan hanya untuk Edge Functions. [Hasil verifikasi](docs/VERIFICATION.md).

## Dokumen

| Dokumen                                            | Isi                                               |
| -------------------------------------------------- | ------------------------------------------------- |
| [PRD master](docs/PRD.md)                          | Keputusan produk, user stories, scope             |
| [Technical specification](docs/TECHNICAL-SPEC.md)  | Kontrak uang, tenant, ledger dan batas starter    |
| [Architecture](docs/ARCHITECTURE.md)               | Diagram, flow dan keputusan teknis                |
| [Database](docs/DATABASE.md)                       | ERD, migrations, RLS dan contoh RPC               |
| [API & Edge Functions](docs/API.md)                | Payload, authorization, preview/commit, retention |
| [Security](docs/SECURITY.md)                       | Permission, secrets, confidence, data lifecycle   |
| [Design system](docs/DESIGN-SYSTEM.md)             | Token, typography, UX dan accessibility           |
| [Roadmap](docs/ROADMAP.md)                         | Sprint plan V1→V2                                 |
| [Acceptance](docs/ACCEPTANCE.md)                   | Checklist dan implementasi vs backlog             |
| [Operations](docs/OPERATIONS.md)                   | Backup mingguan, restore, cleanup, self-host      |
| [Folder structure](docs/FOLDER-STRUCTURE.md)       | Peta source dan tanggung jawab                    |
| [Implementation plan](docs/IMPLEMENTATION-PLAN.md) | Rencana dan urutan foundation                     |

Source cocok untuk repository publik: examples tanpa secrets, lockfiles, CI, dependency licenses dan MIT license disediakan. Database dan fungsi server telah dipasang ke Supabase Development milik pengguna. Belum ada push GitHub. Development dan Production sudah di Cloudflare Pages dengan backend terpisah; lihat status terbaru Production.

## AI gratis melalui OpenRouter

Buka Pengaturan lalu masukkan API key OpenRouter ke kolom khusus (jangan ke environment frontend). Model dikunci ke openrouter/free dengan batas harga0 dan tanpa model berbayar cadangan. Key OpenAI lama tidak dipakai oleh adapter baru; ganti melalui UI. Ketersediaan/kuota gratis dapat membuat capture gagal; pencatatan manual tetap tersedia. [Free router](https://openrouter.ai/docs/guides/routing/routers/free-router).

Kategori/subkategori dan tag dapat dikelola di Pengaturan. Tag tersedia pada form transaksi dan pencarian; perubahan tag tercatat dalam riwayat revisi. Kategori/tag yang masih dipakai tidak dapat dihapus.

Undangan anggota tersedia di Pengaturan untuk Owner, dibagikan manual dengan kode berlaku tujuh hari. Penerima bergabung dari onboarding. Baca [panduan undangan](docs/HOUSEHOLD-INVITATIONS.md) untuk cara pakai dan pilot hosted.

Development kini online di [masuk-saku-development.pages.dev](https://masuk-saku-development.pages.dev). Lihat [panduan Cloudflare dan deployment ulang](docs/CLOUDFLARE.md). Production juga deployed; maintenance Production aktif. Backup mingguan dan hosted account/AI pilot masih diperlukan.

Email autentikasi: [13 template Supabase berbahasa Indonesia](docs/AUTH-EMAILS.md), dengan preview dan source HTML; sudah dipasang ke Production. Toggle keamanan tetap mengikuti pengaturan operator.

## Login and inactivity regression checks

Run `npm run test:auth -- --workers=1` after authentication/session changes, in addition to `npm run check` and `npm run test:e2e -- --workers=2`. This separate configured-mode browser suite uses a fake backend URL/key and intercepts every Supabase request; it requires no real account or private environment secret. It covers username/email login with stale activity, expired-session restoration, and repeated same-user revalidation. The demo-only suite does not execute real-mode session locking. See [session behavior](docs/SESSION-AUTH.md).

Navigation and receipt camera: [flow, permission cleanup, API and verification limits](docs/NAVIGATION-CAPTURE.md).
