# Folder structure

```text
Masuk Saku (Manajemen Keuangan)/
├── README.md, NOTES.md, AGENTS.md, LICENSE, CONTRIBUTING.md, SECURITY.md
├── package.json, package-lock.json, tsconfig.json, vite.config.ts
├── .env.example, .gitignore, .prettierrc.json, .prettierignore
├── index.html
├── public/
│   ├── favicon.svg
│   └── _headers                      # Cloudflare security headers
├── src/
│   ├── main.tsx, App.tsx, styles.css
│   ├── components/Auth.tsx           # Auth and household onboarding
│   ├── components/Icon.tsx           # Shared decorative SVG icon set
│   ├── components/TransactionForm.tsx # Editable preview/confirmation
│   ├── domain/types.ts               # Domain interfaces
│   ├── domain/finance.ts             # Integer ledger/ownership/budget rules
│   ├── domain/quick-add.ts           # Deterministic parser
│   ├── domain/finance.test.ts
│   └── lib/{supabase,demo,repository,snapshot-schema,export}.ts
├── supabase/
│   ├── config.toml
│   ├── migrations/                   # Schema → RLS/RPC → Storage
│   └── functions/
│       ├── deno.json, deno.lock, .env.example
│       ├── _shared/{http,crypto,ai-schema,security_test}.ts
│       ├── ai-credentials/index.ts
│       ├── ai-preview/index.ts
│       ├── ai-confirm/index.ts
│       ├── attachment-upload/index.ts
│       └── maintenance/index.ts
├── tests/database.test.ts            # Actual PostgreSQL RLS/RPC tests
├── tests/e2e/demo.spec.ts             # Browser daily-loop/mobile tests
├── playwright.config.ts
├── scripts/{backup.ps1,backup.sh}
├── .github/workflows/{ci,backup,maintenance}.yml
├── docs/                            # PRD, spec, API, operations and evidence
│   ├── source/PRD-conversation-excerpt.md
│   └── screenshots/{desktop,mobile,auth-desktop,auth-mobile}.png
└── dist/, node_modules/, work/, backups/ # Generated/ignored
```

Business rules in domain are framework-independent. Repository switches demo/Supabase at one boundary. Preview UI never computes privileged permissions by actor; database enforces creator/Owner. Add feature modules for transaction revision, budgeting/contributions and reports as roadmap slices rather than growing App.tsx indefinitely. No real household data or credentials in source/demo.

Hosting Development menambahkan scripts/deploy-pages-development.ps1, scripts/pages-preflight.mjs dan docs/CLOUDFLARE.md. Artifact upload di work/cloudflare-development (ignored) terpisah dari dist Production.
