# Acceptance criteria and implementation matrix

Legend: **Implemented** local starter code; **Foundation** contracts/schema/server functions exist but complete UX/hosted integration remains; **Planned** not implemented. This distinguishes foundation completion from full V1 completion.

| ID   | Requirement and acceptance                                                                          | Status / evidence                                                                                                                              |
| ---- | --------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| AC01 | Family aggregates all active wallets, personal uses wallet_owner; actor remains independent         | Implemented; finance/domain + browser tests                                                                                                    |
| AC02 | shared wallet has null wallet_owner, personal requires same-tenant member                           | Implemented; DB constraints/demo                                                                                                               |
| AC03 | Completed income/expense affect balance; pending/cancelled/trash excluded                           | Implemented; domain and PostgreSQL tests                                                                                                       |
| AC04 | Transfer principal conserved, fee one linked expense; same source/destination rejected              | Implemented; SQL/domain checks                                                                                                                 |
| AC05 | Creator+Owner trash, actor alone denied, Owner restore within30d                                    | Implemented; actual role SQL tests + browser smoke                                                                                             |
| AC06 | Expired30d parent + fee/splits/tags purged; audit identifiers retained                              | Foundation; maintenance/RPC, schedule external                                                                                                 |
| AC07 | Retention immediate/24h default/7d/keep starts after confirm; abandoned24h                          | Partial; schema/functions + image upload/review UI implemented; actual hosted Storage/retention exercise remains                               |
| AC08 | Quick Add works without AI and cannot write until confirmation                                      | Implemented; parser and browser preview/confirm tests                                                                                          |
| AC09 | Every AI result becomes editable draft; <70% critical fields acknowledged, 70–89% warn              | Partial; validated image/text draft + editable human review UI, SQL confirmation/adapter tests; hosted provider/confirm pending                |
| AC10 | BYOK server encryption, requester isolation, no browser persisted API key                           | Foundation; Edge and crypto tests, hosted credential flow pending                                                                              |
| AC11 | Email/password + Google authentication and household onboarding                                     | Foundation; auth code complete, provider credentials/project config external                                                                   |
| AC12 | Cross-household SELECT/RPC/direct DML denied; tenant reference injection rejected                   | Implemented SQL; hosted JWT/PostgREST exercise still required                                                                                  |
| AC13 | All writes retries idempotent; changed payload/key misuse rejected                                  | Implemented; PostgreSQL tests                                                                                                                  |
| AC14 | Split sums exact, categories one-level, tags tenant-bound                                           | Partial; split create/edit UI + sum validation, tenant tag preservation; tag editor planned                                                    |
| AC15 | Budget periods/rollover/custom thresholds; overspending warns, never blocks                         | Partial; create/edit periods/category/wallet/thresholds + overrun tested; automatic rollover closure planned                                   |
| AC16 | Virtual goal tracking does not move wallet funds, history/recommendation available                  | Partial; goal editor/archive, virtual contributions/history/correction/monthly arithmetic tested; advanced insights/hosted pilot pending       |
| AC17 | Recurring ask/auto template generates exactly-once approved occurrence                              | Planned runner; template table exists                                                                                                          |
| AC18 | Five cards and priority charts, hide balances, mobile navigation with secondary menu                | Implemented/polished; 320/390/1440px browser checks, fintech cards + actual weekly cashflow/masking; mobile menu focus and transfer fee tested |
| AC19 | Reports date range/comparison/insights, advanced search/filter, Ctrl+K                              | Partial; basic search + header/keyboard entry + empty reset tested; full reports/palette planned                                               |
| AC20 | CSV formula-safe + schema_version1 JSON export; validate/dry-run restore                            | Export implemented; full backup JSON/restore engine planned                                                                                    |
| AC21 | Weekly encrypted backup includes auth/household/wallet/ledger/categories/tags/budget/goals/settings | Foundation; scripts/workflow; scheduler/secrets and restore drill external                                                                     |
| AC22 | Configurable session lock default15m requires reauthentication                                      | Foundation; real-mode inactivity signout/UI; hosted validation pending                                                                         |
| AC23 | Public/self-host-friendly source, env examples, MIT, CI, explicit setup                             | Implemented; docs and workflows; no remote publication performed                                                                               |

| AC24 | Creator/Owner edit with atomic fees/splits, immutable creator, exact retry/version conflict/history | Implemented local + migration deployed Development;52 unit/SQL and13 browser tests; hosted authenticated pilot pending |

| AC25 | Receipt image validates,uploads privately,reviews without auto-commit,recovers errors | Partial;4 adapter tests+2 browser demo tests; actual hosted upload/provider flow pending |

## Hosted release checks

Create two households and three real test users. Verify raw REST queries and RPC calls using each JWT; attempt cross-tenant wallet/category/actor IDs, direct creator spoof, member trash of other's record, owner restore after expiry, duplicate concurrent saves, user membership revocation. Verify private Storage access with confirmed/unconfirmed receipts, check actual bytes deleted in all retention modes and measure scheduler lag. Exercise email/Google redirects and inactivity reauthentication on browser reload and background tab.

For AI use disposable provider key: no credential visible in browser storage/response/Git logs, model prompt injection does not become tool calls, uncertain/missing amount cannot commit without review, wrong tenant wallet ID dropped, provider timeout/quota preserves manual input. Confirm save updates only one ledger transaction and linked fee when present.

For backup decrypt with operator-held age identity, validate checksum and restore on matching staging Supabase stack. Reconcile wallet balances and row counts, auth login and tenant isolation; verify blob policy vs restored metadata. Full V1 release requires planned criteria completed, not merely local build success.

| AC26 | Manage categories/subcategories/tags; safe used deletion; tagged create/revise/search/history | Implemented local + Development migration6;59 unit/SQL +18 browser tests; hosted pilot pending |

| AC27 | Owner invites/revokes; verified email-bound join grants Member; expiry/retry/private token storage | Implemented + Development migration7;66 unit/SQL+20 browser tests; hosted two-account pilot pending |

| AC28 | Cloudflare Development serves real auth UI with exact Supabase Auth/CORS, CSP and SPA fallback | Live canonical URL, hosted browser/HTTP/CORS smoke passed; authenticated pilot and fullProductionrelease pending |

| AC29 | Banking-inspired recorded balance and cash shortcuts; expense/income/transfer previews cancel without moving money; wallet/budget/goals navigation | Implemented; 21 browser tests passed, desktop/mobile screenshots inspected, 320px no page overflow |

| AC30 | Capture actions removed from heading; <=800px navigation fixed at bottom, actions above, no overlap or overflow | Browser geometry/scroll regression added; final results in VERIFICATION.md |

| AC31 | Premium green layout, compact saldo, three ledger shortcuts, bottom navigation retained | Implemented;66 unit/SQL +21 browser tests pass; local screenshots inspected |

| AC32 | Rebuilt overview: balance/cashflow/capture together, separate plans; masking and320–1440px responsive layout | Implemented;66 unit/SQL +22 browser tests pass; screenshots inspected |

| AC33 | Billow-reference Welcome/CTA/FAQ/demo cockpit links to real Auth; actual cockpit has weekly income/expense lines and compact planning cards | Implemented; final checks in VERIFICATION.md |

| AC34 | Transitions.dev motion for pages, native dialogs/menu, icons, Welcome/FAQ, notices/loading; reduced motion, immediate privacy masking and keyboard lifecycle remain correct | Implemented;66 unit/SQL +29 browser tests passed; actual hosted FAQ animation, shipped CSS and reduced motion verified; authenticated hosted pilot remains pending |

| AC35 | Consistent DM Sans headings/UI/wordmark, responsive readable typography and fresh preview lifecycle | Implemented;66 unit/SQL +30 browser tests passed; hosted font family/600 weight/320px32px heading verified; screenshots inspected |

| AC36 | Bolder hierarchy: real DM Sans800 hero,700 headings/money/wordmark/CTA,600 menu/labels with readable supporting copy | Implemented;66 unit/SQL +30 browser passed; hosted hero800/wordmark700 verified;320px no overflow |

| AC37 | Transaction calendar in Indonesian/DD/MM/YYYY;24-hour WIB independent of browser locale/timezone; invalid dates block commit; keyboard and320px seven-column layout; draft remains uncommitted until confirm | Implemented; final evidence in VERIFICATION.md; hosted authenticated pilot remains pending |

| AC38 | Dashboard V2 reel: multicolor bento, charcoal balance, white cashflow, summary cards above; desktop accessible icon rail/mobile labelled bottom dock; lightweight opacity-only120ms navigation with immediate masking | Implemented; final verification/release evidence in VERIFICATION.md |

| AC39 | Registration asks globally unique normalized username; login accepts username/email; legacy accounts claim own handle in Settings; no anonymous email map or password bypass | Implemented; local SQL/unit/Edge/browser and Development deployment evidence in VERIFICATION.md; real-account credential pilot remains pending |

| AC40 |13Supabase Auth/Security email subjects/HTML in Indonesian, real variables/links, responsive email layout, existing SMTP/toggles preserved | Production push accepted; subject diff0updates,7security toggles false;26local layouts/preview passed; actual inbox/Auth flows pending |

Hosted Production own-account signup/email confirmation/username login: passed by user report27September2026. Separate from automatic local tests; two-user/household isolation, financial/AI/Storage and backup/restore gates remain pending.

| AC41 | Public Welcome demo and input examples use generic identities; personal name absent from shipped frontend | Source/hosted bundle and labels verified on Production c76a3570 and Development33611182; existing78unit/SQL+33browser passed |

## Catalog refresh —27September2026

AC18/AC31–AC35 remain enforced with the refreshed catalog design: real balance/cashflow, scoped wallets, positive-limit budget usage, no invented growth, immediately removed budget geometry/percentage on money masking. Desktop saldo left/chart right, mobile saldo/cashflow precede secondary summaries. All actions still open existing editable review/forms; no fake payment/bank/provider workflows. Existing browser coverage plus catalog-refresh.spec.ts verifies narrow-screen keyboard budget access, scope/no-budget state, masked derived usage and reduced motion. Hosted backend/backup/auth pilot limits remain as separately recorded; a visual refresh does not mark full V1 complete.

| AC42 | All24native dropdowns share modern panel/selected/check/scroll/focus styling in supported browsers, with functional native fallback; keyboard/Escape/required/time semantics preserved | Implemented;78unit/SQL+36browser and scope/time screenshots; Development release evidence in VERIFICATION |

Component motion refinement preserves AC18/AC36: finite decorative entrances and hover feedback only, native keyboard/modal/dropdown interactions and immediate masking; new component-motion browser coverage plus full37tests passed. Navigation/financial values do not gain heavier animations. Release evidence in VERIFICATION.

AC22 fresh-login regression: a new authenticated session starts a fresh activity window; restoring an expired session still locks; same-user revalidation does not reset the timestamp. Four configured-mode mocked-network browser tests pass, alongside37demo regressions. See SESSION-AUTH/VERIFICATION for evidence and real-user pilot limits.

| AC43 | Bottom5items Dashboard/Dompet/Tambah/Transaksi/Anggaran; secondary destinations below Dashboard overview; center3choices; camera permission only on Foto, valid photo/cleanup/denial/retry, automatic AI draft with explicit final confirmation | Implemented; local/Development verification in VERIFICATION; device/provider pilot pending |

Production promotion27September2026: AC22/AC42/AC43 and component motion now shipped to Productione2da5fd5 as well as Development78e8c110. Release tests78unit/SQL+41demo browser+5configured-mode and public hosted checks passed; real-device/AI/financial gates remain pending as recorded in VERIFICATION.
