# Uji pemulihan backup — 28 September 2026

Backup berhasil dipulihkan ke Supabase lokal yang terisolasi. Data snapshot cocok, saldo tidak berubah setelah peningkatan skema, dan login serta akses privat berhasil diuji. Production dan Development tidak direset atau dipulihkan dari backup.

## Snapshot dan lingkungan uji

Snapshot berasal dari [backup sebelum promosi Production, run 36401935020](https://github.com/huseinrosidstilllearn/masuk-saku/actions/runs/36401935020). Database diambil pada 09:12 UTC, Storage pada 09:13 UTC. Keduanya didekripsi dengan identitas age milik operator di direktori Windows yang dibatasi ACL.

| Arsip terenkripsi                             | SHA256                                                             |
| --------------------------------------------- | ------------------------------------------------------------------ |
| `masuk-saku-20260928T091205Z.dump.age`        | `78cf84cc77cbfe8db83bee2f6f25644d4243271a7ab0035dbaa6da805a9af54f` |
| `masuk-saku-20260928T091308Z.storage.tar.age` | `6971bb8cce1637b0d58b505d1bfba07f33bd20125f21458f0102525d3569e5af` |

Lingkungan uji memakai Docker Engine di Ubuntu WSL dan sumber Supabase bertag `self-hosted/v0.8.2`, commit `564eab8ad7840b13324f68b1bfac074ef8d51c21`. PostgreSQL lokal 17.6, sama dengan versi utama snapshot. Build lokal `17.6.1.136` berbeda dari build managed `17.6.1.166`; kompatibilitas diperiksa sebelum import. Auth, PostgREST, dan Storage berjalan pada jaringan internal Docker tanpa akses keluar, dengan proxy API hanya pada loopback. Password database dan JWT lokal dibuat baru.

## Cara pemulihan yang diuji

1. Periksa daftar isi dump dan kolom setiap tabel. Mulai Auth/Storage lokal untuk membuat skema platform, kemudian hentikan kedua layanan selama import.
2. Terapkan migrasi aplikasi 1–11, sesuai usia snapshot. Ini memasang kembali grants, RLS, fungsi, trigger, dan constraint dari sumber proyek.
3. Tinjau perbedaan Auth: empat tabel MFA recovery/SCIM beserta constraint dan 14 indeks sekunder belum tersedia secara lokal. Pulihkan definisinya dari dump dan tambahkan `auth.one_time_tokens.expires_at`. Ownership dan hak akses tabel tambahan dibatasi ke administrator Auth.
4. Import seluruh 56 tabel data aplikasi/Auth/Storage dalam satu transaksi lokal. Trigger dinonaktifkan hanya selama import untuk menangani referensi melingkar. Dua nilai sequence dipulihkan. Riwayat migrasi vendor `auth.schema_migrations` dan `storage.migrations` tetap mengikuti layanan lokal, sehingga dua tabel itu tidak ditimpa dengan riwayat managed.
5. Bandingkan seluruh baris pada kolom snapshot, lalu hitung saldo dari ledger secara terpisah dengan integer. Terapkan migrasi 12–17 dan ulangi perbandingan kolom lama, saldo, foreign key, dan check constraint.
6. Hidupkan kembali layanan dan uji Auth/API/Storage menggunakan JWT lokal. Perubahan password dan akun probe hanya terjadi pada salinan terisolasi.

Jangan menerapkan patch Auth tersebut secara otomatis ke versi platform lain. Pemeriksaan kolom harus menolak data nonkosong yang tidak kompatibel. Dump dibuat dengan `--no-owner --no-acl`; memulihkan data atau DDL saja tidak memasang kembali izin aplikasi. Panduan resmi [restore dari platform](https://supabase.com/docs/guides/self-hosting/restore-from-platform) dan [Docker Supabase](https://supabase.com/docs/guides/self-hosting/docker) tetap menjadi acuan untuk target lain.

## Hasil pemeriksaan

| Pemeriksaan                 | Hasil                                                                                                                                                                                                                                                    |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Data snapshot               | Seluruh baris dari 56 tabel cocok; dua riwayat migrasi vendor sengaja dikecualikan.                                                                                                                                                                      |
| Saldo dan peningkatan skema | Perhitungan integer dari snapshot cocok dengan view saldo. Migrasi 12–17 tidak mengubah saldo atau kolom data lama.                                                                                                                                      |
| Integritas data             | 199 pemeriksaan foreign key/check constraint tidak menemukan pelanggaran.                                                                                                                                                                                |
| Auth dan identitas          | Password login pada Owner yang dipulihkan mempertahankan user ID, keanggotaan, username, dan saldo.                                                                                                                                                      |
| Isolasi keluarga            | JWT keluarga lain tidak dapat membaca dompet/anggota atau mengubah dompet keluarga yang dipulihkan. Anonymous tidak mendapat saldo; schema kredensial privat tidak terekspos.                                                                            |
| Storage snapshot terbaru    | Kedua bucket privat dan pengaturannya cocok. Snapshot ini memang tidak memiliki objek, sehingga tidak membuktikan pemulihan byte sendirian.                                                                                                              |
| Probe byte Storage          | Satu gambar sintetis dari [arsip sebelumnya, run 36388892689](https://github.com/huseinrosidstilllearn/masuk-saku/actions/runs/36388892689), dipulihkan dan diunduh dengan SHA256 identik. Ini probe tambahan, bukan objek dari pasangan snapshot utama. |
| Akses gambar                | Anonymous/akun asing ditolak; upload/read avatar milik akun lokal berhasil dengan byte identik dan ditolak bagi akun lain.                                                                                                                               |
| Pemulihan kunci server      | Berkas pemulihan age portabel cocok dengan kunci server saat ini dan berhasil mendekripsi ciphertext BYOK yang tersimpan. Konteks AES-GCM yang salah ditolak. Tidak ada API key yang dicetak atau dipakai menghubungi provider.                          |

Persiapan lingkungan pertama hingga pemeriksaan Auth/Storage membutuhkan sekitar **26 menit**. Angka ini mencakup download image dan perbaikan lingkungan WSL; bukan SLA atau jaminan RTO deployment penuh.

## Backup terbaru dan pembersihan

Setelah latihan, [backup Production 36435944403](https://github.com/huseinrosidstilllearn/masuk-saku/actions/runs/36435944403) berhasil pada 14:26–14:27 UTC: dump database, enkripsi Storage, upload Google Drive/checksum, dan artifact terenkripsi. Dump baru didekripsi ke memori dan daftar isinya memuat fungsi/tabel setelah promosi, termasuk recurring, rollover, import, wallet lifecycle, dan discard draft. Backup baru diperiksa inventarisnya; latihan restore penuh di atas menggunakan snapshot sebelumnya.

Container, volume database/Storage, proxy lokal, konfigurasi runtime, dan seluruh berkas plaintext uji sudah dihapus. Arsip terenkripsi, identitas pemulihan yang dibatasi ACL, serta ringkasan hasil tanpa data pribadi tetap berada di penyimpanan operator. Docker/image cache WSL dapat dipakai lagi; tidak ada salinan database keluarga yang berjalan.

## Batas bukti dan pekerjaan berikutnya

- Salinan identitas age dan pemulihan server pada perangkat/tempat aman yang independen belum dibuktikan. Keberhasilan decrypt pada komputer ini tidak membuktikan pemulihan setelah komputer hilang.
- Snapshot database dan Storage diambil berurutan, bukan atomik. Pada pemulihan nyata, cocokkan setiap path/objek dengan metadata dan kebijakan retensinya; tandai objek yang memang sudah hilang.
- Edge functions, realtime, cron/Vault, OAuth Google, SMTP, domain, dan konfigurasi frontend perlu dipasang dari kode/config operator. Latihan ini tidak menguji deployment ulang seluruh layanan tersebut.
- Pilot AI dengan key valid, kamera dan dua perangkat fisik, serta instalasi self-host lengkap tetap menjadi syarat rilis V1.
