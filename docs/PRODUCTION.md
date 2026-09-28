# Production — masuksaku.my.id

## Demo toolbar layout update — 28 September 2026

Latest frontend is **0c3a7e68**, app commit **de37056**. Public demo scope dropdown and balance/reset controls now align with consistent minimum 44px heights; narrow screens wrap with 12px spacing. Hosted checks at 320/390/768/1440 and current assets/demo reset/no backend writes/no overflow/page errors passed. Development is **1671b142**. This CSS-only update does not change the 17 database migrations, six v3 Edge functions, Auth, secrets, financial records or prior financial QA evidence. Previous frontend is 3de0d4a3; detailed backend promotion remains below.

## Current release — 28 September 2026

Seluruh pembaruan Development melalui commit aplikasi **7726159** telah dipromosikan atas permintaan pengguna. Checkout saat deployment: `9132d30` (dokumentasi QA, kode aplikasi sama).

- Frontend **3de0d4a3** tersedia di [masuksaku.my.id](https://masuksaku.my.id) dan [deployment tetap](https://3de0d4a3.masuk-saku-production.pages.dev).
- Database **17 migrasi**; migrasi 12–17 diterapkan tanpa reset. Pemeriksaan berikutnya menyatakan database up-to-date.
- Enam Edge functions berstatus **ACTIVE versi 3**, termasuk maintenance untuk jadwal berulang dan penutupan anggaran. Enam tabel memiliki publikasi realtime.
- Jadwal maintenance Production tetap satu, setiap 15 menit; tidak ditambahkan jadwal Development. Tercatat 110 dispatch sukses. Panggilan terautentikasi setelah deploy mengembalikan keempat counter dengan nilai nol.
- Backup terenkripsi database dan Storage [36401935020](https://github.com/huseinrosidstilllearn/masuk-saku/actions/runs/36401935020) berhasil sebelum migrasi, termasuk upload/checksum Google Drive.
- Fingerprint ledger, metadata dompet (tanpa kolom versi baru), dan saldo sama sebelum/sesudah migrasi serta setelah akun uji dibersihkan. SMTP, konfigurasi Auth, dan kunci enkripsi/maintenance tidak diganti. Tidak ada data atau kredensial Development yang disalin.

Pemeriksaan domain utama lulus: aset cocok dengan build Production, backend Production saja, HTTPS/CSP/izin kamera, halaman beranda/masuk/daftar, dan reset demo tanpa penulisan Supabase. Email dan Google tetap aktif pada pengaturan Auth publik; ini tidak mengulangi alur inbox atau Google consent.

Pilot hosted dengan akun sementara lulus pada Production: login email/username, pencatatan dan transfer+fee setelah konfirmasi, trash/restore, dua sesi realtime, transaksi berulang/retry, rollover, isolasi anggota, impor RPC, draf, Storage privat, PDF, dan jalur kegagalan BYOK. Tes join realtime yang sengaja ditunda lima detik juga lulus tanpa reload. Layout 320/768/1440 tidak overflow atau menghasilkan error JavaScript. Seluruh fixture dibersihkan. Lihat [QA hosted](QA-HOSTED.md).

Kode yang dipromosikan memiliki CI [36393287315](https://github.com/huseinrosidstilllearn/masuk-saku/actions/runs/36393287315) sukses: 97 unit/domain/SQL, 50 demo browser, 20 configured auth, 11 Deno, seluruh enam pemeriksaan Edge functions, lima tes backup, typecheck/build/format. Source tidak diubah untuk promosi ini.

Development tetap **365f1032**, 17 migrasi, enam fungsi; primary CLI tetap Development. Referensi frontend Production sebelumnya adalah `64f9f8a6`; jangan mereset database atau menganggap rollback frontend lama otomatis cocok dengan kontrak RPC yang baru. Kelengkapan deployment ini tidak menutup gate AI dengan key valid, kamera/perangkat fisik, restore terisolasi, salinan pemulihan kunci, dan instalasi self-host bersih.

## Historical releases

Catatan di bawah merekam versi terdahulu dan tidak menggantikan status terbaru di atas.

## Current release — 27 September 2026

Latest authorized promotion includes all Development changes through68dad2b: password recovery, AI credential lifecycle, transaction filters/pagination/reports, active membership controls, private profiles/avatars/username, mobile avatar fix, photo-first layout, AI settings shortcut/endpoint display, centred footer and spacing audit.

- Frontend: **64f9f8a6**, [canonical](https://masuksaku.my.id), [immutable](https://64f9f8a6.masuk-saku-production.pages.dev).
- Supabase: **11 migrations**, all applied; dry-run reports up-to-date. Six Edge Functions redeployed from current source.
- Development remains **58458d65**, 11 migrations; primary CLI still Development. Production operations use explicit ref and isolated work/production-cli.
- Pre-promotion encrypted backup [36332334635](https://github.com/huseinrosidstilllearn/masuk-saku/actions/runs/36332334635) succeeded before migrations9–11.
- Verification: current source CI passed; local84unit/SQL,44demo,16configured browser, build/format and spacing audit passed in preceding Development slice. Fresh Deno11tests and checks of all6functions passed. Production build/preflight, canonical/Pages HTTP200, matching assets, Production-only backend, CSP, SPA and320px signup/no page errors passed. Backend anonymous/CORS/quota/private resolver negative checks passed.
- Auth/SMTP/encryption keys were preserved; no Development data or credentials were copied. Google is now enabled in both environments; public settings and authorize callbacks were checked after operator setup.

This release is a deployment promotion, not completion of every V1 requirement. Real-account finance/AI/profile upload, multiaccount revoke/rejoin, physical camera and retention pilots, independent recovery-key copy, durable Drive OAuth, isolated restore rehearsal and Storage-byte backup remain unresolved. Database backup does not include photo/receipt bytes.

Rollback frontend reference: e2da5fd5. New migrations are append-only; do not blindly roll back database schema or reset hosted data. See OPERATIONS.md for recovery planning.

## Historical deployment notes

The entries below document earlier deployments and are superseded by the current release above.

# Production — masuksaku.my.id

## Current frontend release —27September2026

Production **e2da5fd5** at [masuksaku.my.id](https://masuksaku.my.id) promotes all current Development78e8c110 frontend changes: dropdowns/component motion/login activity fix/banking navigation/3capture options/camera/8px spacing. User expressly authorized promotion. Fresh78unit/SQL+41demo browser+5configured-mode passed, format/preflight/deploy and hosted domain/artifact/Production-only backend/CSP/SPA/320/signup/dropdown/hover/reduced-motion/camera policy/mocked-login checks passed. See [release evidence](VERIFICATION.md) and NOTES. Physical camera/BYOK/authenticated finance pilot pending; no backend/data/SMTP/secret changes. Previous5fd70f43 is the frontend rollback reference.

Earlier SMTP correction to username resend and user successful inbox/confirmation/username login are recorded in NOTES; the initial snapshot below predates those corrections. Weekly encrypted backup/restore and independent key recovery remain pending. No completeV1 claim.

## Historical initial deployment — 27 September 2026

Latest verified status supersedes older preparation-only entries. Production Supabase **snqkfrcxjfdjkwxjiabc** has **8/8 migrations applied** and **6 ACTIVE v1 Edge functions**. Cloudflare project **masuk-saku-production** is deployed: **95ae4223**, [Pages](https://masuk-saku-production.pages.dev), [immutable](https://95ae4223.masuk-saku-production.pages.dev). Canonical **https://masuksaku.my.id** now serves the Production app over verified HTTPS; current assets match deployment95ae4223. Development db43c019 and primary CLI link kxezrgvnpoaqzcseymts remain unchanged. No Dev data or keys copied.

Production Auth Site URL/redirect and Edge CORS use exact https://masuksaku.my.id; REST max_rows10000, Storage max10MiB. Google disabled. Resend domain Verified from user screenshot. SMTP remote enabled, host smtp.resend.com:465, sender noreply@masuksaku.my.id, display name Masuk Saku ID; username currently **masuksakuwebapp**, which must become **resend**. User is filling dashboard settings; correction requested. No SMTP password printed or requested. Delivery/signup/confirmation/username login have not been piloted.

Unique Production encryption and maintenance keys uploaded; Windows DPAPI recovery at ignored work/production-secrets/edge.recovery.dpapi.txt, restricted to the current Windows user. This recovery is user/machine-bound; independently recoverable secret-manager copy remains required before real BYOK/data. Never rotate encryption key casually. Plaintext upload/env and temporary Vault SQL removed. Production profile at ignored work/production-cli is code/config only, not a Dev secret copy. CLI2.118 config push changes declared fields only and preserved undeclared SMTP settings.

Maintenance is now scheduled **every15minutes** via pg_cron/pg_net, Vault bearer and private.enqueue_production_maintenance(). Job1 active; scheduled run at06:00UTC succeeded; manual and scheduled HTTP responses both200 with0 attachments removed/0transactions purged. No expired fixture exercised, so physical retention acceptance remains pending. See [operations SQL](../supabase/operations/production-maintenance.sql) and [setup script](../scripts/enable-production-maintenance.ps1). Important managed ACL limit: Supabase owns net objects as supabase_admin; postgres REVOKE did not remove PUBLIC table access. net is not API-exposed and no application RPC reads its queue; wrapper EXECUTE denied to anon/authenticated/service_role. Do not grant application users raw SQL access or expose net. This is an explicit operational limit, not a successful table-revoke claim. Weekly encrypted backup/restore drill is still **not active**.

Fresh Production verification: deploy wrapper build/preflight/upload succeeded; public Pages200/current assets/Production backend only/CSP/SPA/signup username/320px no overflow/no pageerrors, screenshot docs/screenshots/production-signup.png inspected. Real backend anonymous/auth/CORS/quota/resolver smokes passed without signup/email/provider/ledger writes. Deno checks all6functions and11/11shared tests passed. Earlier npm check78unit/SQL and33browser results remain separately dated; browser regression suite not rerun for this operations-only slice. Existing~656kB bundle advisory persists. No Git remote/publication; complete V1 not claimed.

Next: user fixes SMTP username, connects Cloudflare Custom domain; verify canonical and safe SMTP fields, then own-account signup/email confirmation/username login and authorized household/receipt/BYOK pilot. Activate encrypted weekly backup and rehearse restore; retain unresolved Google/R2/PDF/recurring/rollover/import/report backlog. Browser control failed Transport closed; do not extract browser/CLI credentials as a workaround.

## Paket yang bisa dijalankan

```powershell
# Build Production, validate artifact, generate isolated CLI profile, remote dry-run only.
./scripts/prepare-production.ps1
```

Script meng-copy source functions .ts/.json/.lock saja; tidak menyalin .env.local atau recovery secrets Development. Auth Google tetap disabled sampai kredensial provider dipasang. Profile generated ini belum berisi custom SMTP; CLI2.118 preserves undeclared SMTP fields during config push (verified); review diff for future CLI versions or explicitly declared SMTP before pushing.

Preflight `node scripts/pages-preflight.mjs DIRECTORY production` menolak backend Development atau artifact campuran, environment tak dikenal, envfiles/root404 dan CSS motion yang hilang. Development menggunakan parameter default development dan wrapper lama tetap lolos. Negative checks memakai actual Production artifact dalam mode Development serta empty motion fixture, keduanya ditolak.

## Resend — langkah yang menunggu akun pengguna

1. Login atau daftar paket Free di [Resend](https://resend.com/signup). Tidak perlu memilih plan berbayar atau mengaktifkan transactional overages. Paket live mencantumkan batas100email/hari; batas akun aktual ada di dashboard/pricing.
2. Domains > Add domain > masuksaku.my.id, aktifkan sending. Pilih Connect Cloudflare jika tersedia, atau pasang record DKIM/SPF/return-path persis yang diberikan Resend pada Cloudflare DNS. Domain pengguna sudah Verified; preserve actual verified records, jangan menyalin contoh dokumentasi sebagai nilai nyata.
3. Verifikasi hingga sending domain berstatus Verified. Jangan mengubah MX apex untuk email masuk; sending dan mailbox/inbound berbeda. DNS text/screenshot boleh dibagikan, tetapi API key tidak.
4. API Keys: buat key untuk pengiriman dari domain tersebut dengan permission sending/domain restriction bila tersedia. Simpan di secret manager dan masukkan langsung ke Supabase Auth SMTP password, bukan chat, frontend env atau Edge BYOK.
5. Supabase **Production** > Auth > Email > Custom SMTP, isi konfigurasi di bawah. Biarkan Confirm Email aktif; jangan mengatasi email failure dengan mematikan konfirmasi. Matikan tracking link untuk email autentikasi.

| Field         | Nilai                                          |
| ------------- | ---------------------------------------------- |
| Sender name   | Masuk Saku                                     |
| Sender email  | noreply@masuksaku.my.id                        |
| SMTP host     | smtp.resend.com                                |
| SMTP port     | 465 (implicit TLS)                             |
| SMTP username | resend                                         |
| SMTP password | Resend API key, diisi langsung dalam dashboard |

Alamat pengirim dipakai setelah root sending domain terverifikasi; tidak memerlukan mailbox baru untuk outbound. Jika memilih subdomain pengirim lain, domain verification dan sender email harus disesuaikan bersama. Free quota bukan unlimited; Supabase juga memiliki rate limits sendiri. [Resend SMTP](https://resend.com/docs/send-with-smtp), [domain verification](https://resend.com/docs/dashboard/domains/introduction), [pricing](https://resend.com/pricing). Supabase default SMTP hanya untuk alamat anggota tim dan tidak memadai untuk pendaftaran keluarga/pengguna umum: [Supabase SMTP](https://supabase.com/docs/guides/auth/auth-smtp).

Browser automation dan open_in_codex sedang gagal Transport closed pada sesi persiapan. Tidak ada browser/account login yang diam-diam diselesaikan. Wrangler OAuth saat ini memiliki account:read/user:read/pages:write, tanpa zone/DNS scope; itu cukup untuk Pages deployment tetapi tidak bukti izin mengedit DNS/verifikasi domain otomatis.

## Urutan aktivasi sesudah prasyarat tersedia

1. Review migration dry-run/target Production; apply dengan explicit project ref dari isolated profile. Tidak memakai reset, seed demo atau bootstrap existing DB.
2. Generate secret encryption/maintenance **unik Production** sekali, simpan recovery copy aman. Isi file ignored, memakai [template Production Edge](../supabase/functions/production.env.example); upload hanya ke Production. Jangan reuse key Development, jangan mengganti key yang sudah mengenkripsi BYOK.
3. Deploy6functions Production dari profile isolated: ai-credentials, ai-preview, ai-confirm, attachment-upload, maintenance, username-login. Semua financial endpoints tetap getUser/membership/RLS; username-login memang public password endpoint; maintenance memakai secret terpisah.
4. Configure Auth Site URL dan exact redirect https://masuksaku.my.id, Confirm Email, SMTP dan REST max rows sesuai loader10000; private schema tetap tidak exposed. Profile generated belum boleh dianggap remote configuration sudah diterapkan.
5. Create Pages project masuk-saku-production dengan branch main lalu jalankan `./scripts/deploy-pages-production.ps1 -AccountId ID_AKUN`. Wrapper build ulang dan preflight Production sebelum upload. Wrapper sudah berhasil end-to-end untuk95ae4223. Jangan upload work/production-cli, secrets, seluruh root folder atau artifact Development.
6. Pages project Production > Custom domains > add masuksaku.my.id dahulu. Baru asosiasi CNAME apex ke masuk-saku-production.pages.dev melalui wizard DNS Cloudflare. Jangan membuat CNAME saja tanpa Pages association: [Cloudflare custom domains](https://developers.cloudflare.com/pages/configuration/custom-domains/). Tunggu HTTPS/certificate dan domain Active, periksa konflik record yang nyata sebelum mengubahnya. www tidak ditambahkan tanpa keputusan kebutuhan terpisah.
7. Aktifkan weekly encrypted backup/restore drill dan maintenance scheduling; simpan encryption recovery key terpisah. Templates lokal bukan bukti job berjalan. Jangan menggunakan real financial data sebelum backup/restore/retention tervalidasi.
8. Verifikasi canonical current assets hanya Production, HTTPS/CSP/SPA, auth registration+email confirmation+username login/session lock, Owner/Member isolation, RPC/ledger, attachment retention, BYOK dan failure/manual fallback dengan akun pilot yang diotorisasi. Tidak mengirim test email ke orang lain tanpa instruksi.

Domain Active di Cloudflare bukan bukti app Production atau email Verified. Pages Production sudah live; domain utama, email delivery, full V1 dan backup belum dinyatakan lolos. Development db43c019 dan backend8migrations/6functions tetap berjalan.

## SMTP save follow-up —27September2026

User reports Resend Custom SMTP settings saved. Fresh explicit Production config diff confirms enabled=true, host smtp.resend.com, port465, sender noreply@masuksaku.my.id, display name Masuk Saku ID; SMTP username remains masuksakuwebapp, not required resend. Requested username correction directly in dashboard; no password/key exposed. Canonical https://masuksaku.my.id still fails DNS resolution on this check; requested Pages Custom domains association. Saving settings is not evidence of successful email delivery. Signup/email/confirmation pilot remains pending these prerequisites. Development is unchanged.

## SMTP username verified —27September2026

User changed SMTP username to resend; fresh explicit Production config diff verifies user=resend, enabled=true, host=smtp.resend.com, port465, sender=noreply@masuksaku.my.id. No password retrieved or printed. Supersedes earlier username correction pending entries. SMTP configuration fields now match Resend; actual email delivery remains untested. Canonical https://masuksaku.my.id still fails DNS resolution; next prerequisite is Cloudflare Pages masuk-saku-production → Custom domains → masuksaku.my.id, automatic DNS. Do not test signup on Development expecting Production SMTP, or claim delivery success without an authorized own-account pilot.

## Canonical Production verified —27September2026

User added masuksaku.my.id to Cloudflare Pages Custom domains. Fresh canonical HTTPS200, matching deployment95ae4223JS/CSS, Production snqkfrcxjfdjkwxjiabc backend present and Development backend absent. Public real login/signup (username required),320px no overflow/no pageerrors, CSP present and SPA fallback200 passed. Screenshot docs/screenshots/production-canonical-signup.png inspected. Canonical-origin Edge negative Auth/resolver/quota/CORS checks passed; foreign origin403 without CORS. Production base config diff0declared changes; SMTP enabled/resend/smtp.resend.com:465/noreply@masuksaku.my.id confirmed. No DNS/auth/template/ledger writes made by agent in this domain-verification slice.

Next user pilot pending: open https://masuksaku.my.id, register own email/username/password, receive and click confirmation, then login with username; async status question sent. Production accounts/data are separate from Development. No password/verification link requested. Inbox delivery, successful actual credentials, hosted household/AI/Storage, weekly encrypted backup/restore, recovery form and Google remain unverified/incomplete. Maintenance15min and templates13already installed; notifications7false. This latest entry supersedes older canonical-unreachable/custom-domain-pending statements. Root Development link/deployment unchanged. Public origin availability is not a full operational/fullV1 readiness claim.

## User-reported Production Auth pilot —27September2026

User reports email received and username login successful after signup/confirmation at https://masuksaku.my.id. This is genuine user-session feedback, not an agent-created/mocked account or agent inspection of inbox/tokens. Marks own-account signup→SMTP/template delivery→confirmation→username login pilot passed by user report. Does not prove every email type, password recovery, two-household isolation, Google, household invitation/ledger/AI/Storage or backup/restore acceptance. Agent did not send email or access password/verification link. Next: household onboarding and personal/shared wallet pilot, then authorized financial/receipt confirmation checks; encrypted weekly backup/restore and independent encryption-key recovery remain release work.

Final generic-demo release: Production **c76a3570** at https://masuksaku.my.id and Development **33611182** at https://masuk-saku-development.pages.dev. Both wrappers passed build/preflight/upload. Hosted public checks verify matching currentJS/CSS, no personal-name string in both bundles or page copy, BCA Utama/BRI Harian preview labels and pengguna_saku signup example, no pageerrors. Production canonical320px/nooverflow/HTTPS/CSP/SPA/backend-only smoke passed; preview screenshot inspected. npm run check passed TypeScript+78unit/SQL+build;33/33browser tests passed after generic fixture ID updates. Formatting,30doclinks and48source SVG/emoji audit passed. No backend/migrations/Edge/SMTP/templates/hosted wallet or account data changed; no Deno rerun. Existing~656kB bundle advisory and operational/V1 backlog remain. These frontend releases supersede older95ae4223/db43c019 for current assets.

Brand assets release: supplied PNG/ICO/apple icons now deployed on both origins, Production64f9f8a6/Development58458d65. Browser manifest(non-PWA) and icon bytes match source via SHA256 checks. README cover/badges/Mermaid added. Fresh84unitSQL44demo16auth/build/format passed; canonicalProduction/assets/backend/CSP/SPA/mobile smoke passed. Database/Edge/SMTP unchanged.

28Septemberemailbranding: all13templatesupdatedwithbrandPNGheader via email-only isolatedconfigpush; noemailsent, notificationtoggles/SMTP/Googlepreserved. Local26templateviewports/actions/OTPpassed and actualPNGloadedat320/800nooverflow. PublicGoogleenabledboth/authorizecorrectcallbackchecked. AvatarBIMIcertificate/DNSnotconfigured. READMErewrittenforreadability; seeEMAIL-BRANDING.md.
