import { useLayoutEffect, useMemo, useRef } from 'react';
import { loadDemo } from '../lib/demo';
import { dashboard, money } from '../domain/finance';
import { CashflowChart } from './CashflowChart';
import { Icon } from './Icon';
import { MotionDisclosure } from './Motion';

export function Welcome({ onAccess }: { onAccess: (signup: boolean) => void }) {
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
        <button className="welcome-cta t-learn" onClick={() => onAccess(true)}>
          Mulai catat sekarang{' '}
          <span className="t-learn-chevron">
            <Icon name="chevronRight" />
          </span>
        </button>
        <small>Catat manual atau dengan AI. Kamu yang mengonfirmasi.</small>
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
        </div>
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
      </section>
    </>
  );
}
