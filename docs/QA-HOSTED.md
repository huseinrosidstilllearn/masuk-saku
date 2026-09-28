# Hasil pengujian Development

Pengujian langsung dilakukan pada **28 September 2026** di [Development](https://masuk-saku-development.pages.dev/). Versi akhir yang diuji adalah deployment `365f1032`, dari commit aplikasi `7726159`. Backend tetap menggunakan 17 migrasi dan enam Edge functions. Production tidak diperbarui pada sesi ini.

Pengujian memakai akun Owner, Member, dan pengguna luar sementara dengan autentikasi Supabase sesungguhnya. Pengujian browser memakai dua sesi terpisah. Respons API keuangan tidak diganti dengan data simulasi.

## Bug yang ditemukan dan diperbaiki

Saldo Member kadang tertinggal setelah Owner menyimpan transaksi. Transaksi dan saldo database tetap benar, tetapi perubahan yang terjadi sebelum langganan realtime siap tidak dikirim ulang ke sesi Member.

Menunda permintaan bergabung WebSocket selama lima detik membuat masalah ini dapat diulang: Owner sudah menyimpan pemasukan, tetapi Member tetap menampilkan saldo lama meskipun koneksinya kemudian siap. Perbaikan menunggu kesiapan langganan PostgreSQL dan memuat ulang snapshot saat koneksi siap atau tersambung kembali. Callback dari langganan yang sudah dihentikan diabaikan.

Dua tes regresi gagal pada perilaku sebelumnya dan lulus setelah perbaikan. Tes hosted dengan penundaan koneksi yang sama juga lulus: saldo Member menyusul tanpa reload, meskipun tidak menerima event transaksi yang sudah lewat. Pengulangan alur keuangan lengkap pada versi akhir lulus.

## Alur yang diperiksa

| Alur                          | Hasil dan cakupan                                                                                                                                                                                                                                    |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Beranda dan halaman akun      | Beranda tanpa form login; URL masuk/daftar, refresh, tautan kembali, dan aset terbaru bekerja.                                                                                                                                                       |
| Demo publik                   | Transaksi contoh hanya mengubah data lokal. Idle 15 menit dan reload mereset data; tidak ada penulisan Supabase.                                                                                                                                     |
| Login                         | Owner masuk dengan email, Member dengan username. Akun uji dikonfirmasi melalui admin; pengiriman email tidak diuji ulang.                                                                                                                           |
| Keluarga dan isolasi          | Undangan terikat email, akun terverifikasi dapat bergabung, pengguna luar ditolak, dan pencabutan anggota menghentikan akses.                                                                                                                        |
| Izin transaksi                | Actor yang berbeda dari creator tidak dapat menghapus transaksi milik creator. Izin Owner juga diperiksa.                                                                                                                                            |
| Pencatatan melalui UI         | Pemasukan, pengeluaran, dan transfer dengan biaya admin tersimpan setelah konfirmasi. Preview belum mengubah saldo.                                                                                                                                  |
| Pembaruan antaranggota        | Kedua sesi menunjukkan saldo yang sama tanpa reload, termasuk setelah koneksi awal sengaja diperlambat.                                                                                                                                              |
| Sampah dan pemulihan          | Menghapus pengeluaran mengembalikan saldo; pemulihan oleh Owner menerapkan kembali pengeluaran tersebut.                                                                                                                                             |
| Transaksi berulang            | Proposal belum mengubah saldo; konfirmasi mencatat satu transaksi. Pemeriksaan ulang tidak menggandakan. RPC menolak konfirmasi tanpa izin dan menghentikan auto milik creator yang dicabut.                                                         |
| Anggaran                      | Penutupan periode menghasilkan satu penerus dengan carryover. Retry tidak menggandakan, periode tertutup tidak dapat diedit, dan saldo dompet tidak berubah.                                                                                         |
| Impor                         | RPC append untuk Owner, pemetaan ID/anggota, dan retry tanpa duplikasi lulus. Upload JSON melalui UI tidak termasuk pengujian ini.                                                                                                                   |
| Lampiran privat               | Upload/download memakai JWT berhasil, pengguna luar ditolak, dan metadata kedaluwarsa tercatat. Seluruh masa retensi belum ditunggu.                                                                                                                 |
| PDF struk                     | PDF dirender lokal sebagai gambar pada situs hosted dengan CSP aktif. Ini bukan tes keberhasilan OCR.                                                                                                                                                |
| BYOK dan kegagalan AI         | Tanpa key ditolak dengan 409. Key uji disimpan melalui layanan terenkripsi; status tidak mengembalikan key dan Member tidak dapat melihatnya. OpenRouter menolak key sengaja tidak valid; respons server 502 tidak mengubah ledger. Key uji dicabut. |
| Layout dan penyamaran nominal | Menu utama, berulang, draf, dan aktivitas diuji pada 320/768/1440 piksel: tidak ada overflow horizontal atau error JavaScript. Nominal langsung tersembunyi saat masking diaktifkan.                                                                 |

API izin, impor, dan Storage diuji pada backend Development yang sama sebelum perubahan frontend; tidak ada perubahan backend dalam perbaikan ini. Alur browser dan tes koneksi lambat diulang pada deployment akhir.

## Pemeriksaan saldo

| Langkah                                | Total saldo |
| -------------------------------------- | ----------: |
| Dua dompet awal: Rp100.000 + Rp50.000  |   Rp150.000 |
| Pemasukan Rp20.000                     |   Rp170.000 |
| Pengeluaran Rp10.000                   |   Rp160.000 |
| Transfer Rp10.000, biaya admin Rp1.000 |   Rp159.000 |
| Pengeluaran dipindahkan ke sampah      |   Rp169.000 |
| Pengeluaran dipulihkan                 |   Rp159.000 |
| Konfirmasi transaksi berulang Rp1.000  |   Rp158.000 |

Penutupan anggaran dan kegagalan AI mempertahankan saldo Rp158.000. Nilai diperiksa di dua sesi browser dan view database `wallet_balances`.

## Verifikasi kode dan pembersihan

Verifikasi lokal lulus: **97 tes unit/domain/SQL, 50 tes browser demo, dan 20 tes akun**, serta typecheck, build, dan format. Pemeriksaan staged source, Gitleaks, dan diff juga lulus sebelum publikasi kode. Bukti CI dicatat di [Verification](VERIFICATION.md).

Seluruh akun, household, ledger, rencana, jadwal, lampiran, dan kredensial sintetis dibersihkan. Cleanup akun AI perlu menghapus counter kuota milik UID uji terlebih dahulu karena foreign key; harness diperbaiki dan pengulangan selesai dengan exit code 0. Data pengguna asli tidak diubah.

## Batas hasil ini

Tes ini belum membuktikan ekstraksi AI dengan key valid, kamera fisik, pengalaman keluarga pada dua perangkat fisik, pengiriman email/Google OAuth ulang, seluruh masa retensi, restore database dan Storage ke lingkungan terpisah, salinan pemulihan kunci, atau instalasi self-host bersih. Backup terenkripsi sebelumnya telah diperiksa terpisah dalam [handoff](AGENT-HANDOFF.md).

Alur yang tercantum lulus setelah perbaikan. Hasil tersebut belum berarti seluruh acceptance peluncuran selesai.
