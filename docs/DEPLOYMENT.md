# Local, Supabase and Cloudflare setup

## Local demo

Node >=22.12; npm ci; npm run dev:demo. Explicit demo mode always starts a memory-only example household, even with Supabase environment files present. npm run preview serves built assets locally. Vite dev and preview default bind127.0.0.1; choose --host0.0.0.0 only if intentionally exposing LAN.

## Development and Production environments

Target Production terbaru pengguna: https://masuksaku.my.id; email gratis Resend. [Paket dan status Production](PRODUCTION.md) memuat script persiapan/deploy terpisah serta dependensi SMTP/DNS/backup. Development primary CLI link dipertahankan; jangan apply konfigurasi Development pada Production.

The user's public project URLs/keys are saved in ignored `.env.development.local` and `.env.production.local`. `npm run dev` loads Development; `npm run build:development` builds Development; `npm run build` builds Production into dist. `npm run build:demo` builds an isolated memory demo. Never reuse a generic `.env.local` that accidentally overrides the intended project; Vite shell environment variables have higher priority. Browser tests start their own explicit demo server.

Development ref: `kxezrgvnpoaqzcseymts`; Production ref: `snqkfrcxjfdjkwxjiabc`. CLI is linked to Development. [Connection status](SUPABASE-STATUS.md) records what was actually deployed. Production frontend configuration alone does not provision a backend.

## Local Supabase (optional)

Install Docker Desktop and official Supabase CLI first. CLI 2.118.0 is now available through `npx --yes supabase`; Docker is still required only for the optional local stack. Hosted migrations/functions were installed without Docker.

```powershell
supabase start
supabase db reset
```

reset is for disposable local stack only: it deletes local DB data. For a new hosted project use link/db push; never use reset against personal production data. Auth email confirmation can be inspected in local mail UI. Google requires valid provider credentials; keep disabled locally unless configured. Use URL/anon key printed by CLI in frontend .env.local and localhost Edge origins in function environment.

## Hosted project

Create fresh Supabase project, then:

```powershell
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

Alternative SQL Editor: apply 001schema →002security_rpc →003storage, exactly once, or use `supabase/bootstrap.sql` for a new empty project. Do not re-run bootstrap against Development: its migrations are already applied. Avoid copying test auth/storage scaffolding to hosted project; those schemas are platform-owned. Configure REST max rows10000 to match starter loader; lower limits require a paginated loader first (see repository.ts). Expose public/graphql_public only; Storage uses its dedicated API, and **private must stay unexposed**.

Auth Site URL = production frontend. Redirect allowlist include that exact origin plus http://localhost:5173 and http://127.0.0.1:5173 when needed; use exact preview URL rather than blanket wildcard for production secrets. Enable email signup/confirmation; configure SMTP delivery/password recovery before pilot. Enable Google in Supabase dashboard with Google clientID/clientSecret; Google authorized callback points to Supabase Auth callback, application redirect to frontend origin. Do not put Google secret in frontend environment.

## Edge secret setup

Generate encryption and maintenance values without saving them in Git:

```powershell
# Run manually; place each output in secret manager and Edge secret configuration.
node -e "process.stdout.write(require('node:crypto').randomBytes(32).toString('base64'))"
```

Use a different random output for each secret. Copy supabase/functions/.env.example to supabase/functions/.env.local and fill AI_ENCRYPTION_KEY (base64 of32 random bytes), MAINTENANCE_SECRET, ALLOWED_ORIGINS (comma-separated exact frontend origins). Supabase supplies SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY at runtime. For self-host/local supply these securely in Edge environment.

```powershell
supabase secrets set --env-file supabase/functions/.env.local
supabase functions deploy ai-credentials
supabase functions deploy ai-preview
supabase functions deploy ai-confirm
supabase functions deploy attachment-upload
supabase functions deploy maintenance
```

Docker-free CLI deployment: `npx --yes supabase functions deploy --project-ref PROJECT_REF --use-api`. Each function's config.toml entry declares the shared `functions/deno.json` import map, required by the hosted bundler. Before pushing hosted configuration, use `npx --yes supabase config diff --project-ref PROJECT_REF` to review changes. Current local Auth origins are Development-only; choose the deployed domain before applying config to Production.

User functions have platform verify_jwt=false and explicitly verify the token by Auth getUser plus table membership. Maintenance accepts its own high-entropy secret. Do not remove those internal checks. For local functions: supabase functions serve --env-file supabase/functions/.env.local.

## Cloudflare Pages

Connect your own GitHub repository manually, or upload dist with a supported Pages deployment tool. Build command npm run build, output directory dist, root repository directory, Node24. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (public key) in Pages build environment. Build values are in static assets; never put server keys there. No Cloudflare secrets are needed for AI because backend is Supabase Edge.

Pages treats a project with no root404.html as SPA; this starter uses no404.html and no Cloudflare runtime bindings. Security headers are copied from public/_headers. For self-host hostname replace connect-src allowlist in that file. Production CSP does not permit Vite dev script behavior; dev local server does not apply Pages _headers.

## Operational schedules

Configure backup workflow secrets in your repository, including database host/user/password/port and age public recipient. Weekly Sunday19UTC = Monday02WIB. Store age private identity offline; never repository secret unless using a dedicated restore runner. Configure MAINTENANCE_URL + MAINTENANCE_SECRET for cleanup workflow. GitHub schedule timing is best-effort; external operator cron is preferable for precise retention or inactive repositories. Workflows are source templates until you create the remote repository and supply secrets.

References: [Cloudflare Pages SPA behavior](https://developers.cloudflare.com/pages/configuration/serving-pages/), [Supabase Edge Auth](https://supabase.com/docs/guides/functions/auth), [Supabase self-host Docker](https://supabase.com/docs/guides/self-hosting/docker).

## OpenRouter existing-install upgrade

Apply migration202609270005 first,deploy ai-preview next,then ai-credentials. This avoids accepting a new OpenRouter key while an old preview endpoint still calls OpenAI. Keep original AI_ENCRYPTION_KEY; old credentials stay encrypted/inactive until replaced by user. No frontend API key environment variable. Fresh bootstrap includes all5 migrations.

## Development live —27September2026

[Masuk Saku Development](https://masuk-saku-development.pages.dev) dipublish via Direct Upload dengan Wrangler4.112.0. Script Windows dan origin/Auth/CORS/CSP serta batas pilot didokumentasikan di [CLOUDFLARE.md](CLOUDFLARE.md). SupabaseProduction belum dipasang; jangan deploy dist sebagaiDevelopment.
