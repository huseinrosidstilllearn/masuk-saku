# Referensi UI/UX Masuk Saku

**Acuan aktif terbaru:** [Dashboard V2/code.xr](DASHBOARD-V2.md) menggantikan green-only/Billow untuk palet dan layout aplikasi: multicolor bento, gray/white/charcoal, navigasi ringan120ms. Catatan evergreen/serif/Billow di bawah adalah riwayat; source Transitions.dev dan SVG tetap berlaku.

Koreksi terbaru: pengguna menolak font. Tipografi aktif sekarang DM Sans untuk judul, UI dan wordmark; Instrument Serif/Fredoka telah dilepas. Komposisi Billow dan animasi Transitions.dev tetap. Deskripsi font serif pada catatan referensi sebelumnya adalah riwayat, bukan arahan aktif.

Referensi animasi terbaru: [Transitions.dev](https://transitions.dev/), diminta langsung pengguna. Halaman publik, skill resmi, delapan recipe gratis dan terms telah diperiksa; source commit dan mapping implementasi ada di [MOTION](MOTION.md). Animasi sudah diterapkan pada aplikasi, dengan layout/native-dialog adaptations. Tidak ada Pro content atau library animasi baru. Styling Billow/hijau tetap aktif.

Dicatat27 September2026. Pengguna memberikan daftar ini setelah polish pertama, sebagai arah untuk riset desain selanjutnya. Simpan preferensi ini ketika berpindah agent. Acuan kebutuhan tetap PRD; visual identity tetap evergreen/off-white,Fredoka dan DM Sans sesuai DESIGN-SYSTEM.md.

## Sumber dan kegunaan

Semua URL utama di bawah telah dibuka lewat web research. Tinjauan ini mencakup halaman publik dan dokumentasi, bukan audit visual lengkap seluruh screen berbayar. Kolom kegunaan adalah pertimbangan untuk Masuk Saku, bukan klaim bahwa pola tertentu sudah diuji pada pengguna keluarga.

| Sumber                                                  | Yang tersedia di halaman publik                                                                | Kegunaan untuk Masuk Saku                                                                            |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| [CodeFronts](https://codefronts.com/)                   | Koleksi CSS/Tailwind, navigation/layout/form/progress, generator dan tools                     | Detail controls, spacing, state/focus dan responsive layout                                          |
| [BagUI](https://www.bagui.pro/)                         | React/shadcn blocks terutama landing page:hero,feature,pricing,CTA,navbar                      | Halaman pengenalan produk ketika diperlukan                                                          |
| [Canvas UI](https://canvasui.dev/)                      | Efek HTML-in-canvas,WebGL/WebGPU dan registry components                                       | Referensi motion/dekorasi yang relevan dengan identitas produk                                       |
| [shadcn/ui](https://ui.shadcn.com/)                     | Komponen yang dapat dikustomisasi,contoh dashboard dan dokumentasi                             | Form,dialog,sidebar,empty states dan konsistensi komponen                                            |
| [Refero](https://refero.design/)                        | Library screen/flow; halaman utama tidak menghasilkan konten teks bagi crawler                 | Kandidat utama riset dashboard finance,onboarding,settings dan alur pencatatan ketika akses tersedia |
| [ScreensDesign](https://screensdesign.com/)             | Library desain aplikasi dan AI screen generator                                                | Alternatif penelusuran komposisi layar/mobile                                                        |
| [Mobbin](https://mobbin.com/)                           | Library UI/UX mobile/web dengan screen/flow; homepage menampilkan produk seperti Wise/Coinbase | Kandidat riset informasi transaksi,wallet dan perjalanan onboarding                                  |
| [Dark Mode Design](https://www.darkmodedesign.com/)     | Kurasi website bertema gelap                                                                   | Riset palette/surface saat mengerjakan dark theme                                                    |
| [Minimal Gallery](https://minimal.gallery/)             | Kurasi website,templates dan tools                                                             | Referensi typography,whitespace dan komposisi sederhana                                              |
| [Direktori UXfolio](https://blog.uxfol.io/ux-websites/) | Daftar sumber inspirasi,best practices,learning dan practice                                   | Menemukan sumber tambahan sesuai masalah desain                                                      |

Ringkasan tidak mengasumsikan semua library cocok untuk dashboard finansial. Saat mengambil source code, cek lisensi pada sumber dan catat attribution jika diperlukan; belum ada komponen eksternal yang disalin/diinstal dalam sesi referensi ini. Canvas UI menyatakan MIT+Commons Clause pada FAQ; ini perlu ditelaah bila komponennya akan dimasukkan ke repository publik. [Sumber FAQ](https://canvasui.dev/).

## Pola konkret dari dokumentasi yang ditinjau

1. **Form terdiri dari label,control,helper,error yang jelas.** Dokumentasi [Field](https://ui.shadcn.com/docs/components/base/field) menunjukkan pengelompokan field,layout vertikal/responsif,aria-invalid dan error dekat control. Aplikasi berikutnya: pisahkan detail transaksi utama dari actor/scope,beri helper pada konsep yang berbeda,dan tunjukkan error pada field yang bisa diperbaiki. Ini usulan berikutnya,belum implementasi field-error baru.
2. **Empty state memberi konteks dan tindakan yang tersedia.** Dokumentasi [Empty](https://ui.shadcn.com/docs/components/base/empty) memisahkan media,title,description dan content/action. Aplikasi berikutnya: jangan menampilkan tombol editor yang belum tersedia; tawarkan langkah nyata seperti menambah dompet atau mengosongkan pencarian. Polish sebelumnya sudah memiliki sebagian pola ini secara mandiri,sebelum daftar referensi diberikan.
3. **Navigasi menyesuaikan ruang dan active state.** Dokumentasi [Sidebar](https://ui.shadcn.com/docs/components/base/sidebar) menyediakan pola offcanvas/icon serta grouping. Aplikasi berikutnya: evaluasi apakah menu keluarga pada layar kecil mudah ditemukan,termasuk settings/trash tanpa harus menebak horizontal scroll. Pemilihan pola perlu diuji pada320/390px,keyboard dan touch.

Ketiga pola ini dapat diterapkan pada komponen yang ada; riset ini tidak menetapkan migrasi stack ke shadcn/Tailwind. Contoh dokumentasi bukan bukti kepatuhan accessibility seluruh aplikasi.

## Refero MCP: fakta dan keadaan sesi

[Dokumentasi resmi Refero MCP](https://refero.design/mcp) menjelaskan pencarian screen/flow melalui agent,akses melalui paket Pro,dan autentikasi browser. [Repository resmi](https://github.com/referodesign/refero_skill) menyediakan plugin/skill dan konfigurasi endpoint `https://api.refero.design/mcp`.

Inventaris tool yang tersedia pada sesi ini tidak memuat Refero atau tool-search untuk membuatnya callable. Tidak ada MCP Refero yang dipakai,tidak ada plugin yang diinstal,dan tidak ada login/pembelian Refero dilakukan. Jangan menulis bahwa screen Refero tertentu sudah dianalisis hanya karena halaman publiknya dibuka. Bila nanti tersedia,gunakan server resmi dan autentikasi pengguna untuk riset read-only; jangan meminta token/password dalam notes.

Contoh brief riset berikutnya: web finance keluarga,IDR saja,personal/shared wallets,review-confirm sebelum mutasi; cari screen dashboard,wallet list,transaction review,household onboarding dan field-validation. Catat URL/screen yang benar-benar bisa diakses,pola yang dipilih,alasan kecocokan,serta perubahan yang dihasilkan.

## Urutan riset untuk iterasi berikutnya

1. Pilih2–3 screen/flow nyata yang dapat diakses untuk satu pekerjaan,bukan menggabungkan banyak gaya sekaligus.
2. Prioritaskan detail form transaksi:nominal/wallet/type sebagai informasi utama,actor/scope sebagai konsep terpisah,review/commit tetap eksplisit.
3. Evaluasi navigasi mobile dan first-wallet onboarding dengan data kosong serta nama/nominal panjang.
4. Untuk reports/budget/goals,cocokkan pattern dengan data nyata dan fitur yang sudah tersedia; jangan menambah chart dekoratif atau CTA yang belum bekerja.
5. Verifikasi hasil pada320/390/1440px,keyboard/focus,empty/loading/error/success dan reduced motion; update NOTES,DESIGN-SYSTEM,ACCEPTANCE dan VERIFICATION dengan bukti.

Sesi ini hanya memperbarui referensi/notes. Aplikasi dan backend tidak berubah; hasil pengujian terakhir tetap berasal dari sesi polish sebelumnya.

## Iterasi SVG dan navigasi — 27 September 2026

Implementasi frontend menggunakan [Lucide React](https://lucide.dev/guide/react), versi1.48.0 yang dikunci di package-lock.json. Ikon diimpor secara bernama, dirender inline SVG, mengikuti currentColor, dan disembunyikan dari pembaca layar ketika dekoratif. Label tombol tetap berupa teks. Tidak memakai emoji/emoticon atau glyph panah sebagai pengganti ikon. Favicon memakai Wallet dari paket yang sama. Lisensi lengkap ISC beserta pemberitahuan Feather disertakan di public/licenses/Lucide-LICENSE.txt.

Pola pengelompokan dari dokumentasi shadcn Field diterapkan melalui fieldset/legend native: Detail transaksi, Pelaku & lingkup dengan penjelasan perbedaan pemilik dompet/pelaku/penerima manfaat, dan Catatan tambahan opsional. Nominal lebih menonjol. Label peringatan confidence diterjemahkan; key acknowledgment internal tetap sama. Validasi field-error khusus masih pekerjaan berikutnya.

Navigasi mobile sekarang empat tujuan utama ditambah Lainnya, tanpa perlu horizontal scroll untuk mencari settings/trash. Menu lainnya memakai dialog native dengan title, Escape, containment dan pengembalian fokus. Desktop tetap tujuh tujuan. Ini keputusan desain lokal setelah meninjau pola grouping/offcanvas shadcn Sidebar, bukan komponen shadcn yang disalin. Empty states sebelumnya tetap dipakai. Refero MCP belum tersedia/dipakai.

## Revisi setelah umpan balik pengguna

27 September2026: pengguna menyatakan polish sebelumnya masih jelek dan memilih fintech modern (kontras,kartu/grafik dominan). Komposisi sekarang lokal/orisinal berdasarkan brief itu: dark forest sidebar,mint active state,hero saldo,white metric cards,real weekly cashflow,category meters dan budget panels. Tidak mengklaim layout menyalin screen Refero/Mobbin; tidak ada MCP Refero baru. Pola shadcn yang sudah ditinjau tetap dipakai untuk form/navigation,dan Lucide tetap sumber ikon. Preferensi user terbaru lebih utama daripada palette/komposisi awal.

# Banking-inspired cash management — 27 September 2026

Latest user direction: familiar banking application patterns while preserving household cash management. Reviewed public official product descriptions: [Kantong Jago](https://www.jago.com/id/jago/pages/jago-pocket) describes separating savings/spending by purpose and shared money management; [myBCA](https://www.bca.co.id/id/Individu/layanan/e-banking/myBCA) was consulted as an official banking reference but its page did not expose useful content to the reader. This is not a visual audit of authenticated bank applications.

Applied our own UI: prominent recorded-balance card, circular labelled shortcuts, white navigation with selected teal state, distinct wallet cards. Real actions are ledger previews and planning navigation. No bank logos, payment capabilities or live bank balances are implied. This supersedes the previous dark-sidebar direction; evergreen/teal identity, IDR, personal/household views and budget/goals remain.

## Latest premium-green direction

This iteration follows the user's explicit selection of premium bank layout and subsequent correction to keep green. References inspected this session: the supplied screenshots and existing local demo desktop/mobile captures. No additional remote bank screens inspected, copied or claimed. Three compact cash actions replace redundant navigation shortcuts; own brand retained.

## Full workspace rebuild

User rejected previous incremental changes and requested rebuilding the UI. This composition was developed from existing product requirements and locally inspected screenshots, not a newly copied banking screen. Current active stylesheet workspace.css replaces fintech.css; compact financial grouping and dedicated planning cards are new layout components. SVG remains licensed Lucide; no new external assets.

## Billow / Godly — explicit user reference

User requested https://godly.design/website/billow/ with the same composition and Masuk Saku content. Opened Godly page and official billow.so; direct browser site returned a country-unavailable screen. Visually inspected archived Godly hero-desktop.png, hero-mobile.png and the cockpit region of desktop-full.png. Actual observed patterns: white canvas, large high-contrast serif headline, outlined badge, pill CTA, soft glow around framed product preview, thin monochrome cockpit cards, main chart left and metric stack right. Public text read from official site; no authentication/access restriction bypass.

Applied Welcome.tsx + billow.css to public Auth page, preserving existing email/password/Google form under #akses. Actual workspace uses thin white cockpit surfaces, left cashflow line chart and right planning figures. Green replaces Billow blue per the user's persistent brand direction; own Lucide wallet and Masuk Saku copy. Instrument Serif is a licensed visually similar font, not a verified exact identification. Preview is visibly labelled demo and derived from demo fixtures/finance functions. No Billow logo/copy/proprietary artwork/screenshots included in public assets. This adaptation is not claimed pixel-identical or a licensed Billow template.

# Date/time control reference — 27 September 2026

Inspected [W3C APG date picker](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/examples/datepicker-dialog/) for calendar keyboard navigation, roving focus, full weekday labels, selected/today semantics and focus restoration. Implemented [Indonesian transaction calendar](DATE-TIME.md) as an inline disclosure inside our native transaction dialog, rather than a nested modal. Visuals remain Masuk Saku green/DM Sans/Lucide; open/close uses the existing Transitions.dev accordion recipe. Not a screen-reader certification or copy of source example code.

# Dashboard V2/code.xr — latest reference

User supplied [Instagram reel Ddf-7oiz126](https://www.instagram.com/reel/Ddf-7oiz126/), explicitly allowing a multicolor palette and asking for lighter navigation. Public headless browser opened video without login and inspected several frames: work-dashboard lime/orange/peach, finance-dashboard gray canvas/white bento/charcoal balance/coral-orange, and calendar screens. Primary finance composition and adaptations are recorded in [DASHBOARD-V2](DASHBOARD-V2.md). No external media/source shipped; not a pixel-identical copy of multiple demo dashboards. This supersedes green-only, while earlier Transitions.dev/SVG/product decisions remain.

## Catalog refresh —27September2026

Inspected the public [Watermelon UI](https://ui.watermelon.sh/) catalog and source-backed registry files [budget-card](https://registry.watermelon.sh/r/budget-card.json) and [animated-button](https://registry.watermelon.sh/r/animated-button.json). Repository main observed at `51db104dead7ce6125b953c5ec0802675b7c43bf`; registry endpoints are mutable, inspected27September2026, and the MIT license is shipped locally. No registry/component runtime is requested by the app.

Implemented adaptations: BudgetPulse follows the budget-card composition of a progress track and usage/remaining hierarchy, using existing budget data, actual period allocation including rollover, integer rupiah and immediately removed geometry/percentage when masked. Overlapping category/wallet budgets retain existing per-budget accounting; this is allocation usage, not a household expense total. No mock transactions, USD, bank-linking or provider logos copied. The animated-button tactile pattern is simplified into native CSS press/hover feedback using existing Transitions.dev timing; no Motion/react-use-measure/Tailwind dependencies introduced. Cards use shadow feedback; financial numbers and chart geometry never tween.

[Watermelon source](https://github.com/WatermelonCorp/watermelon-platform), [MIT notice](../public/licenses/Watermelon-MIT.txt). Family-wallet and card-cue registry source also inspected; crypto wallet onboarding/card CVV forms were excluded because they do not match the product. Catalog visual pattern reuse is an adaptation, not a pixel-identical reproduction.

[Refero](https://refero.design/) and [Pageflows](https://pageflows.com/) public pages were attempted but did not provide accessible screens/flow content in this session. Their authenticated catalogs/MCP were not used. [SaaSpo](https://saaspo.com/) public landing gallery/filter descriptions inspected (bento, colorful, finance); used as general composition inspiration, no source/assets copied.

## Native customizable dropdown reference —27September2026

Inspected [MDN customizable select](https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Forms/Customizable_select) and [Chrome customizable select](https://developer.chrome.com/blog/a-customizable-select). Implemented progressive CSS enhancement of all24native selectors via appearance:base-select/::picker(select)/::picker-icon/option::checkmark. Original project styles, no MDN sample markup/emoji/copied example assets. Static chevron/check SVGs generated from installed Lucide package, covered by shipped license. Browser support remains limited: Chrome154 tested; unsupported engines retain native picker and styled closed trigger. Native typeahead, not an added search input. This browser-platform approach keeps forms/time/required validation and modal focus native without a JS listbox dependency.

## Camera extension —27September2026

Inspected [MDN getUserMedia](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia) for explicit permission, secure context, video-only constraints and denied/unresolved promises. Original bank-style navigation requested by user; Lucide Camera SVG from installed licensed package. No external bank assets or new animation catalog source copied.
