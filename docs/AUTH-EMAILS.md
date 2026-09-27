# Template email Masuk Saku

13 template berbahasa Indonesia untuk daftar Authentication dan Security pada Supabase. Desain memakai latar abu-abu, kartu putih, judul tebal, tombol charcoal, serta logo Masuk Saku di header. Email memakai Arial/Helvetica; nama brand tetap berupa teks ketika gambar diblokir. Tidak membutuhkan webfont, JavaScript, animasi atau emoji.

Logo PNG di isi email menggunakan domain aplikasi melalui SiteURL. Ini terpisah dari avatar pengirim di Gmail; baca [email branding](EMAIL-BRANDING.md) untuk persyaratan BIMI.

[Buka preview dan salin subject/HTML](../supabase/templates/preview.html). Preview adalah file lokal dengan data contoh, bukan email terkirim. Source ada pada [generator](../scripts/build-auth-emails.mjs), [manifest](../supabase/templates/manifest.json) dan file HTML berikut.

| Menu Supabase          | Template                                                                       | Subject                                     |
| ---------------------- | ------------------------------------------------------------------------------ | ------------------------------------------- |
| Confirm signup         | [confirmation.html](../supabase/templates/confirmation.html)                   | Konfirmasi email kamu — Masuk Saku          |
| Invite user            | [invite.html](../supabase/templates/invite.html)                               | Undangan membuat akun — Masuk Saku          |
| Magic link or OTP      | [magic_link.html](../supabase/templates/magic_link.html)                       | Tautan masuk kamu — Masuk Saku              |
| Change email address   | [email_change.html](../supabase/templates/email_change.html)                   | Konfirmasi perubahan email — Masuk Saku     |
| Reset password         | [recovery.html](../supabase/templates/recovery.html)                           | Atur ulang kata sandi — Masuk Saku          |
| Reauthentication       | [reauthentication.html](../supabase/templates/reauthentication.html)           | Kode verifikasi keamanan — Masuk Saku       |
| Password changed       | [password_changed.html](../supabase/templates/password_changed.html)           | Kata sandi akunmu berubah — Masuk Saku      |
| Email address changed  | [email_changed.html](../supabase/templates/email_changed.html)                 | Alamat email akunmu berubah — Masuk Saku    |
| Phone number changed   | [phone_changed.html](../supabase/templates/phone_changed.html)                 | Nomor telepon akunmu berubah — Masuk Saku   |
| Sign-in method linked  | [identity_linked.html](../supabase/templates/identity_linked.html)             | Metode masuk ditambahkan — Masuk Saku       |
| Sign-in method removed | [identity_unlinked.html](../supabase/templates/identity_unlinked.html)         | Metode masuk dihapus — Masuk Saku           |
| MFA method added       | [mfa_factor_enrolled.html](../supabase/templates/mfa_factor_enrolled.html)     | Verifikasi tambahan diaktifkan — Masuk Saku |
| MFA method removed     | [mfa_factor_unenrolled.html](../supabase/templates/mfa_factor_unenrolled.html) | Verifikasi tambahan dihapus — Masuk Saku    |

## Pemasangan dan status

Target remote adalah **Production snqkfrcxjfdjkwxjiabc**. Wrapper pemasangan telah dijalankan dengan Supabase CLI2.118.0. Config diff memeriksa subjects; config push membaca byte HTML dari content_path dan mengunggahnya bersama konfigurasi Auth. Subject remote diperiksa kembali. Status toggle keamanan tetap mengikuti pengaturan yang ada (ketujuhnya false pada pemeriksaan sesi ini); template tersedia meskipun toggle belum aktif. SMTP resend/smtp.resend.com dan callback https://masuksaku.my.id dipertahankan. Development tidak diubah.

```powershell
# Generate source files and local preview; no remote write/email.
node scripts/build-auth-emails.mjs
# Explicit Production only; updates template subjects/content.
./scripts/deploy-auth-emails-production.ps1
```

Wrapper memakai profile khusus ignored work/auth-email-cli, bukan relink Development. Profile hanya mendeklarasikan subject/content_path; tidak mendeklarasikan SMTP, provider, redirect, signup, atau toggle keamanan. Diff yang akan mengubah field lain ditolak. Jangan menganggap config diff subject-only sebagai pembandingan byte HTML remote; pengiriman dan tampilan di Gmail/Outlook perlu pilot inbox sendiri.

Untuk paste manual, buka **Supabase Production → Authentication → Email → Templates**, pilih menu yang cocok dengan tabel, tempel Subject dan HTML lalu Save. Preview menyediakan salin subject/HTML serta fallback Ctrl+C. [Fragment config lokal](../supabase/templates/config.fragment.toml) dapat digabung untuk Supabase lokal/self-host; status enabled pada notification dipilih terpisah sesuai kebutuhan operator. Jangan memasukkan API key atau password SMTP ke template.

## Tautan, kode dan batas flow

- Tombol dan tautan cadangan pada lima email tindakan memakai `{{ .ConfirmationURL }}` dari Supabase, tanpa merangkai token/redirect sendiri. Reauthentication hanya memakai `{{ .Token }}`. Panjang OTP dan masa berlaku mengikuti konfigurasi server; copy tidak mengunci jumlah digit atau menit.
- Footer dan notifikasi memakai `{{ .SiteURL }}`. Variabel khusus hanya dipakai pada jenis yang mendukungnya: NewEmail, OldEmail/Email, OldPhone/Phone, Provider dan FactorType. Tidak ada metadata username/nama keluarga atau data keuangan di email.
- Magic link menampilkan tautan dan kode; itu tidak menambahkan layar input OTP ke aplikasi. Template invite adalah undangan akun Auth, bukan undangan household pada HOUSEHOLD-INVITATIONS.md.
- Template reset password, email change, MFA dan notifications tidak berarti seluruh layar/flow tersebut sudah tersedia. SPA saat ini belum mempunyai form pemulihan kata sandi lengkap; jangan klaim reset end-to-end berhasil hanya karena template terpasang. Google/MFA/phone tidak diaktifkan oleh perubahan ini.
- Matikan link tracking pada provider email. Prefetch dari pemindai email dapat menghabiskan link sekali pakai; halaman perantara atau OTP flow memerlukan implementasi terpisah jika pilot menunjukkan masalah.

Sumber kontrak yang diperiksa: [Supabase email templates](https://supabase.com/docs/guides/auth/auth-email-templates), [local templates](https://supabase.com/docs/guides/local-development/customizing-email-templates), dan [CLI content-path upload](https://github.com/supabase/cli/pull/6489). Templates ditulis sendiri; tidak menyalin layout atau aset berlisensi pihak ketiga.

## Verifikasi

13 template diperiksa terhadap variabel/tautan yang tersedia, reauthentication code-only, notifikasi tanpa confirmation link, tanpa script/gambar/webfont/form. Render browser terisolasi pada320px dan800px (26 layout), termasuk URL/email panjang dan OTP8karakter, tidak overflow. Preview pemilih13jenis dan source untuk copy juga diuji. Screenshot confirmation mobile/desktop dan galeri diperiksa. Ini bukan uji kompatibilitas semua versi Outlook atau uji email nyata. Tidak ada akun, email, perubahan ledger atau panggilan provider yang dibuat pada sesi template ini. Bukti final dan batas deployment dicatat pada [VERIFICATION](VERIFICATION.md) dan [handoff](AGENT-HANDOFF.md).

## User-reported Production Auth pilot —27September2026

User reports email received and username login successful after signup/confirmation at https://masuksaku.my.id. This is genuine user-session feedback, not an agent-created/mocked account or agent inspection of inbox/tokens. Marks own-account signup→SMTP/template delivery→confirmation→username login pilot passed by user report. Does not prove every email type, password recovery, two-household isolation, Google, household invitation/ledger/AI/Storage or backup/restore acceptance. Agent did not send email or access password/verification link. Next: household onboarding and personal/shared wallet pilot, then authorized financial/receipt confirmation checks; encrypted weekly backup/restore and independent encryption-key recovery remain release work.
