# BYOK lifecycle

Pengaturan menampilkan status kunci akun sendiri: provider/model/waktu penyimpanan, tidak pernah key/ciphertext/IV. Simpan mengganti ciphertext melalui Edge ai-credentials dengan enkripsi dan associated data household/user yang sudah ada. Input dikosongkan saat submit; tidak dipersist.

Migration9 menambahkan get_my_ai_credential_status(household) dan revoke_my_ai_credential(household). Keduanya membutuhkan auth.uid dan membership, tidak menerima user selector, memakai security definer/search_path kosong. Owner juga hanya dapat melihat/mencabut key dirinya. Revoke idempotent; key pengguna lain tidak terpengaruh. Hapus dari aplikasi tidak mencabut token pada situs OpenRouter: lakukan itu di dashboard provider bila dibutuhkan.

UI meminta konfirmasi sebelum revoke dan mempertahankan retry bila gagal. Setelah revoke, AI preview baru tidak menemukan credential; draft yang sudah dibuat tetap membutuhkan human-confirm. OpenRouter free-only tetap berlaku. Tidak ada endpoint baru untuk mengembalikan secret. Migration lokal/SQL dan browser fixture teruji; status deployment/real provider pilot dicatat di handoff.
