# Design-system foundation

Latest visual direction supersedes green-only: [Dashboard V2/code.xr](DASHBOARD-V2.md), selected directly by user. Cool-gray canvas #f1f2f7, white rounded20–22px surfaces, charcoal #17191f primary/balance, lime #d9f674, coral #f24b68, orange #ff8b40, peach #ffe9df and lavender #e9e3ff. Real DM Sans weights remain. Desktop72px icon rail; labelled mobile bottom navigation/capture. Four summary cards above white cashflow and dark balance; transactions precede categories/budgets. src/dashboard-v2.css is the latest active layer after date-time.css and before motion.css. Navigation is opacity-only120ms, filter/transform:none and will-change:auto. Historical green/Billow directions below are superseded for visual palette.

Latest date/time refinement: [transaction calendar and WIB24-hour controls](DATE-TIME.md). Indonesian Monday-first calendar, manual DD/MM/YYYY, separate00–23 hour/00–59 minute, explicit WIB badge and Today/Now shortcuts. Green panels, bold tabular digits, Lucide calendar/clock, roving keyboard focus and inline Transitions.dev accordion. src/date-time.css sits after billow.css and before motion.css; isolate its table rules from responsive transaction cards.

Latest weight refinement: user requested thicker type. DM Sans now loads400/500/600/700/800. Use800 for the Welcome hero,700 for headings/recorded amounts/wordmark/primary CTA,600 for navigation/form/FAQ labels and400 for explanatory copy. Source font-synthesis:none remains; these are real locally hosted weights. Revised responsive sizes/line heights and motion remain.

Latest typography correction (27 September 2026): user rejected the fonts. Use self-hosted DM Sans400/500/600 consistently for UI, headings and wordmark. Welcome headline52–76px desktop and32–52px mobile, weight600, line-height1.1–1.13 and tracking-0.04em; feature/FAQ headings44px desktop/32px mobile; Auth title30px. Instrument Serif and Fredoka are no longer loaded or dependencies. Earlier font descriptions below are historical. Billow layout, green identity and Transitions.dev motion remain active.

Latest motion direction: [Transitions.dev foundation](MOTION.md), implemented in src/motion.css after the Billow layer. Public recipes cover pages, dialogs/menu, Welcome text/FAQ/hover, icons, notices and actual loading labels. Shared feedback tokens, reduced-motion guards, focus cleanup and immediate monetary masking are required. This complements the existing green Billow composition.

Brand: **Masuk Saku**. Tagline: **Satu saku, semua catatan keuangan.**

Untuk riset dan iterasi visual berikutnya,baca [referensi UI/UX dari pengguna](UI-REFERENCES.md). Dokumen itu membedakan pola yang ditinjau,usulan penerapan,dan akses MCP yang belum tersedia.

## Visual language

Banking-inspired family cash management (user direction, 27 September 2026). White navigation, teal primary actions, a full-width teal balance card, pale canvas, circular SVG shortcuts and clear wallet ownership. Fredoka Semibold for brand wordmark; DM Sans 400/500/600 for UI. Font files are self-hosted through npm @fontsource packages; no Google Fonts network request. Logo is our pocket/wallet glyph and wordmark. The active visual layer is `src/fintech.css`, imported after the base layout in `src/styles.css`.

| Token    | Value   | Use                                                 |
| -------- | ------- | --------------------------------------------------- |
| --green  | #087f73 | Primary actions and balance card                    |
| --muted  | #627268 | Supporting copy (full contrast audit still pending) |
| --line   | #e7ece5 | Dividers and outlines                               |
| --cream  | #eef3e7 | Soft surfaces                                       |
| --gold   | #b67d35 | Warnings                                            |
| --red    | #b04f3d | Errors and overrun                                  |
| Canvas   | #f4f7f8 | Page background                                     |
| Surface  | #ffffff | Panels                                              |
| Progress | #7da56c | Goal/budget bars                                    |

Spacing: 4/8/12/16/24/32. Polished panels radius18px (15–16px mobile); controls8–11px; native modal22px. Heading32px desktop /28px mobile; section18px; body14px, supporting metadata generally12px (11px for dense mobile context). Controls are42–46px tall. Money uses IDR no decimals, tabular numerals and wrapping for large values; critical monetary values are emphasized. No green/red-only communication: always label income/expense and over-budget amount.

## Components and layout

Banking patterns: total recorded balance leads the dashboard, followed by four financial summaries; desktop uses four columns, <=1100px two. A six-action menu opens expense/income/transfer previews or wallet/budget/goal pages; <=600px it becomes three columns. Labels explicitly say **Catat**, not Bayar/Kirim, and preview cancellation leaves the ledger unchanged. The balance is aggregated from recorded wallets, never represented as a live bank connection. Wallet cards retain owner/shared/type/IDR labels. Budget and savings remain core, including the virtual-contribution explanation. Teal, warm orange, blue and purple action circles always have textual labels. No bank logos, payment services, fabricated account numbers or emoji.

Sidebar with household and identity; sticky mobile navigation with four main destinations and a secondary menu. Header sensitive-mode control and desktop search entry (existing Ctrl/Cmd+K); signed-in mobile header exposes logout. Active navigation uses aria-current. Dashboard five cards in product priority order. Quick Add preview above three main chart concepts: income/expense, category spending, budget performance. Table scrolls within its panel on intermediate sizes; <=600px rows become a card layout exposing amount/status/actions. Goals/wallet summaries below. Native dialog provides focus containment/Escape; fields and actions disabled while commit in flight. Lucide inline SVG icons are aria-hidden; named imports and local assets need no icon network request.

States: loading spinner (static for reduced motion), empty, no wallet, demo, pending, cancelled, completed, trash, provider failure, low confidence, overspending, expired draft. Success/error notifications have distinct appearance and status/alert semantics. Search empty state offers clearing the query. No-wallet/goal state explains the next available step; unavailable editors are described in user language. Demo clearly says memory-only/reset-on-refresh. Refresh failures remain visible rather than being overwritten with success. Full hosted failure/recovery acceptance remains pending.

Auth: evergreen story panel with a decorative wallet illustration and a focused login/signup card. On small screens the illustration is removed, retaining the short brand introduction and form. Password visibility toggle preserves entered text; duplicate submits/OAuth actions are disabled during requests. Errors and confirmation-email success have distinct states. Google availability remains a backend configuration requirement; polish does not enable the provider.

## Capture UX

User types/selects/uploads → editable preview → warning only when confidence below90% or missing → field acknowledgements for critical <70% → Konfirmasi & simpan. High confidence never auto-commits. Distinguish wallet owner, actor and beneficiary scope in labels. Target contribution called tracking virtual so user does not infer money movement.

## Accessibility and localization

Indonesian interface; lang=id. Inputs have labels, controls have visible focus ring, dismiss buttons named, modal title associated, skip-to-content link provided. Tables retain semantic headers including the visually hidden mobile header. Native confirmations are used for trash. Reduced-motion preference disables animations/transitions. Monthly/report date logic uses Asia/Jakarta independent of host clock timezone. Target WCAG2.2 AA; full contrast and screen-reader audit remain sprint hardening work, no conformance claim.

Local reference screenshots are kept in docs/screenshots and intentionally excluded from the public repository.

## Ikon SVG

Ikon UI dan favicon bersumber dari [Lucide](https://lucide.dev/guide/react) melalui lucide-react1.48.0. Named imports menghindari bundling seluruh katalog. Simpan label teks/aria-label pada control; SVG dekoratif aria-hidden dan focusable=false. Jangan memakai emoji/emoticon maupun karakter panah sebagai ikon. Lisensi lengkap dipublikasikan pada /licenses/Lucide-LICENSE.txt. Brand memakai Wallet Lucide sebagai placeholder hingga identitas final tersedia.

Pada lebar<=800px, navigasi lima kolom: Ringkasan, Transaksi, Dompet, Anggaran, Lainnya. Tiga halaman tambahan berada dalam dialog Menu lainnya, dengan active state dan Escape/focus return. Form review dikelompokkan menjadi Detail transaksi, Pelaku & lingkup, dan Catatan tambahan; nilai nominal ditekankan dengan numerals tabular. Konfirmasi tetap satu-satunya tindakan yang mengubah ledger.

## Arah aktif: fintech modern

Pengguna menolak polish pertama lalu memilih fintech modern pada27 September2026. Arah ini menggantikan komposisi visual awal: sidebar #102823, active state/brand mint #c8f39c, saldo utama #143c2e, canvas #f3f5f5, panel putih. --green kini #174f43; --muted #637572; --line #e2e9e7; --cream #eaf5ee; radius16px. Font tetap DM Sans/Fredoka. Angka total saldo menjadi fokus; empat metric sekunder di kanan pada desktop,2x2 di bawah pada mobile.

CashflowChart menampilkan batang mingguan income/expense dari summary.rows (selesai,bulan WIB,dompet terpilih), dengan fee sebagai expense dan tanpa transfer. Tidak menambah data ilustratif pada dashboard. Tabel alternatif sr-only dan tooltip menyediakan nominal persis. Privacy/masking menyembunyikan chart geometry dan tabel nilai; kategori juga kehilangan meter saat masked. Bulan kosong memakai empty message. Desktop analytics: cashflow panel spans dua baris,kategori dan budget di kanan; mobile urutan income/expense,kategori,budget.

Sumber visual terbaru: src/fintech.css yang diimpor sesudah base styles.css. Login mengikuti mint/forest dan ilustrasi geometris tetap dekoratif. Preview viewport tersedia pada screenshots/desktop-preview.png,mobile-preview.png; screenshot penuh tetap tersedia. Kontras penuh/screen-reader audit masih belum mengklaim WCAG conformance.

Platform scope: browser web app only. Responsive layouts adapt the same web app to desktop/tablet/phone browsers; do not create native/mobile/desktop applications or installable PWA/offline ledger sync without a new user request. Keep keyboard/pointer and browser accessibility alongside responsive layouts.

## Planning editor interaction

Anggaran and Target tabungan now offer working create/edit controls in the browser. Forms use native dialog semantics, visible Indonesian labels, disable fields/actions while saving, retain entries after errors, support Escape and restore focus. Budget dates/category/wallet/thresholds are configurable; default personal-view wallet follows selected wallet owner. Goal archive preserves history; virtual progress explicitly explains that wallets do not move. History includes date/creator and confirmed correction when authorized. Monthly plan divides remaining target by inclusive calendar months with ceil whole IDR; this is deterministic arithmetic, not AI financial advice. No deadline means no monthly recommendation; overdue target receives a factual reminder.

## Transaction editor/history

Reuse the existing native preview dialog and fintech controls. Ubah opens prefilled fields plus optional split category rows; explicit Konfirmasi & simpan is the only write. Invalid split totals preserve entered values. Tags remain untouched and are described as preserved. Revision history shows version,editor,time WIB,field before/after,admin fee and resulting splits. Amounts respect masking; current member/wallet/category names label historical IDs. Escape closes dialogs and returns focus; fields are disabled during save. Creator/Owner actions use existing Lucide Pencil/History icons. No new external components or design-library screens were imported for this slice.

## Receipt picker and review

Existing native dialog/fieldset/fintech/Lucide patterns reused; no new external component or paid screen reference copied. Upload icon is Lucide named import. Picker has format/size limits,private-upload/provider disclosure,local thumbnail,remove action,optional context and configured retention label. Explicit Upload → Baca → editable human review; no auto-commit. Busy stages disable cancellation/actions,client requests bounded60s/45s. Recovery includes BYOK settings and manual without attachment. File can be removed/reselected even when identical; local preview follows masking. TransactionForm shows receipt beside review details before human confirmation. 320px action buttons stack; transaction Ubah/Riwayat/Hapus now occupy a separate full-width row so merchant text stays readable.

## Bottom navigation update — 27 September 2026

At <=800px, primary navigation is fixed to the viewport bottom; receipt/manual capture actions sit immediately above it. The heading no longer contains capture buttons. Safe-area padding and 160px content clearance preserve the final content; scroll-padding protects focused controls. Sidebar backdrop-filter is disabled so it cannot establish a containing block for fixed navigation. Desktop navigation remains a sidebar; capture actions follow page content.

## Premium green redesign — latest direction

User selected a premium digital-bank composition, then explicitly retained Masuk Saku green instead of navy. Forest green #174f3b balance/auth surfaces, #17634a primary actions, pale #f6f8f7 canvas. Compact balance without decorative rings, left-aligned heading, restrained12px panels, three ledger shortcuts instead of six duplicated navigation actions. Wallet cards use two columns desktop and one on small screens. Bottom navigation/capture dock retained. Existing personal/household ownership, money masking, virtual savings and human-confirmed writes remain. Latest revision is in src/fintech.css; no new UI library or external artwork imported.

## Full workspace rebuild — active design

User requested a full rebuild after rejecting incremental polish. New active system: src/workspace.css; src/component-details.css retains planning/revision/receipt/catalog details from earlier implementation; styles.css is the shared base/font/accessibility foundation. Prior fintech visual system is archived at docs/source/previous-fintech.css, not imported. Desktop220px sidebar, title and scope on one line, overview split1.55:1 with saldo/cashflow/three capture actions integrated and separate budget/savings stack. Mobile overview stacks, planning summaries side-by-side, bottom navigation/capture dock retained. Forest #20543d, primary #205c42, canvas #f6f7f4, white rounded20px surfaces, restrained olive/gold planning icons. Chart income #a5c991 and expense #20543d plus explicit labels. Own composition, no new remote screen copied. All data follows existing household/personal filters; IDR/virtual goals/masking/AI confirmation preserved.

## Billow reference — latest active direction

Explicit user reference supersedes prior freeform banking revisions. Active imports: shared styles.css → component-details.css → workspace.css → billow.css. Billow layer defines the reference-specific composition. Welcome/Auth now opens with serif headline (Instrument Serif400, self-hosted OFL), outlined capsule, pill signup CTA, demo cockpit preview and CSS radial glow. Desktop headline98px max, mobile40–68px, desktop centered and mobile left aligned. FAQ native details, existing auth form under #akses, CTA scrolls and focuses email with reduced-motion support.

Application cockpit:200px sidebar, white58px header, thin1px light cards with10px radius, overview3:1 desktop and stacked mobile. Actual cashflow moved into saldo card, with income/expense line graph at real weekly positions; plans stacked to the right, category/budget below. No invented growth percentages, trial price, bank integration or dead navigation. SVG Lucide, green #146744 primary/#113d2b headlines; bottom app navigation/capture retained. Public welcome links point to real sections/form. Own branding and product copy replace Billow's; visuals are an adaptation, not a pixel-perfect claim.

## Catalog refresh —27September2026

Active layer remains dashboard-v2.css, followed by motion.css. Larger800-weight page titles, clearer600-weight card labels,36px count values and22–30px money summaries replace tiny rigid cards. Pastel allocation/goal/count cards retain the real finance meanings. Saldo leads left desktop (right cashflow), with a static abstract stacked-card outline, brand signature and labelled shortcuts; mobile puts saldo and cashflow before secondary summary cards so the recorded balance is immediately discoverable. Lime active nav, lavender Quick Add, warmer count card, soft surface shadows and violet-tinted canvas unify the web app and public welcome/auth. No fake account number, payment feature, bank connection or personal identity introduced.

BudgetPulse is a small source-backed Watermelon adaptation: visible only with a positive allocation and unmasked money; percentage reflects the same active-budget/rollover data used by the existing remaining total. It is removed immediately on masking or scope change with no outgoing snapshot. Decorative card geometry has no data meaning. Source/attribution in UI-REFERENCES.

Hover/press feedback is150ms; arrows use existing recipe24 timing. No perpetual motion, cursor tracking, particles, large library, amount counters or animated financial progress. Desktop navigation stays120ms opacity; mobile fixed bottom nav/capture stays labelled. Reduced motion removes added transitions/transforms.

## Shared dropdowns —27September2026

All24native single-select controls use src/select.css, imported after dashboard-v2.css and before motion.css. Covers household scope; wallet type/ownership/session settings; category type/parent/icon; transaction kind/source/destination/category/status/split/actor/scope/member; budget category/wallet/period; goal status/filter; calendar month/hour/minute. Shared white16px rounded picker, subtle border/shadow, lavender selected row, Lucide SVG check/chevron,38px option rows and bounded scrolling. Narrow hour/minute panels have130px minimum, month180px; native top-layer collision handling positions panels at viewport edges and inside dialogs.

Progressive native customizable-select enhancement (`appearance: base-select`, `::picker(select)`) preserves labels, required validation, events, typeahead and keyboard/Escape. Verified source: [MDN customizable select](https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Forms/Customizable_select), [Chrome documentation](https://developer.chrome.com/blog/a-customizable-select). This feature has limited browser availability; inspected local Chrome154 supports it. Unsupported browsers receive the styled closed select with Lucide chevron and their functional OS-native option picker. No separate search input or custom combobox library added; long lists use native keyboard typeahead and scrolling. Do not claim custom popup parity in unsupported Safari/Firefox. No server/finance state changes.

SVG files public/icons/dropdown-chevron.svg and dropdown-check.svg are rendered from installed Lucide React1.48.0; existing license notice applies. Native disclosure icon uses recipe21/shared150ms token; incoming picker opacity recipe08/120ms, immediate native close/selection, reduced-motion disables both.

## Component accent motion —27September2026

Summary/count/wallet/goal/Quick Add/empty-state icons and cash shortcut SVGs now enter once with500ms gentle rise/scale and short40ms stagger. Abstract saldo card texture unfolds once. Wallet/goal/feature icons tilt/lift on fine-pointer hover; Quick Add responds to typing focus. Only decorative elements move; real balances/chart/progress and fixed nav/capture remain immediate and stationary. Reduced motion disables new accents; no perpetual ambient effects or dependencies. This supersedes the earlier static-decoration-only note for entry behavior; financial meanings/privacy rules are unchanged. See MOTION for recipe/license mapping.

## Banking navigation —27September2026

Latest bottom navigation supersedes the separate capture dock: white5item bar, violet active tab and raised lavender center Plus/Sparkles, visible labels Dashboard/Dompet/Tambah/Transaksi/Anggaran. Three-option chooser with SVG/tinted icons and clear descriptions. Secondary menu cards immediately follow overview. Desktop rail preserved. Styles src/navigation.css after select.css/before motion.css; no new motion dependencies. See [capture](NAVIGATION-CAPTURE.md).

Mobile bottom navigation uses an explicit8px gap between all five buttons so active/hover surfaces do not touch; unchanged safe-area padding and center capture button.
