# Navigasi dan capture struk

Keputusan pengguna27September2026: web app memakai navigasi bawah bergaya bank, berurutan **Dashboard · Dompet · Tambah · Transaksi · Anggaran**. Label tombol tengah adalah Tambah, accessible name Tambah transaksi. Target tabungan, Sampah, Pengaturan tersedia pada Dashboard tepat setelah ringkasan keuangan. Desktop mempertahankan rail dan akses tambahan. Dock capture lama disembunyikan pada <=800px; safe-area dan ruang akhir konten tetap disediakan.

## Pilihan transaksi

Tombol tengah membuka native dialog dengan3pilihan: Upload struk, Foto struk, Tambah manual. Escape mengembalikan fokus; memilih opsi menutup chooser dahulu sebelum membuka dialog berikutnya. Tidak ada akses kamera ketika sekadar membuka chooser atau upload/manual.

Foto struk membuka getUserMedia dengan video facingMode environment ideal, audio false. Izin browser diperlukan; kamera yang tidak tersedia atau ditolak memberi pesan dan pilihan upload/manual. Video lokal muted/playsInline; guide dekoratif, tidak mendeteksi posisi struk secara otomatis. Foto JPEG disiapkan lokal, sisi panjang maksimum2000px, lalu divalidasi ulang dengan batas10MiB/signature yang sama. Foto ulang menghapus pilihan lokal dan membuka kamera lagi; tidak ada galeri persisten.

Dalam configured mode, tombol **Ambil foto & baca AI** dengan penjelasan tujuan data mengirim gambar ke attachment-upload privat lalu ai-preview menggunakan OpenRouter BYOK. Hasil otomatis membuka TransactionForm editable, termasuk confidence warnings/acknowledgements. Hanya **Konfirmasi & simpan** menjalankan ai-confirm; AI tidak diam-diam menambah ledger. Upload tetap meminta Baca dengan AI. Kegagalan provider mempertahankan foto/attachment untuk retry; tidak upload ulang selama attachment masih tersedia. Manual tetap tersedia. Demo hanya menampilkan JPEG lokal, tidak mengunggah atau memalsukan OCR.

Kamera dihentikan ketika foto diambil, pindah upload/manual/settings, close/Escape, unmount/session berubah, visibility hidden atau pagehide. Promise izin yang terlambat sesudah tutup langsung menghentikan semua tracks. Kembali ke halaman meminta tindakan Coba kamera lagi, bukan auto-start. URL gambar direvoke pada pergantian/unmount. Money masking juga menyembunyikan video/gambar.

## Batas server dan keamanan

public/_headers sekarang membolehkan camera=(self); microphone/geolocation tetap tidak diizinkan. Kamera tidak membuka provider URL/kunci browser atau menulis ledger. Retention24h default/abandoned draft, RLS, owner/actor/scope dan ai-confirm tidak berubah. Tidak ada migration/Edge change. Secure HTTPS Development; localhost untuk pengujian.

Sumber API yang diperiksa: [MDN getUserMedia](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia). UI asli menggunakan Lucide Camera/Sparkles/Plus dari paket dan lisensi lokal. Dialog mengikuti lifecycle/tokens Transitions.dev yang sudah digunakan; tidak menambah dependensi/motion berat.

## Verifikasi

Browser demo menguji urutan5item, fixed nav/nooverflow320, lokasi menu tambahan,3pilihan/keyboard/fokus/manual-no-commit, izin ditolak, foto JPEG, retry kamera, pagehide/track cleanup, serta permission terlambat. Configured-mode suite mengintersep semua backend: upload foto otomatis → kegagalan502 → retry ai-preview dengan attachment sama → editable TransactionForm dan cancel tanpa ledger write. Ini bukan penggunaan kamera perangkat pengguna atau provider nyata. Pilot authenticated/BYOK di Development masih perlu crosscheck pengguna; real-data/weekly backup gates sebelumnya tetap berlaku.

Production release27September2026: this navigation/camera flow is promoted to e2da5fd5 at masuksaku.my.id, matching Development78e8c110 source. Hosted current assets/camera policy/CSP verified; physical-device/BYOK pilot still pending.
