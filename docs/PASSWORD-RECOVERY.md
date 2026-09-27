# Password recovery

Login menyediakan Lupa password? dengan email, bukan username. SDK resetPasswordForEmail mengirim permintaan dengan redirect ke origin aktif/#pemulihan-password. Pesan berhasil selalu generik: Jika email terdaftar. Gangguan/rate limit ditampilkan tanpa raw server payload.

PKCE memakai sessionStorage. Tautan harus dibuka pada browser dan tab yang meminta reset agar verifier tersedia. Halaman pemulihan terpisah dari dashboard, memblokir finance reads; callback tanpa sesi sah tidak menampilkan kolom password. Dua kolom password harus sama, minimal8karakter. updateUser memerlukan sesi Auth sah; setelah berhasil sign-out lokal dan kembali ke login. Password tidak dipersist atau dicatat. Tautan sendiri tetap diverifikasi Supabase, bukan dipercayai frontend.

Pengujian configured-mode memakai SDK asli dengan backend fixture: permintaan/generic status, tautan tanpa sesi, mismatch/no write, update sekali, logout sekali, tanpa finance reads,320px dan regresi inactivity. Ini belum membuktikan inbox/PKCE callback nyata. Redirect harus diizinkan di Supabase untuk origin canonical dan recovery fragment; lakukan pilot email setelah deployment.

Referensi: [Supabase password recovery](https://supabase.com/docs/guides/auth/passwords), [redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls).
