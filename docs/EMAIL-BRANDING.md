# Identitas pengirim email

Logo di isi email dan avatar pengirim di inbox adalah pengaturan berbeda.

## Logo template

Template Supabase memakai logo PNG brand yang sudah disajikan di domain aplikasi, melalui {{ .SiteURL }}/favicon-96x96.png. Nama Masuk Saku tetap berupa teks sehingga dapat dibaca saat penerima memblokir gambar. Perubahan header tidak mengubah tombol verifikasi, token, SMTP, provider Google atau notification toggles.

Ini tidak menetapkan avatar pengirim di Gmail. Delivery/rendering tetap perlu diuji melalui email yang diterima pengguna.

## Avatar domain melalui BIMI

Google mensyaratkan sertifikat VMC atau CMC untuk jalur BIMI di Gmail, serta DMARC dengan p=quarantine/reject dan pct=100. Logo harus memenuhi SVG Tiny P/S; favicon biasa belum tentu cocok. Sertifikat diterbitkan pihak ketiga, dan tidak tersedia dalam aset proyek saat ini.

Tidak ada sertifikat yang dibeli atau DNS/DMARC yang diubah pada tahap ini. Jangan menerapkan policy reject secara buta atau menyatakan logo pasti muncul hanya setelah menambah TXT/SVG. Pengelola perlu menyediakan sertifikat yang memenuhi syarat sebelum konfigurasi BIMI bisa dilengkapi. Pilihan gambar kontak penerima hanya memengaruhi kontak/inbox penerima tersebut.

Sumber resmi: [Google — Set up BIMI](https://knowledge.workspace.google.com/admin/security/set-up-bimi).

Keputusan pengelola28September2026: tanpa biaya tambahan, gunakan logo di isi email terlebih dahulu. Header berlogo dipasang ke13templateProduction; avatarBIMI ditunda. Tidak ada email uji dikirim oleh agent; tampilan inbox pengguna tetap perlu dicek.
