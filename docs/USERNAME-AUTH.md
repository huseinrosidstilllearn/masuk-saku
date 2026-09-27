# Username untuk akses akun

Keputusan pengguna27September2026: login boleh dengan username, dan form daftar wajib menyediakan username. Email/password dan Google tetap tersedia. Username merupakan identitas login global, bukan display_name anggota household, wallet_owner atau otoritas finansial.

## Perilaku

- Daftar: email, username, password. Username3–30 karakter ASCII huruf/angka/underscore, karakter pertama huruf/angka; huruf besar dinormalisasi menjadi huruf kecil. Email tetap perlu dikonfirmasi sesuai konfigurasi Auth.
- Login: satu kolom **Username atau email** + password. Email memakai Supabase Auth langsung; username memakai username-login lalu memasang access/refresh token dengan Auth setSession. Sesi tetap menggunakan sessionStorage dan penguncian sesi yang sudah ada.
- Akun lama masuk memakai email, lalu buka **Pengaturan > Username akun** untuk mengklaim username. Tidak ada backfill nama dari alamat email atau display_name keluarga.
- Anggota hanya bisa membaca/mengubah username akunnya sendiri. Perubahan username membuat nama lama tidak lagi masuk ke akun itu; username lama bisa diklaim pengguna lain. Keunikan dijamin constraint SQL, termasuk permintaan bersamaan.
- Akun Google tanpa password tetap memakai Google. Menambahkan username tidak menciptakan password baru. Provider Google Development masih perlu konfigurasi; fitur ini tidak mengaktifkannya.

## Database dan endpoint

Migration202609270008_account_usernames.sql menambahkan private.account_usernames(user_id PK/FK Auth ON DELETE CASCADE, username UNIQUE/check, updated_at), RLS tanpa policy browser, dan private.username_login_limits. Tidak menyimpan salinan email.

Trigger AFTER INSERT auth.users membaca username signup dari raw_user_meta_data sekali, menormalisasi dan mengklaimnya atomik. Duplicate/invalid handle menggagalkan insert Auth tanpa akun setengah jadi. Insert tanpa username tetap sah untuk kompatibilitas akun lama/OAuth/API; form daftar aplikasi mewajibkannya. UPDATE metadata tidak mengubah handle atau permission. Trigger tidak memberi role/household.

RPC authenticated: get_my_username() dan set_my_username(p_username). Keduanya memakai auth.uid() tanpa menerima user_id. Email resolver resolve_username_email(p_username) dan quota consume_username_login_quota(p_key) hanya service_role; owner household pun tidak boleh memanggilnya. Resolver join email terkini di auth.users, sehingga perubahan email melalui Auth tidak merusak login.

POST /functions/v1/username-login: {username,password}. Public, verify_jwt=false karena belum ada sesi. Shared HTTP wrapper membatasi body4096byte, POST/OPTIONS, origin allowlist, no-store, error sanitized. Handler validasi, normalisasi, konsumsi quota, resolve privat, lalu signInWithPassword dengan Auth anonymous client tanpa persist/refresh server. Auth tetap memeriksa password dan konfirmasi email; service-role hanya untuk resolver/quota, bukan bypass password. Respons sukses hanya {access_token,refresh_token}; frontend memanggil setSession. Tidak mengembalikan email/user profile pada endpoint ini.

Format buruk400, password salah/username tak ada/email belum dikonfirmasi401 dengan pesan sama, quota429, gangguan Auth/database503. Unknown username tetap melalui request Auth dengan alamat dummy non-deliverable; tidak mengirim email. Ini mengurangi perbedaan jalur, bukan jaminan waktu respons konstan. Tidak ada endpoint daftar username atau cek email anonim.

Rate limit DB atomik:10 request per normalized-username SHA256 per bucket10menit, global1000 per bucket10menit; penghitung dibatasi, global yang habis tidak menambah row identifier baru. Row >1hari dibersihkan saat pemakaian berikutnya; bukan scheduler. Limit diterapkan pada semua percobaan termasuk sukses, bukan IP. Supabase Auth punya pembatasan sendiri. Public endpoint/password flow tetap dapat mengalami abuse/lockout; CAPTCHA/adaptive IP controls belum ditambahkan. Jangan menganggap CORS sebagai autentikasi. Hash identifier masih data pseudonim, bukan anonimitas kuat.

## Deploy dan verifikasi

Target hanya Supabase/Pages Development. Jalankan migrations dahulu, deploy username-login, baru frontend Development. Bootstrap untuk proyek baru memuat semua8 migrations; jangan menjalankan bootstrap pada proyek yang sudah bermigrasi. Secret service-role/anon server bawaan runtime Supabase; tidak perlu secret baru di frontend. ALLOWED_ORIGINS tetap daftar origin yang sudah dikonfigurasi.

Signup failure karena collision di trigger disanitasi Supabase menjadi database error; UI menyarankan username lain/ulang nanti tanpa membuka email terkait. Tidak ada availability check sebelum signup, sehingga constraint tetap sumber kebenaran. Registrasi email yang sudah ada mengikuti respons generic Supabase, bukan penggantian username akun lama; pengguna lama harus masuk lalu mengubah Pengaturan.

Tests: unit routing/email/username/setSession/signup metadata; PostgreSQL seluruh8 migrations dengan normalization/rollback/collision/metadata non-authority/current email/permissions/quota; Deno orchestration/unknown-vs-wrong/quota; browser320px validation/toggle/username input. Tes fixture memakai kredensial palsu lokal, tidak akun pengguna. Bukti hosted dan batas verifikasi ada di [VERIFICATION](VERIFICATION.md).

Referensi resmi yang ditinjau: [Supabase password sign-in](https://supabase.com/docs/reference/javascript/auth-signinwithpassword), [Password Auth](https://supabase.com/docs/guides/auth/passwords), [Edge authentication](https://supabase.com/docs/guides/functions/auth). Supabase native menerima email/phone; username adalah adapter aplikasi, bukan provider Auth baru.
