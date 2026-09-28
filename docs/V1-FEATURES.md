# Fitur V1 dan panduan penggunaan

Status 28 September 2026: seluruh domain V1 tersedia dalam kode dan dipasang terlebih dahulu di Development. Promosi Production dan pemeriksaan peluncuran dicatat terpisah dari kelengkapan fitur.

## Dompet

**Dompet → Tambah dompet** tersedia untuk Owner. Atur bank/tunai/e-wallet, pemilik pribadi/bersama, saldo awal termasuk negatif, ikon, warna dan identitas rekening opsional. Perubahan memerlukan konfirmasi; saldo berjalan tetap dihitung dari ledger. Mengubah saldo awal/pemilik memengaruhi ringkasan sesuai penjelasan form.

Arsip mengeluarkan dompet dari saldo aktif tanpa menghapus catatan. Pilih **Diarsipkan** untuk mengaktifkannya kembali. Laporan historis tetap memasukkan transaksi dompet itu. `save_wallet` memakai versi dan menerima retry identik tanpa mengulang perubahan.

## Transaksi dan jadwal rutin

Income/expense/transfer, actor, scope, kategori/subkategori, split, tag dan biaya admin tetap terpisah. Creator/Owner bisa trash; Owner dapat restore selama 30 hari. Pokok transfer tidak menjadi pemasukan/pengeluaran.

**Dashboard → Transaksi berulang** menyediakan jadwal mingguan/bulanan, tanggal/jam WIB, akhir jadwal, edit dan jeda. Mode **Tinjau setiap kejadian** hanya menyiapkan transaksi sampai dikonfirmasi. Mode **Setujui pencatatan otomatis** memberi persetujuan awal untuk aturan deterministik, bukan penulisan yang diputuskan AI.

Tanggal 31 mengikuti akhir bulan pendek, kemudian kembali ke tanggal awal bulan berikutnya. Identitas jadwal+tanggal dan request key mencegah duplikasi. Creator yang dicabut aksesnya atau referensi yang tidak valid membuat automation dijeda. Edit aturan tidak menulis ulang kejadian lama. Scheduler setiap 15 menit dan tombol **Periksa jadwal** memproses maksimal 100 kejadian per pemanggilan; backlog lama membutuhkan beberapa pemanggilan.

## Anggaran dan tabungan

Anggaran mendukung kategori beserta subkategori, dompet, periode kustom, 7 hari atau bulan kalender. Pilih satu periode/lanjut otomatis, serta reset/bawa sisa positif. Overspending tetap boleh dicatat.

Sesudah akhir periode WIB, **Tutup periode** menyimpan pemakaian saat itu dan membuat paling banyak satu penerus. Carryover adalah `max(0, nominal+sisa sebelumnya-pemakaian)`. Pokok transfer dikecualikan; fee dan split pengeluaran dihitung sesuai kategori. Penutupan tidak mengubah uang dompet.

Riwayat tertutup tidak dapat diedit. Koreksi transaksi tetap terlihat dalam ledger/laporan dan ditandai sebagai perbedaan dari pemakaian saat penutupan; carryover lama tidak dihitung ulang diam-diam. Arsip rencana terbuka dapat diaktifkan kembali. Kesalahan otomatis menjeda kelanjutan dengan alasan umum; batas nominal tidak dinaikkan otomatis.

Kontribusi tabungan merupakan tracking virtual. Riwayat/koreksi tidak memindahkan uang. Rekomendasi bulanan dan peringatan terhadap arus kas memakai catatan saat ini, bukan prediksi AI.

## Capture, draf dan lampiran

Tombol tengah **Tambah** menyediakan upload, kamera atau manual. Kamera hanya diminta setelah memilih Foto. Semua output AI wajib ditinjau dan dikonfirmasi. Confidence tinggi tidak melewati konfirmasi. BYOK OpenRouter free-only tetap pilihan; manual tidak memerlukan key/kuota.

JPEG/PNG/WebP dan PDF maksimal 10 MiB didukung. PDF tanpa password maksimal tiga halaman dirender lokal menjadi gambar gabungan. Hanya gambar hasil konversi yang diunggah; PDF asli dan skrip/link dokumen tidak dijalankan atau dikirim ke provider. Modul PDF dimuat saat dibutuhkan. Referensi: [PDF.js](https://mozilla.github.io/pdf.js/getting_started/).

**Dashboard → Draf AI** melanjutkan hasil asal yang belum disimpan, hanya untuk pembuatnya, berlaku 24 jam. Batal mempertahankan hasil asal; Buang draf mengakhirinya dan menjadwalkan pembersihan lampiran. Koreksi form yang belum disimpan tidak dipersistenkan sebagai draft baru.

**Riwayat transaksi → Lampiran transaksi** membaca bukti melalui Storage privat dengan izin sesi saat itu. Bukti disembunyikan bersama nominal. Retention tetap immediate/24h default/7 hari/keep setelah konfirmasi. Hilangnya berkas tidak menghapus transaksi.

## Dashboard, pencarian dan laporan

**Atur dashboard** menyimpan urutan/tampilan widget untuk akun sendiri; ringkasan dan menu selalu tersedia. Demo menyimpan perubahan dalam memori. Navbar bawah tetap Dashboard, Dompet, Tambah, Transaksi, Anggaran.

**Pencarian cepat / Ctrl+K** membuka menu atau pencarian merchant, wallet, actor, kategori/subkategori, tag, catatan dan tanggal. Filter memisahkan ownership dari actor/scope/status/nominal/periode. Laporan menyediakan hari/minggu/bulan/tahun/kustom dan perbandingan rentang dengan jumlah hari sama. Kategori memakai split, tidak menggandakan keseluruhan nominal.

Aktivitas keluarga adalah log baca untuk Owner. Realtime pada ledger/dompet/anggota/planning memicu refresh yang dibatasi frekuensinya; listener dilepas saat sesi berubah. Kembali ke tab juga memuat ulang data. Snapshot menggunakan pagination termasuk ketika batas respons API lebih rendah dari ukuran halaman.

## Ekspor dan impor

JSON memakai `schema_version: 1` dan `kind: household_snapshot`, tanpa key/profil privat/isi berkas. CSV memuat tujuan transfer, actor/scope, creator, kategori, fee child, sumber, versi, recurrence, split dan tag; string mirip formula spreadsheet dilindungi. JSON dipakai untuk impor; CSV untuk laporan portabel.

**Pengaturan → Impor data JSON** hanya untuk Owner. Tinjau jumlah dan petakan anggota asal ke anggota aktif, lalu konfirmasi. ID baru dibuat; ledger lama tetap utuh. Satu referensi gagal membatalkan seluruh operasi. Retry permintaan identik tidak menggandakan data; memilih file lagi membuat impor baru.

Maksimal 500 transaksi utama dan 1.000 baris per jenis. Sampah, profil, berkas, audit dan jadwal berulang tidak dipindahkan. Anggaran diimpor tanpa carryover/kelanjutan otomatis; periode tertutup menjadi arsip. Creator baru adalah akun pengimpor. Impor ini berbeda dari full-system restore.

## Operasi dan batas peluncuran

Backup mingguan mencakup dump PostgreSQL dan arsip byte Storage terpisah. Keduanya dienkripsi dengan age sebelum Drive/artifact. Baca [operasional](OPERATIONS.md), [Drive](GOOGLE-DRIVE-BACKUP.md), dan [deployment](DEPLOYMENT.md).

Tes otomatis dan hosted dengan data sintetis tidak menggantikan pilot keluarga asli, OpenRouter, kamera fisik, dua perangkat, serta restore terisolasi dan salinan kunci. Status rilis ada di [acceptance](ACCEPTANCE.md) dan [handoff](AGENT-HANDOFF.md).
