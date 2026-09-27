# Undangan anggota keluarga

## Cara memakai

1. Owner login, buka Pengaturan → Anggota keluarga → Undang anggota.
2. Masukkan email penerima. Buat kode, salin, lalu bagikan secara manual langsung kepada penerima. Aplikasi tidak mengirim email/Telegram otomatis.
3. Penerima mendaftar/login memakai email yang sama dan mengonfirmasi email akun. Jangan membuat household sendiri jika hendak bergabung.
4. Pada onboarding pilih Punya kode undangan? Bergabung, isi nama panggilan dan kode, lalu Terima undangan.
5. Penerima menjadi Member. Setelah bergabung, seluruh dompet dan transaksi household terlihat, termasuk dompet berlabel personal. Kepemilikan dompet menentukan perhitungan dashboard, bukan pembatasan akses.

Kode berlaku tujuh hari. Owner dapat membatalkan undangan yang belum diterima. Kode hanya ditampilkan setelah dibuat dan tidak disimpan pada URL/localStorage. Jika kode hilang, batalkan undangan aktif dan buat yang baru. Daftar menampilkan maksimal100 undangan terbaru; maksimal20 undangan aktif per household. Undangan yang sudah diterima tidak dapat dibatalkan untuk menghapus anggota.

Mode demo menampilkan form tetapi tidak membuat undangan nyata. Pergantian household, penghapusan anggota dan pengiriman email otomatis belum tersedia. Akun yang sudah memiliki membership ditolak pada operasi penerimaan undangan baru; backend lama masih mendukung beberapa household, sementara loader aplikasi memilih membership pertama. Jangan memakai pembuatan household tambahan untuk mengganti household aktif.

## Kontrak server

| RPC                                                           | Guard dan hasil                                                                                                                            |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| create_household_invitation(p_household,p_email,p_id,p_token) | Owner; recipient email dinormalisasi; client UUID dan kode64hex tetap saat retry; tujuh hari; UUID undangan                                |
| list_household_invitations(p_household)                       | Owner; metadata id/email/timestamps/status; tidak mengembalikan kode atau hash                                                             |
| revoke_household_invitation(p_id)                             | Owner household terkait; row lock; idempotent untuk undangan yang sudah dibatalkan; menolak undangan accepted                              |
| accept_household_invitation(p_token,p_display_name)           | Authenticated; email verified dari auth.users cocok; kode aktif; belum memiliki membership; insert Member + consume atomik; UUID household |

Raw code dibuat dari dua crypto.randomUUID di browser, dikirim hanya dalam body RPC melalui HTTPS (localhost untuk development). private.household_invitations menyimpan SHA-256 kode. Tidak ada akses tabel langsung untuk public/anon/authenticated. Semua RPC security definer memakai search_path kosong, auth.uid dan pemeriksaan role/membership. Membership tidak menerima role dari browser. Locks menserialisasi pembuatan undangan dalam household dan penerimaan per akun/kode. Retry accept oleh penerima yang sama mengembalikan household tanpa menambah membership/audit lagi. Audit hanya berisi actor/entity/action, tanpa kode/email. Backup template mencakup private schema.

Email confirmation di Supabase Auth harus tetap aktif. email_confirmed_at menjadi acuan server; Supabase dapat mengisi field ini secara otomatis jika Confirm Email dimatikan. Development diperiksa pada27September2026: mailer_autoconfirm=false. Rujukan resmi: [Supabase users](https://supabase.com/docs/guides/auth/users), [Auth general configuration](https://supabase.com/docs/guides/auth/general-configuration).

## Pilot hosted yang masih diperlukan

Gunakan Owner dan akun uji penerima dalam dua browser/profil. Buat undangan di Development; sebelum join, penerima tidak dapat membaca wallet household. Login dengan email berbeda harus gagal tanpa menghabiskan kode. Login dengan email tujuan, terima, lalu cek peran Member dan data household. Coba ulang kode pada akun yang sama; cek membership tidak berlipat. Coba kode yang dibatalkan/kedaluwarsa, serta Member membuat/membatalkan undangan. Jangan menyimpan kode, password, key AI atau data finansial pengguna dalam laporan.

Untuk pilot AI, Owner memasukkan BYOK OpenRouter di Pengaturan, bukan chat. Uji teks dan gambar struk kecil melalui preview, koreksi, lalu konfirmasi satu kali; cocokkan ledger dan lampiran. Demo/local SQL/browser tests bukan bukti bahwa provider gratis tertentu mendukung gambar atau tersedia saat pilot.

## Bukti sesi

Migration202609270007 diterapkan ke Supabase Development; tujuh migrasi Local/Remote cocok. Empat RPC menolak anonymous HTTP401/42501. 66 unit/SQL dan20 browser tests lolos, TypeScript/build lolos. Browser onboarding diuji lewat fixture komponen dalam mode demo; penerimaan akun hosted nyata belum diuji. Tidak ada undangan/email nyata dikirim oleh agent. Production dan Edge Functions tidak diubah.
