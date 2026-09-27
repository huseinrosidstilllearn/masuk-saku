# Instructions for contributors and agents

Read docs/AGENT-HANDOFF.md, docs/PRD.md, docs/TECHNICAL-SPEC.md and docs/ACCEPTANCE.md before changing behavior. If local NOTES.md exists, read its latest handoff first; it is private and intentionally absent from the public repository. Latest direct user instructions take precedence.

- Work directly in the requested project unless isolation is requested.
- IDR whole rupiah, integer math only; preserve wallet_owner, transaction_actor, transaction_scope, scope_member_id and immutable created_by.
- Personal dashboard aggregates wallet ownership; shared wallets belong to household. Creator/Owner may trash, Owner may restore; trash30days.
- Financial writes use authorized RPC, tenant membership checks and composite foreign keys. Never trust client actor or user metadata as authorization.
- AI only produces editable drafts; explicit human confirmation commits. Credentials remain encrypted server-side, never browser persistence/source/logs. OpenRouter free-only, no paid fallback.
- Attachment retention default24h after confirmation, configurable immediate/7d/keep. Preserve weekly encrypted backup and isolated restore workflow.
- Browser web app only; no native/PWA/offline ledger expansion. Use named Lucide SVG icons, no emoji/Unicode icon replacements.
- Active visual system: gray/white/charcoal with lime, peach, coral and lavender. Read docs/DESIGN-SYSTEM.md, UI-REFERENCES.md and MOTION.md. Keep money masking immediate, reduced motion supported and navigation light.
- Mobile navigation: Dashboard, Dompet, central Tambah, Transaksi, Anggaran. Capture offers Upload struk/Foto struk/Tambah manual; camera only after explicit selection, tracks cleaned on exit/hidden. Never auto-commit AI output.
- Indonesian date/time is WIB24h. Real-data charts only; generic public examples without personal names.
- Username/email and Google auth must preserve inactivity locking; new login resets activity, same-user revalidation does not. Run configured-mode auth tests.
- Run npm run check, npm run test:e2e, npm run test:auth and npm run format:check for application/financial changes. Deno checks/tests for Edge changes. Append migrations; never rewrite deployed migrations.
- Do not publish environments, backups, receipts, raw conversations or private notes. Run node scripts/check-public-source.mjs against staged source before public pushes.
- Update docs/AGENT-HANDOFF.md and local NOTES.md with actual changes, checks, environment and unresolved gates. Never call V1 complete based only on demo/mock tests.
