import { useLayoutEffect, useMemo, useRef } from 'react';
import { loadDemo } from '../lib/demo';
import { dashboard, money } from '../domain/finance';
import { CashflowChart } from './CashflowChart';
import { Icon } from './Icon';
import { MotionDisclosure } from './Motion';

export function Welcome({
  onAccess,
  onDemo,
}: {
  onAccess: (signup: boolean) => void;
  onDemo: () => void;
}) {
  const hero = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    const block = hero.current!;
    block.classList.remove('is-shown');
    void block.offsetHeight;
    block.classList.add('is-shown');
  }, []);
  const data = useMemo(() => loadDemo(), []);
  const month = new Date()
    .toLocaleDateString('en-CA', {
      timeZone: 'Asia/Jakarta',
      year: 'numeric',
      month: '2-digit',
    })
    .replace('/', '-');
  const summary = dashboard(data.wallets, data.transactions, 'family', month);
  return (
    <>
      <header className="billow-header">
        <a href="#beranda" className="brand">
          <span className="brand-mark">
            <Icon name="wallet" />
          </span>
          <span>masuk saku</span>
        </a>
        <nav aria-label="Navigasi pengenalan">
          <a href="#ringkasan">Ringkasan</a>
          <a href="#fitur">Fitur</a>
          <a href="#pakai-sendiri">Pakai sendiri</a>
          <a href="#pertanyaan">Bantuan</a>
        </nav>
        <div className="welcome-account">
          <button onClick={() => onAccess(false)}>Masuk</button>
          <button className="primary" onClick={() => onAccess(true)}>
            Mulai catat
          </button>
        </div>
      </header>
      <section
        ref={hero}
        className="billow-hero t-stagger"
        id="beranda"
        aria-labelledby="welcome-title"
      >
        <a className="welcome-pill t-learn" href="#ringkasan">
          Satu saku, semua catatan keuangan{' '}
          <span className="t-learn-chevron">
            <Icon name="chevronRight" />
          </span>
        </a>
        <h1 id="welcome-title" className="t-stagger-line t-stagger-line--1">
          Semua uang keluarga.
          <br />
          <span className="hero-accent">Dalam satu saku.</span>
        </h1>
        <p className="t-stagger-line t-stagger-line--2">
          <strong>Masuk Saku menyatukan keuangan keluargamu:</strong> dompet, transaksi, anggaran,
          dan target tabungan. Lebih mudah mencatat, lebih jelas merencanakan.
        </p>
        <div className="welcome-hero-actions">
          <button className="welcome-cta t-learn" onClick={() => onAccess(true)}>
            Mulai catat sekarang{' '}
            <span className="t-learn-chevron">
              <Icon name="chevronRight" />
            </span>
          </button>
          <button className="welcome-demo-link" onClick={onDemo}>
            <Icon name="dashboard" />
            <span>Coba demo tanpa daftar</span>
          </button>
        </div>
        <small>
          Data contoh reset setelah 15 menit tidak aktif. Transaksi nyata tetap kamu konfirmasi.
        </small>
      </section>
      <section className="welcome-product" id="ringkasan" aria-label="Contoh ringkasan keuangan">
        <span className="welcome-pill">
          <Icon name="dashboard" /> Contoh tampilan · Data demo
        </span>
        <div className="welcome-cockpit">
          <aside>
            <span className="preview-household">
              <Icon name="wallet" /> Keluarga contoh
            </span>
            <span className="preview-selected">
              <Icon name="dashboard" /> Ringkasan
            </span>
            <span>
              <Icon name="transfer" /> Transaksi
            </span>
            <small>KEUANGAN</small>
            <span>
              <Icon name="wallet" /> Dompet
            </span>
            <span>
              <Icon name="budget" /> Anggaran
            </span>
            <span>
              <Icon name="goal" /> Target tabungan
            </span>
            <small>KELUARGA</small>
            <span>
              <Icon name="settings" /> Pengaturan
            </span>
            <span className="preview-demo-label">Data contoh, bukan akunmu.</span>
          </aside>
          <div className="preview-workspace">
            <div className="preview-topbar">
              Ringkasan keluarga <span>IDR · Bulan ini</span>
            </div>
            <div className="preview-grid">
              <article className="preview-chart">
                <span>Total saldo tercatat</span>
                <h2>{money(summary.balance)}</h2>
                <CashflowChart rows={summary.rows} month={month} hide={false} />
              </article>
              <div className="preview-numbers">
                <article>
                  <span>Dompet aktif</span>
                  <strong>{summary.wallets.length}</strong>
                </article>
                <article>
                  <span>Pemasukan bulan ini</span>
                  <strong>{money(summary.income)}</strong>
                </article>
                <article>
                  <span>Pengeluaran bulan ini</span>
                  <strong>{money(summary.expense)}</strong>
                </article>
                <article>
                  <span>Target tabungan</span>
                  <strong>{data.goals.filter((g) => g.status !== 'archived').length} target</strong>
                </article>
              </div>
            </div>
            <h3>Dompet keluarga</h3>
            <div className="preview-wallets">
              {summary.wallets.map((wallet) => (
                <span key={wallet.id}>
                  <Icon name={wallet.type === 'bank' ? 'bank' : 'wallet'} /> {wallet.name}
                  <small>{wallet.ownership === 'shared' ? 'Bersama' : 'Personal'}</small>
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="welcome-demo-cta">
          <p>
            Ingin mencoba sebelum membuat akun? Buka contoh interaktif dengan data keluarga fiktif.
          </p>
          <button onClick={onDemo}>
            Coba dashboard demo
            <Icon name="arrowRight" />
          </button>
        </div>
      </section>
      <section className="welcome-features" id="fitur">
        <span className="welcome-pill">Dibuat untuk keseharian keluarga</span>
        <h2>
          Catatan lebih rapi.
          <br />
          Rencana lebih jelas.
        </h2>
        <p>Uang di berbagai tempat, tetap terlihat dalam satu pandangan.</p>
        <div className="welcome-feature-grid">
          <article>
            <Icon name="wallet" />
            <h3>Semua dompet, terhubung dalam catatan.</h3>
            <p>
              Rekening bank, uang tunai, dan e-wallet. Lihat saldo personal atau keluarga sesuai
              pemilik dompet.
            </p>
          </article>
          <article>
            <Icon name="budget" />
            <h3>Anggaran untuk kebutuhanmu.</h3>
            <p>
              Pantau pengeluaran per kategori dan susun target tabungan keluarga dengan progres yang
              mudah dibaca.
            </p>
          </article>
          <article>
            <Icon name="sparkle" />
            <h3>AI membantu. Kamu memutuskan.</h3>
            <p>
              Gunakan OpenRouter BYOK untuk membaca struk. Periksa hasilnya sebelum menyimpan
              transaksi.
            </p>
          </article>
          <article>
            <Icon name="user" />
            <h3>Satu keluarga, tetap punya saku masing-masing.</h3>
            <p>
              Undang anggota lewat email. Pantau saldo tiap anggota dan dompet bersama dari satu
              dashboard, tanpa berpindah perangkat untuk melihat catatan mereka.
            </p>
          </article>
          <article>
            <Icon name="transfer" />
            <h3>Tahu uang datang dari mana dan pergi ke mana.</h3>
            <p>
              Catat pemasukan, pengeluaran, dan transfer antar-dompet. Cari transaksi, lihat
              pengeluaran per kategori, dan bandingkan arus uang antarperiode.
            </p>
          </article>
          <article>
            <Icon name="history" />
            <h3>Catatan bisa diperiksa dan diperbaiki.</h3>
            <p>
              Koreksi transaksi saat ada yang keliru. Transaksi yang dihapus masuk ke Sampah selama
              30 hari dan dapat dipulihkan oleh Owner sebelum kedaluwarsa.
            </p>
          </article>
        </div>
      </section>
      <section className="welcome-guide" aria-labelledby="welcome-guide-title">
        <div className="welcome-section-intro">
          <span className="welcome-pill">Mulai dari kebiasaan kecil</span>
          <h2 id="welcome-guide-title">Dari catatan pertama, ke gambaran yang utuh.</h2>
          <p>Tidak perlu menunggu semua rapi. Mulai dari uang yang kamu pakai hari ini.</p>
        </div>
        <ol className="welcome-steps">
          <li>
            <span className="welcome-step-number">01</span>
            <h3>Siapkan sakumu.</h3>
            <p>
              Buat akun dan keluarga, lalu tambahkan dompet beserta saldo awal. Tentukan dompet
              pribadi atau bersama.
            </p>
          </li>
          <li>
            <span className="welcome-step-number">02</span>
            <h3>Catat dengan cara yang nyaman.</h3>
            <p>
              Isi manual, gunakan Quick Add, atau upload dan foto struk dengan bantuan AI. Periksa
              sebelum menyimpan.
            </p>
          </li>
          <li>
            <span className="welcome-step-number">03</span>
            <h3>Pantau, lalu rencanakan.</h3>
            <p>
              Lihat saldo dan arus uang. Susun anggaran serta target tabungan, lalu ajak keluarga
              mencatat bersama.
            </p>
          </li>
        </ol>
        <p className="welcome-guide-note">
          Saldo berasal dari transaksi yang dicatat. Masuk Saku belum menyinkronkan saldo langsung
          dari bank atau e-wallet.
        </p>
      </section>
      <section
        className="welcome-selfhost"
        id="pakai-sendiri"
        aria-labelledby="welcome-selfhost-title"
      >
        <div className="welcome-section-intro">
          <span className="welcome-pill">
            <Icon name="settings" /> Open source · Lisensi MIT
          </span>
          <h2 id="welcome-selfhost-title">
            Aplikasinya bisa kamu pakai. Databasenya bisa kamu miliki sendiri.
          </h2>
          <p>
            Gunakan versi web yang tersedia, atau clone proyek Masuk Saku dan jalankan instalasi
            sendiri untuk kebutuhanmu.
          </p>
        </div>
        <div className="welcome-host-options">
          <article>
            <Icon name="dashboard" />
            <h3>Langsung lewat web</h3>
            <p>
              Daftar, buat keluarga, dan mulai mencatat lewat browser. Tidak perlu memasang aplikasi
              atau menyiapkan server sendiri.
            </p>
            <button onClick={() => onAccess(true)}>
              Coba Masuk Saku
              <Icon name="arrowRight" />
            </button>
          </article>
          <article>
            <Icon name="settings" />
            <h3>Jalankan versi milikmu</h3>
            <p>
              Clone atau fork source dari GitHub. Kamu bisa menyesuaikan tampilan dan menjalankan
              frontend serta backend dengan akun layananmu sendiri.
            </p>
            <a
              href="https://github.com/huseinrosidstilllearn/masuk-saku"
              target="_blank"
              rel="noopener noreferrer"
            >
              Lihat source di GitHub
              <Icon name="arrowRight" />
            </a>
          </article>
        </div>
        <div className="welcome-own-database">
          <Icon name="lock" />
          <div>
            <h3>Clone source saja belum memisahkan database.</h3>
            <p>
              Untuk instalasi mandiri, buat proyek Supabase milikmu dan pasang schema serta fungsi
              server. Atur URL, publishable key, autentikasi, Storage, dan konfigurasi deployment ke
              layananmu sendiri. Dengan backend tersebut, akun dan catatan keuangan berada di
              database milikmu, terpisah dari instalasi Masuk Saku ini.
            </p>
            <p>
              Jangan memakai kredensial atau project ref instalasi ini. Panduan deployment
              menjelaskan konfigurasi yang perlu disesuaikan.
            </p>
          </div>
        </div>
        <a
          className="welcome-doc-link"
          href="https://github.com/huseinrosidstilllearn/masuk-saku/blob/main/docs/DEPLOYMENT.md"
          target="_blank"
          rel="noopener noreferrer"
        >
          Baca panduan instalasi mandiri
          <Icon name="arrowRight" />
        </a>
      </section>
      <section className="welcome-faq" id="pertanyaan">
        <span className="welcome-pill">Pertanyaan umum</span>
        <h2>Boleh banget bertanya.</h2>
        <MotionDisclosure title="Apakah aplikasi ini memindahkan uang?">
          <p>
            Masuk Saku mencatat dan mengelola keuangan. Catat transfer tidak mengirim uang melalui
            bank.
          </p>
        </MotionDisclosure>
        <MotionDisclosure title="Bisakah dipakai bersama pasangan?">
          <p>
            Owner dapat mengundang pasangan untuk bergabung ke keluarga. Dompet personal dan bersama
            tetap memiliki label kepemilikan.
          </p>
        </MotionDisclosure>
        <MotionDisclosure title="Apakah harus menggunakan AI?">
          <p>
            Tidak. Pencatatan manual dan Quick Add tersedia tanpa AI. AI memakai kunci OpenRouter
            milikmu dan selalu membutuhkan konfirmasi.
          </p>
        </MotionDisclosure>
        <MotionDisclosure title="Apakah saldo rekening otomatis terbaca?">
          <p>
            Belum. Masuk Saku menampilkan saldo awal dan transaksi yang kamu atau keluarga catat.
            Aplikasi ini tidak mengakses aplikasi bank anggota keluarga.
          </p>
        </MotionDisclosure>
        <MotionDisclosure title="Bisa memakai database sendiri?">
          <p>
            Bisa. Clone atau fork repositori, siapkan proyek Supabase sendiri, lalu ikuti panduan
            deployment. Mengunduh source tanpa mengganti konfigurasi backend belum membuat database
            terpisah.
          </p>
        </MotionDisclosure>
        <MotionDisclosure title="Apakah AI membutuhkan langganan?">
          <p>
            AI memakai API key OpenRouter milikmu dengan model gratis yang tersedia. Ketersediaan
            dan kuota mengikuti provider. Saat kuota habis, kamu tetap bisa mencatat manual atau
            memakai Quick Add.
          </p>
        </MotionDisclosure>
        <MotionDisclosure title="Bisa dipakai tanpa memasang aplikasi?">
          <p>
            Bisa. Masuk Saku berjalan melalui browser di komputer, tablet, dan ponsel. Koneksi
            internet diperlukan untuk menyimpan serta memuat data akun.
          </p>
        </MotionDisclosure>
      </section>
      <section className="welcome-final" aria-labelledby="welcome-final-title">
        <h2 id="welcome-final-title">Mulai kenali uangmu, satu catatan dulu.</h2>
        <p>Catat hari ini. Pantau bersama. Siapkan rencana berikutnya.</p>
        <button className="primary" onClick={() => onAccess(true)}>
          Buat akun dan mulai mencatat
          <Icon name="arrowRight" />
        </button>
      </section>
      <footer className="welcome-footer">
        <strong>Masuk Saku</strong>
        <p>Satu saku, semua catatan keuangan.</p>
        <a
          href="https://github.com/huseinrosidstilllearn/masuk-saku#readme"
          target="_blank"
          rel="noopener noreferrer"
        >
          Dokumentasi & source code
        </a>
      </footer>
    </>
  );
}
