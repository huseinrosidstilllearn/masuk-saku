# PRD Master — Masuk Saku V1.0

**Satu saku, semua catatan keuangan.** Status: keputusan produk disepakati; implementasi fondasi 0.1.0.
Sumber: keputusan produk pemilik proyek yang disepakati 26–27 September 2026. Percakapan pribadi tidak didistribusikan dalam source publik. Prioritas keputusan terbaru mengatasi jawaban awal yang berbeda (permanent delete langsung/attachment setelah input).

## Visi dan masalah

Keluarga punya uang di bank, cash, e-wallet dan rekening pasangan. Mencatat manual melelahkan; AI bisa salah. Masuk Saku menyatukan aktivitas finansial sehingga pasangan dalam satu household mengetahui seluruh kondisi uang keluarga tanpa membuka banyak aplikasi atau spreadsheet. AI mempercepat input, bukan sumber kebenaran atau otoritas perubahan ledger.

**AI-assisted, human-confirmed. AI-enhanced, not AI-dependent.** Manual entry, deterministic parser dan rule-based insight tetap bekerja tanpa provider/key/quota.

## Platform dan batas scope

Keputusan terbaru pengguna: **fokus hanya web app melalui browser**. Frontend tetap Cloudflare Pages dengan Supabase/PostgreSQL sebagai backend. Layout responsif berlaku untuk browser desktop, tablet dan ponsel; tidak berarti membangun aplikasi mobile terpisah. Aplikasi native Android/iOS/desktop, distribusi app store, installable PWA dan sinkronisasi offline tidak termasuk scope saat ini. Perlu permintaan baru dari pengguna untuk memperluas platform.

## Pengguna, scope dan peran

Owner membuat/mengelola household, anggota, dompet, pengaturan, laporan/activity, backup/restore dan data keluarga. Member melihat household dan dompet yang diizinkan, menambah/mengedit transaksi, budget/goals, reports dan capture. Member trash hanya transaksi yang ia buat; Owner dapat trash semua dan restore. Creator bukan actor. Child account/parental restrictions V2.

Initial household: pasangan dalam satu household. Source publik dan self-host friendly untuk pengguna lain. V1 hanya **liquid money** (bank/cash/e-wallet), hanya **IDR**. Deposito, aset/investasi/net worth dan multi-currency V2.

## Keputusan final yang wajib dipertahankan

| ID  | Keputusan                                                                                          |
| --- | -------------------------------------------------------------------------------------------------- |
| D01 | Dashboard keluarga + personal; default keluarga; personal dihitung dari pemilik dompet             |
| D02 | wallet_owner, transaction_actor, transaction_scope dan created_by adalah field/konsep berbeda      |
| D03 | Personal dan shared wallets tersedia V1; shared milik household                                    |
| D04 | Soft-delete → Trash 30 hari → purge permanen; Owner restore sebelum expiry                         |
| D05 | Creator atau Owner boleh trash; actor saja tidak mendapat izin hapus                               |
| D06 | Attachment retention configurable: immediate setelah confirmation, 24h default, 7 hari, keep       |
| D07 | Confidence hybrid: >=90% tanpa badge, 70–89% warning, <70% critical fields wajib diperiksa/dipilih |
| D08 | Seluruh AI writes: extraction → editable preview → review → confirm → commit                       |
| D09 | AI BYOK, credentials encrypted server-side; tidak ada key di browser storage/Git/log               |
| D10 | Username atau email/password; daftar dengan username; Google tetap tersedia; 2FA V2                |
| D11 | Cloudflare Pages frontend, Supabase/PostgreSQL/Auth/RLS/Storage/Edge backend                       |
| D12 | Backup otomatis mingguan; versioned JSON export/restore; source publik/self-host                   |
| D13 | Budget memperingatkan overspending, tidak memblok transaksi nyata                                  |
| D14 | Savings goals virtual tracking manual, tidak mengubah saldo dompet                                 |

## Domain V1

**Auth & Household:** Owner/Member, onboarding, invitations/removal, household isolation dengan RLS. Automatic session lock default 15 menit, configurable, reauth setelah inactivity. Hide Balance untuk dashboard/wallet/report/widget.

**Wallets:** ID, name, type, ownership, owner, opening/current balance, icon/color, optional identifier, active/inactive dan timestamps. Current balance derived, bukan angka mutable. Personal view tidak mengalokasikan shared balances secara implisit. Actor filter terpisah dari ownership selector.

**Transactions:** income, expense, transfer sebagai satu logical record; transfer fee linked expense. Status pending/completed/cancelled; nominal/date/time/source/destination/category/subcategory/merchant/notes/tags/actor/scope/creator/AI/recurrence/audit fields. Split amount total sama dengan transaksi. Edit/trash/restore berdampak atomic pada saldo, budget dan reports. Pending/cancelled/trash tidak masuk actual ledger. Negative wallet balance diperbolehkan untuk mencatat realitas; opening balance dapat negatif.

**Categories & Tags:** kategori default Makanan, Transportasi, Belanja, Tagihan, Hiburan, Kesehatan, Pendidikan, Rumah Tangga, Sedekah, Pekerjaan, Lainnya. Custom rename/color/icon/order, satu level subcategory dan multiple cross-category tags. Kategori terpakai tidak dihapus diam-diam; restrict atau archive/migrate dengan audit.

**Capture:** Quick Add `-27k makan @dana` / `+2jt freelance @bca` diparse lokal dalam browser tanpa AI/provider; penyimpanan Supabase tetap memerlukan jaringan. Natural language dan struk/screenshot QRIS/invoice/bukti transaksi melalui provider. Capture preview mengizinkan koreksi amount/date/type/wallet/category/merchant. Missing critical field tidak diasumsikan tanpa warning dan review. AI confidence adalah sinyal model, bukan jaminan kebenaran. High confidence pun tetap memerlukan klik simpan. Full AI assistant setelah capture stabil.

**Budget:** category/subcategory/wallet; weekly/monthly/custom date range; reset/rollover per budget; configurable warning default 75/90/100%; progress dan overrun amount. Rollover harus dihitung deterministik dari periode tertutup, tidak double-count transfer. Budget overlap dijelaskan sebagai beberapa batas, bukan envelope saldo. Sisa budget card saat overlap adalah total allowance, bukan uang tersedia.

**Savings Goals:** title/target/deadline/progress/notes/status/contribution history. Manual virtual contributions. Rule-based monthly required contribution dan warning jika pola spending mengganggu tujuan.

**Dashboard & Reports:** top cards dalam urutan Total saldo, Sisa budget, Target tabungan, Pemasukan bulan ini, Pengeluaran bulan ini. Grafik prioritas income vs expense, expense category, budget performance. Wallet/recent transactions/goals/activity/recurring di bawah. Reports today/week/month/year/custom, period comparison, rule-based insights; reorder/hide/show widgets bertahap, resize builder advanced V2.

**Supporting:** global search merchant/category/subcategory/tag/wallet/actor/notes/date; advanced filters type/amount/status/scope/date; Ctrl+K palette; activity audit; CSV/JSON export V1; XLSX/PDF iteration lanjutan. Responsive mobile, import/export versioning, backup, security bukan tambahan opsional.

**Recurring:** weekly/monthly templates, start/end, auto-create atau ask-before-create. Auto-create berasal dari template yang secara eksplisit disetujui user, bukan keputusan AI. Duplicate execution wajib idempotent. Ask mode hanya membuat draft/notifikasi sampai konfirmasi. Runner diprioritaskan setelah ledger/manual entry stabil.

## User stories

- Sebagai pasangan, saya mencatat belanja dari rekening pasangan tanpa mengubah siapa pemilik uangnya.
- Sebagai Owner, saya melihat total keluarga atau dompet personal dan menelusuri transaksi terpisah menurut actor.
- Sebagai user, saya mengetik transaksi singkat lalu memeriksa hasil sebelum saldo berubah.
- Sebagai user BYOK, saya memakai key saya sendiri dan mengoreksi hasil yang belum pasti.
- Sebagai creator/Owner, saya menghapus salah input dengan kemungkinan Owner restore dalam 30 hari.
- Sebagai user, saya melihat budget overspending namun tetap dapat mencatat pembelian nyata.
- Sebagai keluarga, saya melihat target tabungan tanpa menganggap kontribusi virtual sebagai transfer bank.
- Sebagai self-host operator, saya bisa membackup mingguan dan memulihkan dengan format/version yang terdokumentasi.

## Sukses dan nonfunctional

Sukses utama: seluruh kondisi uang keluarga diketahui dari satu aplikasi. Ukur penggunaan konsisten, kelengkapan transaksi, waktu capture, jumlah koreksi AI dan confirmation integrity; angka target akan dibaseline saat pilot, tidak dibuat sebagai klaim tanpa data. Desktop/mobile aksesibel, keyboard operation, Indonesian copy, Jakarta calendar timestamps, human-readable errors, no financial content in debug logs. RLS dan authorized ledger writes wajib sebelum real-data pilot. Weekly backup mempunyai RPO maksimum tujuh hari; restore rehearsal sebelum production.

## Iterasi lanjutan

V1.1: tagihan, utang/piutang, email/Telegram reminders, advanced reports, XLSX/PDF, full assistant dan custom command configuration. V2: 2FA, child permissions, multi-currency/noncash assets/net worth, advanced dashboard builder dan forecasting.

## Implementasi vs kontrak produk

Dokumen ini mengunci produk V1, bukan menyatakan seluruh V1 selesai. Fondasi sekarang memprioritaskan model data/permission, ledger/capture loop, dashboard, starter frontend dan deployment/security/backup runbooks. [Acceptance matrix](ACCEPTANCE.md) adalah sumber status, [roadmap](ROADMAP.md) menentukan penyelesaian fitur lanjutan.

## Latest AI decision —27September2026

User explicitly chooses OpenRouter for free inference. BYOK remains mandatory and encrypted server-only. Active model fixed to openrouter/free, no paid fallback. Model availability/free limits may block AI; manual capture remains. R2 discussed as desired file-storage option but not implemented; actual storage remains Supabase until a separate migration.

Latest public-example decision: demo household/member/wallet labels and signup/capture examples use generic identities; no user's personal name hardcoded. Real user-managed display names remain configurable.

## Latest navigation/capture decision —27September2026

Bottom nav: Dashboard, Dompet, center Tambah, Transaksi, Anggaran. Center opens Upload struk/Foto struk/Tambah manual; secondary menus on Dashboard below financial overview. Photo requests camera only after explicit selection and auto-prepares AI draft after capture, with editable human confirmation before save. See [navigation/capture](NAVIGATION-CAPTURE.md); this preserves AI-assisted human-confirmed.

# Agreed profile extension

Personal account customization includes full name, nickname, private photo (maximum 2 MB), optional phone, birthday, city and short bio. Only nickname is visible to the household. Changes require explicit Save; financial identity and email login remain separate. See [PROFILE.md](PROFILE.md).
