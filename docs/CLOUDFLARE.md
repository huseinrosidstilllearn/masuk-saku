# Masuk Saku Development — Cloudflare Pages

Production domain pengguna masuksaku.my.id dibahas dalam [PRODUCTION](PRODUCTION.md). Proyek masuk-saku-production/domain association belum dibuat pada sesi persiapan; jangan menempelkan domain Production ke proyek Development ini.

Situs: [masuk-saku-development.pages.dev](https://masuk-saku-development.pages.dev). Proyek Pages: masuk-saku-development, branch main. Ini frontend Development yang memakai Supabase kxezrgvnpoaqzcseymts. Label production deployment di Pages berarti alias utama proyek ini, bukan Supabase Production.

Deploy terbaru sesi27September2026: [ed4d1db3.masuk-saku-development.pages.dev](https://ed4d1db3.masuk-saku-development.pages.dev). Build mengunggah23 file statis dan _headers. Tidak ada Pages Functions/Workers/R2 bindings. Storage tetap private Supabase. Supabase Production snqkfrcxjfdjkwxjiabc tidak dipasang/diubah oleh deployment ini.

## Deployment ulang

Jalankan dari Windows dengan Node dan Wrangler login aktif:

```powershell
./scripts/deploy-pages-development.ps1
```

Script membangun ulang Development ke ignored work/cloudflare-development, memeriksa backend yang tertanam/CSP/_headers/SPA fallback, lalu deploy lewat Wrangler4.112.0. Jika ada beberapa akun, berikan -AccountId ID_AKUN_YANG_DIPILIH. Tidak membaca atau menyalin token OAuth. Wrangler menyimpan kredensial encrypted dengan Windows Credential Manager; scopes account/user read + Pages write cukup untuk jalur ini.

Jangan upload dist untuk Development: npm run check/build membangun dist dengan environment Production. Vite shell environment dapat menimpa file env; preflight menolak artifact yang tidak berisi endpoint Development atau berisi endpoint Production. Jangan mengunggah folder proyek, file env, work lain, source maps, secret recovery atau database backup.

Wrangler4.141.0 pada sesi ini mendelegasikan pages project create ke Workers dan gagal tanpa entry point. Tidak ada resource dibuat pada percobaan itu. Versi4.112.0 membuat dan deploy Pages langsung sesuai arsitektur yang disepakati; pertahankan pin sampai perubahan CLI ditinjau. Proyek Direct Upload ini tidak memakai Git integration. CI mendatang dapat membangun lalu mengunggah lewat Wrangler tanpa mengganti menjadi Workers. Referensi: [Direct Upload](https://developers.cloudflare.com/pages/get-started/direct-upload/), [Pages commands](https://developers.cloudflare.com/workers/wrangler/commands/pages/).

## Supabase origin

Auth Site URL adalah https://masuk-saku-development.pages.dev. Redirect allowlist mencakup origin itu dan localhost/127.0.0.1 port5173. ALLOWED_ORIGINS Edge juga memuat tiga origin tersebut; hanya secret ini yang diupdate, encryption/maintenance keys dipertahankan. Tidak ada wildcard preview: untuk memakai URL deploy hash sebagai login/AI origin, tambahkan exact URL secara sadar, atau gunakan canonical site di atas.

Config push hanya mengubah Site URL dan redirect allowlist. Remote-only OTP/rate/MFA/pooler/storage settings tidak ditimpa. config diff sesudah push menunjukkan0 update. supabase/config.toml sekarang mewakili origin hosted Development; local-only operator dapat membuat konfigurasi terpisah dengan origin lokal.

CSP mengizinkan font self dan data untuk font bundled Vite/@fontsource. Script tetap self; tidak ada unsafe-eval atau remote script. Header nosniff, frame-ancestors none, base-uri/form-action self dan Permissions-Policy tetap. deep URL mendapat fallback index.html tanpa root404.html.

## Status verifikasi

- Canonical HTTPS HTTP200; login/daftar nyata terlihat, bukan demo; tidak ada error JavaScript/CSP pada browser terisolasi; tidak overflow320px; SPA fallback HTTP200.
- Kelima Edge: OPTIONS origin situs204 dengan exact CORS; origin asing403 tanpa allow header. Request valid tanpa Authorization401; tidak ada provider call, upload tersimpan atau ledger mutation pada smoke test. Upload malformed JSON sekarang400.
- attachment-upload diperbaiki parsing multipart dan deployed ulang Development; dua tes Deno tambahan, seluruh delapan tes Deno dan checks lima functions lolos.
- Akun nyata login/signup/email delivery, undangan dua akun, BYOK OpenRouter/provider/receipt-confirm dan session lock tetap membutuhkan pilot. Agent tidak mengirim email, membuat akun pengguna atau mengubah data keuangan nyata pada sesi deploy.

Untuk mulai memakai: buka situs, daftar/konfirmasi email/login, buat household atau terima undangan. Masukkan OpenRouter BYOK melalui Pengaturan untuk AI; jangan kirim key di chat. Google OAuth belum diaktifkan. Backup dan maintenance schedule masih perlu diaktifkan; aplikasi hosted belum dinyatakan seluruh V1 selesai.

Verifikasi regresi final:66 unit/SQL +20 browser +8 Deno =94 tes lolos; TypeScript/build,format/doclinks/SVG audit lolos. Script deployment PowerShell syntax-checked; wrapper belum diuji end-to-end, sedangkan build/preflight/deploy command yang setara sudah dijalankan sukses.

## Production deployment — 27 September 2026

Latest verified status supersedes older preparation-only entries. Production Supabase **snqkfrcxjfdjkwxjiabc** has **8/8 migrations applied** and **6 ACTIVE v1 Edge functions**. Cloudflare project **masuk-saku-production** is deployed: **95ae4223**, [Pages](https://masuk-saku-production.pages.dev), [immutable](https://95ae4223.masuk-saku-production.pages.dev). Canonical **https://masuksaku.my.id** now serves the Production app over verified HTTPS; current assets match deployment95ae4223. Development db43c019 and primary CLI link kxezrgvnpoaqzcseymts remain unchanged. No Dev data or keys copied.

Production Auth Site URL/redirect and Edge CORS use exact https://masuksaku.my.id; REST max_rows10000, Storage max10MiB. Google disabled. Resend domain Verified from user screenshot. SMTP remote enabled, host smtp.resend.com:465, sender noreply@masuksaku.my.id, display name Masuk Saku ID; username currently **masuksakuwebapp**, which must become **resend**. User is filling dashboard settings; correction requested. No SMTP password printed or requested. Delivery/signup/confirmation/username login have not been piloted.

Unique Production encryption and maintenance keys uploaded; Windows DPAPI recovery at ignored work/production-secrets/edge.recovery.dpapi.txt, restricted to the current Windows user. This recovery is user/machine-bound; independently recoverable secret-manager copy remains required before real BYOK/data. Never rotate encryption key casually. Plaintext upload/env and temporary Vault SQL removed. Production profile at ignored work/production-cli is code/config only, not a Dev secret copy. CLI2.118 config push changes declared fields only and preserved undeclared SMTP settings.

Maintenance is now scheduled **every15minutes** via pg_cron/pg_net, Vault bearer and private.enqueue_production_maintenance(). Job1 active; scheduled run at06:00UTC succeeded; manual and scheduled HTTP responses both200 with0 attachments removed/0transactions purged. No expired fixture exercised, so physical retention acceptance remains pending. See [operations SQL](../supabase/operations/production-maintenance.sql) and [setup script](../scripts/enable-production-maintenance.ps1). Important managed ACL limit: Supabase owns net objects as supabase_admin; postgres REVOKE did not remove PUBLIC table access. net is not API-exposed and no application RPC reads its queue; wrapper EXECUTE denied to anon/authenticated/service_role. Do not grant application users raw SQL access or expose net. This is an explicit operational limit, not a successful table-revoke claim. Weekly encrypted backup/restore drill is still **not active**.

Fresh Production verification: deploy wrapper build/preflight/upload succeeded; public Pages200/current assets/Production backend only/CSP/SPA/signup username/320px no overflow/no pageerrors, screenshot docs/screenshots/production-signup.png inspected. Real backend anonymous/auth/CORS/quota/resolver smokes passed without signup/email/provider/ledger writes. Deno checks all6functions and11/11shared tests passed. Earlier npm check78unit/SQL and33browser results remain separately dated; browser regression suite not rerun for this operations-only slice. Existing~656kB bundle advisory persists. No Git remote/publication; complete V1 not claimed.

Next: user fixes SMTP username, connects Cloudflare Custom domain; verify canonical and safe SMTP fields, then own-account signup/email confirmation/username login and authorized household/receipt/BYOK pilot. Activate encrypted weekly backup and rehearse restore; retain unresolved Google/R2/PDF/recurring/rollover/import/report backlog. Browser control failed Transport closed; do not extract browser/CLI credentials as a workaround.

Final generic-demo release: Production **c76a3570** at https://masuksaku.my.id and Development **33611182** at https://masuk-saku-development.pages.dev. Both wrappers passed build/preflight/upload. Hosted public checks verify matching currentJS/CSS, no personal-name string in both bundles or page copy, BCA Utama/BRI Harian preview labels and pengguna_saku signup example, no pageerrors. Production canonical320px/nooverflow/HTTPS/CSP/SPA/backend-only smoke passed; preview screenshot inspected. npm run check passed TypeScript+78unit/SQL+build;33/33browser tests passed after generic fixture ID updates. Formatting,30doclinks and48source SVG/emoji audit passed. No backend/migrations/Edge/SMTP/templates/hosted wallet or account data changed; no Deno rerun. Existing~656kB bundle advisory and operational/V1 backlog remain. These frontend releases supersede older95ae4223/db43c019 for current assets.
