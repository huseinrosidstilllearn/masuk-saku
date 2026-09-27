# Login Google

Frontend sudah memanggil Supabase signInWithOAuth dengan provider google, redirect ke origin aplikasi dan PKCE melalui Supabase SDK. Aktivasi provider membutuhkan Google OAuth client **Web application** dan konfigurasi dashboard; client Desktop untuk backup Drive bukan client login web.

## Google Auth Platform

1. Buka https://console.cloud.google.com/auth/clients dan pilih project milik pengelola.
2. Siapkan Branding/Audience aplikasi Masuk Saku dengan support email milik pengelola. Untuk Testing, tambahkan akun pilot pada Test users. Untuk akses publik, atur Audience sesuai kebutuhan peluncuran.
3. Gunakan hanya scope identitas: openid, userinfo.email, userinfo.profile. Jangan meminta Drive permission untuk login.
4. Buat OAuth client bertipe Web application, bernama Masuk Saku Web.
5. Authorized JavaScript origins:

```text
https://masuksaku.my.id
https://masuk-saku-development.pages.dev
```

6. Authorized redirect URIs — ini callback Supabase, bukan homepage frontend:

```text
https://snqkfrcxjfdjkwxjiabc.supabase.co/auth/v1/callback
https://kxezrgvnpoaqzcseymts.supabase.co/auth/v1/callback
```

Satu Web client dapat mencakup kedua origin/callback; deployment mandiri harus mengganti domain dan project refs dengan miliknya. Client terpisah per environment juga dapat digunakan.

## Supabase

Pada masing-masing project Development dan Production, buka Authentication → Sign In / Providers → Google. Aktifkan provider, masukkan Web Client ID dan Client Secret langsung di dashboard, lalu Save. Jangan kirim secret di chat, commit source, atau masukkan ke environment VITE.

Auth Site URL dan redirect allowlist harus tetap sesuai environment: Production https://masuksaku.my.id, Development https://masuk-saku-development.pages.dev. Jangan menyalin konfigurasi Development ke Production. Template config lokal default google disabled; jangan melakukan config push yang menimpa pengaturan dashboard setelah provider diaktifkan. Local Supabase memerlukan OAuth client/config/secrets sendiri.

## Verifikasi

- Periksa public Auth settings: external.google=true di masing-masing project.
- Klik Lanjutkan dengan Google dan pastikan origin callback/redirect sesuai environment.
- Pilot pengguna: pilih akun Google, kembali ke aplikasi, refresh, logout dan login ulang tanpa loop atau inactivity deadline lama.
- Pengguna Google dapat mengatur username di profil; username tidak otomatis membuat password. Keanggotaan dan akses ledger tetap melalui aturan Supabase/RLS, bukan Google metadata.
- Akun/email yang sudah ada mengikuti aturan identity linking Supabase; jangan membuat duplikat atau memindahkan data antaraccount secara manual untuk pengujian.

Public settings=true bukan bukti pilot login berhasil. Jangan mencatat token, OAuth code atau Client Secret dalam notes/output.

Sumber: [Supabase — Sign in with Google](https://supabase.com/docs/guides/auth/social-login/auth-google).

## Status terverifikasi —28September2026

Pengelola melaporkan setup selesai. Public Auth settings menunjukkan Google aktif di Development dan Production. Permintaan authorize di kedua project mengarah ke accounts.google.com dengan callback project yang benar. Pemeriksaan ini tidak memilih akun atau mengambil token; pilot kembali/login/refresh/logout dengan akun pengguna tetap perlu dikonfirmasi.
